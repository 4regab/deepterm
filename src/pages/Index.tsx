import ApiKeyInput, { API_KEY_STORAGE_KEY } from "@/components/ApiKeyInput";
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
import { ExtractionMode, checkApiKey, initializeGemini, extractKeyTerms } from "@/services/geminiService"; // Added extractKeyTerms
import { ExtractionResult } from "@/types";
import { AlignJustify, ArrowLeft, BookOpen, Clock, Edit, Eye, FileText, History, Info, List, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useCallback, useEffect, useState } from "react";

// Local storage key constants
// Using API_KEY_STORAGE_KEY from ApiKeyInput component
const RESULTS_STORAGE_KEY = "extraction_results";
const RATE_LIMIT_STORAGE_KEY = "extraction_rate_limit_data"; // New key for rate limiting
const MAX_EXTRACTIONS_PER_DAY = 10; // Rate limit constant
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const Index = () => {
  const [apiKeyProvided, setApiKeyProvided] = useState(false); // Keep for internal logic, but won't block UI
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState < ExtractionResult | null > (null);
  const [savedResults, setSavedResults] = useState < ExtractionResult[] > ([]);
  const [showSavedResults, setShowSavedResults] = useState(false);
  const [extractionMode, setExtractionMode] = useState < ExtractionMode | null > (null);
  const [extractionError, setExtractionError] = useState < string | null > (null); // State for error message
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false); // New state for modal
  const [pendingText, setPendingText] = useState < string | null > (null); // New state for interrupted submission
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();

  // New effect to handle pending text after API key is provided
  useEffect(() => {
    // Only proceed if the key is provided AND there's pending text
    if (apiKeyProvided && pendingText) {
      console.log("useEffect: Processing pending text after API key provided");
      
      // Use a small timeout to ensure state updates are processed first
      const timer = setTimeout(() => {
        // Store text in a local var before clearing state
        const textToProcess = pendingText;
        // Clear pending text first to avoid potential loops
        setPendingText(null);
        // Then process the text
        handleTextSubmit(textToProcess);
      }, 100);
      
      // Clean up timer if component unmounts during timeout
      return () => clearTimeout(timer);
    }
  }, [apiKeyProvided, pendingText]);

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

  useEffect(() => {
    // Load API key from local storage
    try {
      const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedApiKey) {
        const success = initializeGemini(storedApiKey);
        if (success && checkApiKey()) {
          setApiKeyProvided(true); // Update internal state
          console.log("Using API key from local storage");
        } else {
          console.warn("Stored API key is invalid or empty");
          localStorage.removeItem(API_KEY_STORAGE_KEY);
          setApiKeyProvided(false); // Update internal state
        }
      } else {
        console.log("No API key found in local storage");
        setApiKeyProvided(false); // Update internal state
      }
    } catch (error) {
      console.error("Error initializing with stored API key:", error);
      setApiKeyProvided(false); // Update internal state
    }

    loadSavedResults();
    // Removed apiKeyProvided from dependency array as it's now just internal state
  }, [loadSavedResults]);

  // Updated handleApiKeySubmit to accept a single key and handle modal closing
  const handleApiKeySubmit = (apiKey: string) => {
    try {
      const success = initializeGemini(apiKey);
      if (success && checkApiKey()) {
        setApiKeyProvided(true);
        // Save the single API key to local storage
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
        setIsApiKeyModalOpen(false); // Close modal on success

        toast({
          title: "API Key configured successfully",
          description: "Processing your request..."
        });

      } else {
        // Initialization failed (likely invalid key)
        setApiKeyProvided(false);
        localStorage.removeItem(API_KEY_STORAGE_KEY); // Ensure invalid key isn't stored
        // Keep modal open, show error within the modal or via toast
        toast({
          title: "Invalid API key",
          description: "The API key provided appears to be invalid or failed to initialize. Please check and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setApiKeyProvided(false);
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      // Keep modal open, show error
      toast({
        title: "Error setting API key",
        description: error instanceof Error ? error.message : "Please check your API key and try again.",
        variant: "destructive"
      });
    }
  };

  const handleTextSubmit = async (text: string) => {
    // --- API Key Check ---
    if (!checkApiKey()) {
      setPendingText(text); // Store the text
      setIsApiKeyModalOpen(true); // Open the modal
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key to proceed.",
        variant: "default",
      });
      return; // Stop execution
    }
    // --- End API Key Check ---


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
        description: `You have reached the free limit of ${MAX_EXTRACTIONS_PER_DAY} extractions per 24 hours. Please come back later.`,
        variant: "destructive",
      });
      return; // Stop the function execution
    }
    // --- End Rate Limiting Check ---

    setIsLoading(true);
    setExtractionError(null); // Clear previous errors
    try {
      console.log("DEBUG: Sending text to Gemini, length:", text.length);
      const currentMode = extractionMode || "full"; // Ensure mode is not null
      console.log("DEBUG: Mode:", currentMode);

      // Call geminiService directly
      const responseData = await extractKeyTerms(text, currentMode);

      console.log("DEBUG: Gemini Response received:", responseData);

      // --- Update Rate Limit Data on Success ---
      const updatedTimestamps = [...recentTimestamps, now];
      localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(updatedTimestamps));
      // --- End Update Rate Limit Data ---

      // Add timestamp and mode to the result before saving/displaying
      const resultWithTimestamp: ExtractionResult = {
        ...responseData,
        timestamp: new Date().toISOString(),
        extractionMode: currentMode,
      };

      console.log("DEBUG: Setting result state with:", resultWithTimestamp);
      setResult(resultWithTimestamp);

      // Save result
      const currentSavedResults = Array.isArray(savedResults) ? savedResults : [];
      const updatedResults = [resultWithTimestamp, ...currentSavedResults];
      setSavedResults(updatedResults);
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(updatedResults));
      toast({
        title: "Extraction complete",
        description: "Key terms have been extracted and saved.",
      });

    } catch (error) {
      console.error("DEBUG: Error extracting key terms:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error processing text";
      setExtractionError(errorMessage);

      // Specific handling for invalid API key error during extraction
      if (errorMessage.includes("API key not valid")) { // Check for specific Gemini error text
          setApiKeyProvided(false); // Force user to re-enter key
          localStorage.removeItem(API_KEY_STORAGE_KEY);
          setIsApiKeyModalOpen(true); // Re-open modal if extraction fails due to key
          toast({
              title: "Invalid API Key",
              description: "Your API key became invalid during processing. Please enter a valid key.",
              variant: "destructive",
          });
      } else {
          toast({
              title: "Error extracting key terms",
              description: errorMessage,
              variant: "destructive",
          });
      }
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

    { /* API Key Modal - Updated to match design in TextInput.tsx */ }
    <Dialog open={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen}>
      <DialogContent className="sm:max-w-md mx-4 rounded-xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="p-1.5 bg-[#ffead6] rounded-md neo-border inline-block">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 7.5V7C15 4.79086 13.2091 3 11 3C8.79086 3 7 4.79086 7 7V7.5C5.34315 7.5 4 8.84315 4 10.5V18C4 19.6569 5.34315 21 7 21H15C16.6569 21 18 19.6569 18 18V10.5C18 8.84315 16.6569 7.5 15 7.5Z" stroke="#FF5C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 14V17" stroke="#FF5C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            GEMINI API Key Required
          </DialogTitle>
          <DialogDescription className="text-neo-black">
            Please enter your Google AI Gemini API key to use the extraction features.
          </DialogDescription>
        </DialogHeader>
        <ApiKeyInput onSubmit={handleApiKeySubmit} />
      </DialogContent>
    </Dialog>

    <main className="container mx-auto px-3 py-5 md:px-4 md:py-8 flex-grow">
      { /* REMOVED: The initial conditional rendering based on apiKeyProvided */ }
      { /* ALWAYS Render the main content now */ }
      <>
        <div className="text-center mb-8">
          { /* ... H1 and P tags ... */ }
          <h1 className="text-3xl md:text-5xl font-bold font-heading mb-3 text-neo-black tracking-tight">
            <span className="bg-neo-accent text-neo-black px-2 py-1 neo-border shadow-neo">Reviewer Maker</span>
          </h1>
          <p className="text-neo-black text-lg max-w-xl mx-auto font-medium">Create organized notes from your text with AI-powered analysis</p>
        </div>

        <div className="flex justify-center mb-8">
          { /* ... Buttons for Extract New / Saved Results ... */ }
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
          { /* ... ProcessingIndicator ... */ }
          <ProcessingIndicator mode={extractionMode} />
        </div> : result ? <div className="flex justify-center mt-5">
          { /* ... ResultsDisplay section ... */ }
          <div className="w-full max-w-3xl">
            <Button variant="ghost" onClick={handleReset} className="mb-4 neo-border bg-white text-neo-black hover:bg-neo-bg border-neo-black shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to extraction
            </Button>
            <ResultsDisplay result={result} onReset={handleReset} />
          </div>
        </div> : showSavedResults ? <div className="flex justify-center">
          { /* ... Saved Results section ... */ }
          <div className="w-full max-w-3xl">
            <Card className="neo-border bg-white shadow-neo overflow-hidden rounded-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center text-neo-black">
                  <Clock className="w-5 h-5 mr-2 text-neo-accent" />
                  Saved Extractions
                </h2>

                {savedResults.length === 0 ? <div className="bg-neo-bg p-8 rounded-lg neo-border text-center">
                  { /* ... No saved results message ... */ }
                  <p className="text-neo-black">No saved extractions found.</p>
                  <Button onClick={handleViewExtractor} className="mt-4 bg-neo-accent text-neo-black neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    Create Your First Extraction
                  </Button>
                </div> : <div className="grid gap-4">
                  { /* ... Mapping saved results ... */ }
                  {savedResults.map((savedResult, index) => {
                    // Ensure keyTerms is an array before accessing length
                    const keyTermsCount = Array.isArray(savedResult.keyTerms) ? savedResult.keyTerms.length : 0;

                    return (
                      <div key={index} className="p-5 neo-border bg-white hover:bg-neo-bg transition-colors flex flex-col sm:flex-row sm:items-center justify-between rounded-lg shadow-neo-sm">
                        { /* ... Saved result details ... */ }
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
                          { /* ... View/Delete buttons ... */ }
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
          { /* ... Mode Selection or TextInput section ... */ }
          {extractionMode === null ? (
            <Card className="neo-border bg-white shadow-neo overflow-hidden rounded-lg">
              { /* ... Mode selection card content ... */ }
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center text-neo-black">
                  <div className="p-2 rounded-lg bg-neo-accent mr-3 neo-border">
                    <Sparkles className="h-4 w-4 text-neo-black" />
                  </div>
                  Choose Extraction Mode
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  { /* Mode selection buttons */ }
                  <div className="p-5 cursor-pointer transition-all rounded-lg neo-border border-2 border-neo-black bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" onClick={() => handleModeChange("full")}>
                    { /* ... Normal Extraction ... */ }
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg neo-border bg-neo-accent mr-2">
                        <AlignJustify className="h-4 w-4 text-neo-black" />
                      </div>
                      <h4 className="font-bold text-neo-black">Normal Extraction</h4>
                    </div>
                    <p className="text-sm text-neo-black">Extract complete definitions from text</p>
                  </div>

                  <div className="p-5 cursor-pointer transition-all rounded-lg neo-border border-2 border-neo-black bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" onClick={() => handleModeChange("sentence")}>
                    { /* ... One Sentence ... */ }
                    <div className="flex items-center mb-3">
                      <div className="p-2 rounded-lg neo-border bg-neo-accent2 mr-2">
                        <Edit className="h-4 w-4 text-neo-black" />
                      </div>
                      <h4 className="font-bold text-neo-black">One Sentence</h4>
                    </div>
                    <p className="text-sm text-neo-black">Get concise single-sentence definitions</p>
                  </div>

                  <div className="p-5 cursor-pointer transition-all rounded-lg neo-border border-2 border-neo-black bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" onClick={() => handleModeChange("keywords")}>
                    { /* ... Keywords Only ... */ }
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

          { /* ... How it works section ... */ }
          <Card className="neo-border bg-white shadow-neo overflow-hidden rounded-lg mb-6">
            { /* ... How it works card content (updated step 3) ... */ }
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
                      <li>Click "Extract" to analyze (API key needed here if not saved)</li>
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
                  <li>Click "Extract" to analyze (API key needed here if not saved)</li>
                  <li>View the extracted terms and meanings</li>
                  <li>Results are saved automatically</li>
                </ol>
              </>}
            </CardContent>
          </Card>

          { /* Display Extraction Error */ }
          { /* ... Error display ... */ }
          {extractionError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg neo-border shadow-neo-sm" role="alert">
              <p className="font-bold">Extraction Failed</p>
              <p>{extractionError}</p>
            </div>
          )}
        </div>}
      </>
    </main>

    <Footer />
  </div>;
};

export default Index;
