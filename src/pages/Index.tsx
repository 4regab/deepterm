import ApiKeyInput from "@/components/ApiKeyInput";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import ResultsDisplay from "@/components/ResultsDisplay";
import TextInput from "@/components/TextInput";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { sendSecureGeminiRequest } from "@/services/apiProxyService";
import { ExtractionMode, checkApiKey, initializeGemini } from "@/services/geminiService";
import { ExtractionResult } from "@/types";
import { AlignJustify, ArrowLeft, BookOpen, Clock, Edit, Eye, FileText, History, Info, List, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Local storage key constants
const API_KEYS_STORAGE_KEY = "gemini_api_keys";
const RESULTS_STORAGE_KEY = "extraction_results";
const RATE_LIMIT_STORAGE_KEY = "extraction_rate_limit_data"; // New key for rate limiting
const MAX_API_KEYS = 10;
const MAX_EXTRACTIONS_PER_DAY = 10; // Rate limit constant
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const Index = () => {
  const [apiKeyProvided, setApiKeyProvided] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [savedResults, setSavedResults] = useState<ExtractionResult[]>([]);
  const [showSavedResults, setShowSavedResults] = useState(false);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>(null);
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();

  const loadSavedResults = useCallback(() => {
    try {
      const storedResults = localStorage.getItem(RESULTS_STORAGE_KEY);
      if (storedResults) {
        const parsedResults = JSON.parse(storedResults) as ExtractionResult[];
        setSavedResults(parsedResults);
      }
    } catch (error) {
      console.error("Error loading saved results:", error);
      toast({
        title: "Error loading saved results",
        description: "There was a problem loading your saved results.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Load API keys from environment variables
  const loadEnvApiKeys = useCallback(() => {
    const envKeys: string[] = [];
    for (let i = 1; i <= MAX_API_KEYS; i++) {
      const key = import.meta.env[`VITE_GEMINI_API_KEY_${i}`] || "";
      if (key && key.length > 0 && key !== "your_gemini_api_key_here") {
        envKeys.push(key);
      }
    }
    return envKeys;
  }, []);

  useEffect(() => {
    // First check for API keys in environment variables
    const envApiKeys = loadEnvApiKeys();

    if (envApiKeys.length > 0) {
      try {
        // Initialize with environment API keys
        initializeGemini(envApiKeys);
        const isValidKey = checkApiKey();
        if (isValidKey) {
          setApiKeyProvided(true);
          console.log(`Using ${envApiKeys.length} API key(s) from environment variables`);
        } else {
          console.warn("Environment API key(s) are invalid or empty");
        }
      } catch (error) {
        console.error("Error initializing with environment API keys:", error);
      }
    }

    // If environment API keys are not valid, fall back to local storage
    if (!apiKeyProvided) {
      try {
        const storedApiKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
        if (storedApiKeys) {
          const parsedKeys = JSON.parse(storedApiKeys) as string[];

          if (parsedKeys && parsedKeys.length > 0) {
            initializeGemini(parsedKeys);
            const isValidKey = checkApiKey();
            if (isValidKey) {
              setApiKeyProvided(true);
              console.log(`Using ${parsedKeys.length} API key(s) from local storage`);
            } else {
              console.warn("Stored API key(s) are invalid or empty");
            }
          }
        } else {
          console.log("No valid API keys found in environment variables or local storage");
        }
      } catch (error) {
        console.error("Error initializing with stored API keys:", error);
      }
    }

    loadSavedResults();
  }, [loadSavedResults, apiKeyProvided, loadEnvApiKeys]);

  const handleApiKeySubmit = (apiKeys: string[]) => {
    try {
      initializeGemini(apiKeys);
      if (checkApiKey()) {
        setApiKeyProvided(true);
        // Save API keys to local storage
        localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(apiKeys));

        const keyMessage = apiKeys.length > 1
          ? `${apiKeys.length} API keys set with automatic rotation for reliability.`
          : "API key set successfully.";

        toast({
          title: "API Keys configured successfully",
          description: `You can now extract key terms from your text. ${keyMessage}`
        });
      } else {
        toast({
          title: "Invalid API keys",
          description: "The API keys provided appear to be invalid. Please check and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error setting API keys",
        description: "Please check your API keys and try again.",
        variant: "destructive"
      });
    }
  };

  const handleTextSubmit = async (text: string) => {
    // --- Rate Limiting Check ---
    const now = Date.now();
    let extractionTimestamps: number[] = [];
    try {
      const storedTimestamps = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      if (storedTimestamps) {
        extractionTimestamps = JSON.parse(storedTimestamps);
      }
    } catch (error) {
      console.error("Error reading rate limit data:", error);
      // Decide if you want to proceed or block in case of storage error
    }

    // Filter timestamps to keep only those within the last 24 hours
    const recentTimestamps = extractionTimestamps.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    );

    if (recentTimestamps.length >= MAX_EXTRACTIONS_PER_DAY) {
      toast({
        title: "Free Limit Reached", // Updated title
        description: `You have reached the free limit of ${MAX_EXTRACTIONS_PER_DAY} extractions per 24 hours. Please come back after 24 hours to continue using the tool.`,
        variant: "destructive",
      });
      return; // Stop the function execution
    }
    // --- End Rate Limiting Check ---

    setIsLoading(true);
    try {
      // Use the secure proxy service instead of direct API calls
      const response = await sendSecureGeminiRequest({
        prompt: text,
        mode: extractionMode || "full",
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to process text");
      }

      // --- Update Rate Limit Data on Success ---
      const updatedTimestamps = [...recentTimestamps, now];
      localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(updatedTimestamps));
      // --- End Update Rate Limit Data ---


      const extractionResult = response.data;
      const resultWithTimestamp = {
        ...extractionResult,
        timestamp: new Date().toISOString(),
        extractionMode: extractionMode,
      };
      setResult(resultWithTimestamp);
      // Ensure savedResults is an array before spreading
      const currentSavedResults = Array.isArray(savedResults) ? savedResults : [];
      const updatedResults = [resultWithTimestamp, ...currentSavedResults];
      setSavedResults(updatedResults);
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(updatedResults));
      toast({
        title: "Extraction complete",
        description: "Key terms have been extracted and saved.",
      });
    } catch (error) {
      console.error("Error extracting key terms:", error);
      toast({
        title: "Error extracting key terms",
        description: error instanceof Error ? error.message : "Please check your text and API key, then try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  const handleViewSavedResults = () => {
    setShowSavedResults(true);
    setResult(null);
  };

  const handleViewExtractor = () => {
    setShowSavedResults(false);
    setResult(null);
  };

  const handleSelectResult = (selectedResult: ExtractionResult) => {
    setResult(selectedResult);
    setShowSavedResults(false);
  };

  const handleDeleteResult = (indexToDelete: number) => {
    const updatedResults = savedResults.filter((_, index) => index !== indexToDelete);
    setSavedResults(updatedResults);
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(updatedResults));
    toast({
      title: "Result deleted",
      description: "The saved extraction has been removed."
    });
  };

  const handleModeChange = (mode: ExtractionMode) => {
    setExtractionMode(mode);
    toast({
      title: `Extraction Mode: ${getModeTitle(mode)}`,
      description: getModeDescription(mode)
    });
  };

  const getModeTitle = (mode: ExtractionMode): string => {
    switch (mode) {
      case "full":
        return "Normal Extraction";
      case "sentence":
        return "One Sentence Definitions";
      case "keywords":
        return "Keywords Only";
      default:
        return "Custom Extraction";
    }
  };

  const getModeDescription = (mode: ExtractionMode): string => {
    switch (mode) {
      case "full":
        return "Extract full definitions and explanations from the text.";
      case "sentence":
        return "Extract only a single sentence definition for each key term.";
      case "keywords":
        return "Extract only keywords for each key term.";
      default:
        return "Custom extraction mode.";
    }
  };

  const getModeIcon = (mode: ExtractionMode) => {
    switch (mode) {
      case "full":
        return <AlignJustify className="h-4 w-4 mr-2" />;
      case "sentence":
        return <Edit className="h-4 w-4 mr-2" />;
      case "keywords":
        return <List className="h-4 w-4 mr-2" />;
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  return <div className="min-h-screen bg-neo-bg flex flex-col">
    <Navbar />

    <main className="container mx-auto px-3 py-5 md:px-4 md:py-8 flex-grow">
      {!apiKeyProvided ? <div className="flex justify-center mt-4 md:mt-8">
        <ApiKeyInput onSubmit={handleApiKeySubmit} />
      </div> : <>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold font-heading mb-3 text-neo-black tracking-tight">
            <span className="bg-neo-accent text-neo-black px-2 py-1 neo-border shadow-neo">Reviewer Maker</span>
          </h1>
          <p className="text-neo-black text-lg max-w-xl mx-auto font-medium">Create organized notes from your text with AI-powered analysis</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white shadow-neo neo-border rounded-lg overflow-hidden p-1 flex">
            <Button variant={!showSavedResults ? "default" : "outline"} onClick={handleViewExtractor} className={`rounded-lg border-2 px-6 ${!showSavedResults ? 'bg-neo-accent2 text-neo-black border-neo-black' : 'text-neo-black border-transparent hover:border-neo-black hover:text-neo-black'}`}>
              <BookOpen className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Extract New</span>
              <span className="sm:hidden">New</span>
            </Button>
            <Button variant={showSavedResults ? "default" : "outline"} onClick={handleViewSavedResults} className={`rounded-lg border-2 px-6 ${showSavedResults ? 'bg-neo-accent3 text-neo-black border-neo-black' : 'text-neo-black border-transparent hover:border-neo-black hover:text-neo-black'}`}>
              <History className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Saved Results</span>
              <span className="sm:hidden">Saved</span> ({savedResults.length})
            </Button>
          </div>
        </div>

        {isLoading ? <div className="flex justify-center mt-5 md:mt-8">
          <ProcessingIndicator mode={extractionMode} />
        </div> : result ? <div className="flex justify-center mt-5">
          <div className="w-full max-w-3xl">
            <Button variant="ghost" onClick={handleReset} className="mb-4 neo-border bg-white text-neo-black hover:bg-neo-bg border-neo-black shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to extraction
            </Button>
            <ResultsDisplay result={result} onReset={handleReset} />
          </div>
        </div> : showSavedResults ? <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <Card className="neo-border bg-white shadow-neo overflow-hidden rounded-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center text-neo-black">
                  <Clock className="w-5 h-5 mr-2 text-neo-accent" />
                  Saved Extractions
                </h2>

                {savedResults.length === 0 ? <div className="bg-neo-bg p-8 rounded-lg neo-border text-center">
                  <p className="text-neo-black">No saved extractions found.</p>
                  <Button onClick={handleViewExtractor} className="mt-4 bg-neo-accent text-neo-black neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    Create Your First Extraction
                  </Button>
                </div> : <div className="grid gap-4">
                  {savedResults.map((savedResult, index) => {
                    // Ensure keyTerms is an array before accessing length
                    const keyTermsCount = Array.isArray(savedResult.keyTerms) ? savedResult.keyTerms.length : 0;

                    return (
                      <div key={index} className="p-5 neo-border bg-white hover:bg-neo-bg transition-colors flex flex-col sm:flex-row sm:items-center justify-between rounded-lg shadow-neo-sm">
                        <div className="mb-3 sm:mb-0">
                          <h3 className="font-semibold text-lg text-neo-black">{savedResult.title}</h3>
                          <div className="text-sm text-neo-muted flex flex-wrap items-center gap-x-2 mt-1">
                            <span className="inline-flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {savedResult.timestamp ? new Date(savedResult.timestamp).toLocaleDateString() : "Date unknown"}
                            </span>
                            <span>•</span>
                            <span>{keyTermsCount} terms</span> {/* Use the safe count */}
                            {savedResult.extractionMode && <>
                              <span>•</span>
                              <span className="flex items-center">
                                {getModeIcon(savedResult.extractionMode)}
                                {getModeTitle(savedResult.extractionMode)}
                              </span>
                            </>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSelectResult(savedResult)} className="flex-1 sm:flex-initial bg-neo-accent text-neo-black neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteResult(index)} className="text-red-500 bg-white hover:bg-red-50 flex-1 sm:flex-initial neo-border rounded-lg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>}
              </CardContent>
            </Card>
          </div>
        </div> : <div className="space-y-6 max-w-3xl mx-auto">
          {extractionMode === null ? (
            <Card className="neo-border bg-white shadow-neo overflow-hidden rounded-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center text-neo-black">
                  <div className="p-2 rounded-lg bg-neo-accent mr-3 neo-border">
                    <Sparkles className="h-4 w-4 text-neo-black" />
                  </div>
                  Choose Extraction Mode
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 cursor-pointer transition-all rounded-lg neo-border border-2 border-neo-black bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" onClick={() => handleModeChange("full")}>
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg neo-border bg-neo-accent mr-2">
                        <AlignJustify className="h-4 w-4 text-neo-black" />
                      </div>
                      <h4 className="font-bold text-neo-black">Normal Extraction</h4>
                    </div>
                    <p className="text-sm text-neo-black">Extract complete definitions from text</p>
                  </div>

                  <div className="p-5 cursor-pointer transition-all rounded-lg neo-border border-2 border-neo-black bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" onClick={() => handleModeChange("sentence")}>
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg neo-border bg-neo-accent2 mr-2">
                        <Edit className="h-4 w-4 text-neo-black" />
                      </div>
                      <h4 className="font-bold text-neo-black">One Sentence</h4>
                    </div>
                    <p className="text-sm text-neo-black">Get concise single-sentence definitions</p>
                  </div>

                  <div className="p-5 cursor-pointer transition-all rounded-lg neo-border border-2 border-neo-black bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" onClick={() => handleModeChange("keywords")}>
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg neo-border bg-neo-accent3 mr-2">
                        <List className="h-4 w-4 text-neo-black" />
                      </div>
                      <h4 className="font-bold text-neo-black">Keywords Only</h4>
                    </div>
                    <p className="text-sm text-neo-black">Create reviewer notes with just key terms and phrases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <TextInput
              onSubmit={handleTextSubmit}
              isLoading={isLoading}
              extractionMode={extractionMode}
              onResetMode={() => setExtractionMode(null)}
            />
          )}

          <Card className="neo-border bg-white shadow-neo overflow-hidden rounded-lg mb-6">
            <CardContent className={isMobile ? "p-0" : "p-6"}>
              {isMobile ? <Accordion type="single" collapsible>
                <AccordionItem value="how-it-works" className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center">
                      <div className="p-1.5 rounded-lg bg-neo-accent3 mr-2 neo-border">
                        <Info className="h-4 w-4 text-neo-black" />
                      </div>
                      <span className="font-bold text-neo-black">How it works</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <ol className="list-decimal pl-5 space-y-2 text-neo-black">
                      <li>Choose an extraction mode above</li>
                      <li>Enter your text or upload a document</li>
                      <li>Click "Extract" to analyze</li>
                      <li>View the extracted terms and meanings</li>
                      <li>Results are saved automatically</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion> : <>
                <h3 className="text-xl font-bold mb-4 flex items-center text-neo-black">
                  <div className="p-1.5 rounded-lg bg-neo-accent3 mr-2 neo-border">
                    <Info className="h-4 w-4 text-neo-black" />
                  </div>
                  How it works
                </h3>
                <ol className="list-decimal pl-5 space-y-2 text-neo-black">
                  <li>Choose an extraction mode above</li>
                  <li>Enter your text or upload a document</li>
                  <li>Click "Extract" to analyze</li>
                  <li>View the extracted terms and meanings</li>
                  <li>Results are saved automatically</li>
                </ol>
              </>}
            </CardContent>
          </Card>
        </div>}
      </>}
    </main>

    <Footer />
  </div>;
};

export default Index;
