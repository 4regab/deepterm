import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import ApiKeyInput, { API_KEY_STORAGE_KEY } from "@/components/shared/ApiKeyInput";
import { initializeGemini, checkApiKey as serviceCheckApiKey } from "@/services/geminiService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFlashcard } from "@/context/FlashcardContextDefinition";
import { useUserProfile } from "@/hooks/useUserProfile"; // Add UserProfileHook
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Flashcard, FlashcardDeck, FlashcardDisplayMode } from "@/types/flashcard";

const FlashcardCreationForm = () => {
  const {
    activeDeck,
    isGenerating,
    setIsGenerating,
    saveFlashcardDeck
  } = useFlashcard();
  
  // Add UserProfile context for achievement tracking
  const { trackFlashcardCreated } = useUserProfile();

  const [deckTitle, setDeckTitle] = useState(activeDeck?.title || "");
  const [studyMaterial, setStudyMaterial] = useState(activeDeck?.studyMaterial || "");
  const [inputMode, setInputMode] = useState<'auto' | 'manual'>('auto');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([]);
  const [showCardsPreview, setShowCardsPreview] = useState(false);
  const [displayMode, setDisplayMode] = useState<FlashcardDisplayMode>(activeDeck?.displayMode || "term-first");
    const checkApiKey = () => {
    return serviceCheckApiKey();
  };
  
  useEffect(() => {
    checkApiKey();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === API_KEY_STORAGE_KEY) {
        checkApiKey();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const intervalCheck = setInterval(() => {
      checkApiKey();
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalCheck);
    };
  }, []);
  const handleApiKeySubmit = (apiKey: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    // Initialize the Gemini service with the new API key
    const initialized = initializeGemini(apiKey);
    setShowApiKeyInput(false);
    if (initialized) {
      toast.success("API Key saved and initialized successfully");
    } else {
      toast.error("Failed to initialize API Key");
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!studyMaterial.trim()) {
      toast.error("Please enter some study material");
      return;
    }

    const apiKeyPresent = checkApiKey();
    if (!apiKeyPresent) {
      setShowApiKeyInput(true);
      toast.error("API Key required to generate flashcards.");
      return;
    }
    
    setShowApiKeyInput(false);
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);

    try {
      setIsGenerating(true);
      
      // Import the same quiz generator that will be used for flashcards
      const { QuizGenerator } = await import("@/services/quizGenerator");
      const generator = new QuizGenerator(apiKey!);
      
      let extractedTerms;
      if (inputMode === 'manual') {
        const parsedInput = parseManualInput(studyMaterial);
        if (parsedInput.terms.length === 0) {
          toast.error("Could not parse any valid term-definition pairs. Please check your input format.");
          setIsGenerating(false);
          return;
        }
        extractedTerms = parsedInput.terms;
      } else {
        // Use the terms extractor from QuizGenerator
        const result = await generator.extractTermsAndDefinitions(studyMaterial);
        
        if (!result.success) {
          toast.error(result.error || "Failed to extract terms and definitions");
          setIsGenerating(false);
          return;
        }
        
        extractedTerms = result.data;
      }
      
      // Convert extracted terms to flashcards
      if (!extractedTerms) {
        toast.error("Failed to extract terms for flashcards");
        setIsGenerating(false);
        return;
      }
      
      const flashcards = extractedTerms.map(({ term, definition }) => ({
        id: uuidv4(),
        term,
        definition
      }));
      
      setGeneratedCards(flashcards);
      setShowCardsPreview(true);
      
    } catch (error) {
      toast.error("Failed to generate flashcards. Please try again.");
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error("Error generating flashcards:", error);
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSaveFlashcards = () => {
    if (generatedCards.length === 0) {
      toast.error("No flashcards to save");
      return;
    }

    // Prepare data according to the expected type for saveFlashcardDeck
    // Let the context handle ID generation for new decks and all timestamps
    const deckDataToSave: Omit<FlashcardDeck, 'id' | 'dateCreated' | 'lastModified'> & { id?: string } = {
      ...(activeDeck?.id ? { id: activeDeck.id } : {}), // Only include id if it exists
      title: deckTitle.trim() || `Flashcards ${new Date().toLocaleDateString()}`,
      cards: generatedCards,
      studyMaterial,
      displayMode
    };

    saveFlashcardDeck(deckDataToSave); // Pass the correctly typed object
    setShowCardsPreview(false);
    trackFlashcardCreated(generatedCards.length); // Track flashcard creation
    // The toast message is now handled within the saveFlashcardDeck function in the context
    // toast.success(`${generatedCards.length} flashcards saved successfully!`); // Removed redundant toast
  };

  const parseManualInput = (input: string) => {
    const lines = input.split(/\n+/).filter(line => line.trim() !== '');
    
    const terms = lines.map(line => {
      const separatorMatch = line.match(/(.+?)[-–—:;]+(.+)/);
      
      if (separatorMatch && separatorMatch[1] && separatorMatch[2]) {
        const term = separatorMatch[1].trim();
        const definition = separatorMatch[2].trim();
        
        if (term && definition) {
          return { term, definition };
        }
      }
      
      return null;
    }).filter(Boolean);
    
    return { 
      title: deckTitle || "Manual Flashcards",
      terms: terms as Array<{ term: string, definition: string }>
    };
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // Import the new file processing utilities
      const { processFileForFlashcards, isFileTypeSupported, formatFileSize, getFileLimits } = await import('@/utils/fileProcessing');
      
      // Validate file type
      if (!isFileTypeSupported(file)) {
        const limits = getFileLimits();
        toast.error(`Unsupported file type. Please use: ${limits.supportedTypes.join(', ')}`);
        return;
      }

      // Validate file size
      const limits = getFileLimits();
      if (file.size > limits.maxSize) {
        toast.error(`File size (${formatFileSize(file.size)}) exceeds the maximum limit of ${limits.maxSizeFormatted}`);
        return;
      }
      
      let loadingToast: ReturnType<typeof toast> | null = null;
      if (file.size > 500000) {
        loadingToast = toast.loading(`Processing ${file.name} with Gemini Files API...`);
      }
      
      // Process file using the new Files API approach
      const result = await processFileForFlashcards(file);
      
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      
      if (!result.success) {
        toast.error(result.error || "Failed to process file");
        return;
      }
      
      // Set the extracted text
      setStudyMaterial(result.text || "");
      
      toast.success(`Document "${file.name}" processed successfully with Gemini AI`);
      
    } catch (error) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error("File processing error:", error);
      }
      toast.error(`Failed to process file: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUpdateFlashcard = (index: number, field: 'term' | 'definition', value: string) => {
    const updatedCards = [...generatedCards];
    const currentCard = updatedCards[index];
    if (currentCard) {
      updatedCards[index] = {
        id: currentCard.id,
        term: field === 'term' ? value : currentCard.term,
        definition: field === 'definition' ? value : currentCard.definition
      };
      setGeneratedCards(updatedCards);
    }
  };

  const handleDeleteFlashcard = (index: number) => {
    const updatedCards = [...generatedCards];
    updatedCards.splice(index, 1);
    setGeneratedCards(updatedCards);
  };

  const handleAddBlankCard = () => {
    setGeneratedCards([
      ...generatedCards,
      {
        id: uuidv4(),
        term: "",
        definition: ""
      }
    ]);
  };

  if (showApiKeyInput) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-[#E5DEFF] neo-border shadow-neo rounded-md">
          <p className="text-[#1A1F2C] font-medium mb-4">
            Please provide your API key to generate flashcards.
          </p>
          <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowApiKeyInput(false)}
          className="w-full neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4">
        <Label className="text-lg sm:text-xl font-bold text-[#1A1F2C] flex flex-wrap items-center gap-2">
          Flashcard Deck Title (Optional)
          <span className="px-2 py-1 text-sm bg-[#9b87f5] text-white border-2 border-black -rotate-3 inline-block">
            Name It!
          </span>
        </Label>
        <Input 
          placeholder="Enter a title for your flashcard deck..." 
          className="bg-white neo-border shadow-neo hover:shadow-neo-lg transition-shadow duration-200 placeholder:text-[#8E9196] p-4 text-base sm:text-lg" 
          value={deckTitle} 
          onChange={e => setDeckTitle(e.target.value)} 
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg sm:text-xl font-bold text-[#1A1F2C] flex flex-wrap items-center gap-2">
            Study Material
            <span className="px-2 py-1 text-sm bg-[#9b87f5] text-white border-2 border-black rotate-2 inline-block">
              Step 1
            </span>
          </Label>
          
          <Tabs 
            value={inputMode} 
            onValueChange={(value) => setInputMode(value as 'auto' | 'manual')} 
            className="mb-2"
          >
            <TabsList className="neo-border bg-white">
              <TabsTrigger 
                value="auto" 
                className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white"
              >
                Auto Extract
              </TabsTrigger>
              <TabsTrigger 
                value="manual" 
                className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white"
              >
                Manual Entry
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="relative">
          {inputMode === 'auto' ? (
            <Textarea 
              placeholder="Paste your study material here... All key terms will be automatically extracted into flashcards." 
              className="min-h-[150px] sm:min-h-[200px] bg-white neo-border shadow-neo hover:shadow-neo-lg transition-shadow duration-200 resize-none placeholder:text-[#8E9196] p-4 text-base sm:text-lg" 
              value={studyMaterial} 
              onChange={e => setStudyMaterial(e.target.value)} 
            />
          ) : (
            <Textarea 
              placeholder="Enter term-definition pairs in format: Term - Definition (or Term : Definition). One per line." 
              className="min-h-[150px] sm:min-h-[200px] bg-white neo-border shadow-neo hover:shadow-neo-lg transition-shadow duration-200 resize-none placeholder:text-[#8E9196] p-4 text-base sm:text-lg" 
              value={studyMaterial} 
              onChange={e => setStudyMaterial(e.target.value)} 
            />
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.pdf,.docx" className="hidden" />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleFileClick} 
            className="absolute top-4 right-4 bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            title="Upload .txt, .pdf, or .docx files"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
        
        {inputMode === 'manual' && (
          <div className="bg-[#E5DEFF] p-4 rounded-md neo-border shadow-neo-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#9b87f5]" />
              <span className="font-medium">Manual Format Guidelines:</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm pl-7 list-disc">
              <li>Enter each term and its definition on a separate line</li>
              <li>Use a dash (-), colon (:), or similar separator between the term and its definition</li>
              <li>Example: <span className="font-mono bg-white px-2 py-0.5 rounded">Photosynthesis - The process by which plants convert light energy into chemical energy</span></li>
            </ul>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <Label className="text-lg sm:text-xl font-bold text-[#1A1F2C] flex flex-wrap items-center gap-2">
          Flashcard Display Mode
          <span className="px-2 py-1 text-sm bg-[#9b87f5] text-white border-2 border-black rotate-2 inline-block">
            Step 2
          </span>
        </Label>
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={() => setDisplayMode("term-first")}
            className={`flex-1 py-3 ${
              displayMode === "term-first"
                ? "bg-[#9b87f5] text-white"
                : "bg-white text-[#1A1F2C]"
            } neo-border border-2 border-black hover:shadow-none hover:translate-y-[2px] transition-all`}
          >
            <span className="font-bold">Term → Definition</span>
          </Button>
          
          <Button
            type="button"
            onClick={() => setDisplayMode("definition-first")}
            className={`flex-1 py-3 ${
              displayMode === "definition-first"
                ? "bg-[#9b87f5] text-white"
                : "bg-white text-[#1A1F2C]"
            } neo-border border-2 border-black hover:shadow-none hover:translate-y-[2px] transition-all`}
          >
            <span className="font-bold">Definition → Term</span>
          </Button>
        </div>
        <p className="text-sm text-[#6B7280] italic">Choose which side of the flashcard you want to see first</p>
      </div>
      
      <div className="bg-[#F9F6FF] neo-border shadow-neo p-4 rounded-md">
        <div className="flex items-center gap-3 mb-2">
          <Wand2 className="h-5 w-5 text-[#9b87f5]" />
          <p className="font-medium">How It Works:</p>
        </div>
        <ul className="ml-8 space-y-1 text-sm list-disc">
          <li>Our AI analyzes your text and identifies key terms and definitions</li>
          <li>Generated flashcards will be shown for review before saving</li>
          <li>You can edit, add, or remove cards before finalizing your deck</li>
        </ul>
      </div>

      <Button 
        onClick={handleGenerateFlashcards} 
        disabled={!studyMaterial.trim() || isGenerating} 
        className="w-full bg-[#9b87f5] hover:bg-[#7E69AB] text-white neo-border shadow-neo-lg hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all text-lg sm:text-xl font-bold py-4 sm:py-6"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
            Generating Flashcards...
          </div>
        ) : (
          "Generate Flashcards ✨"
        )}
      </Button>
      
      {/* Flashcard Preview Dialog */}
      <Dialog open={showCardsPreview} onOpenChange={setShowCardsPreview}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto bg-white neo-border shadow-neo">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Review Your Flashcards</DialogTitle>
            <DialogDescription>
              Edit your cards before saving them to your deck. You can add, edit, or remove cards as needed.
            </DialogDescription>
          </DialogHeader>
          
          {/* Action buttons - moved above cards */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6 mt-2">
            <Button 
              onClick={handleAddBlankCard}
              className="bg-white text-[#9b87f5] hover:bg-[#E5DEFF] neo-border shadow-neo-sm hover:shadow-none transition-all font-bold"
            >
              + Add Blank Card
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCardsPreview(false)}
                className="neo-border shadow-neo-sm hover:shadow-none transition-all"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveFlashcards}
                disabled={generatedCards.length === 0}
                className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white neo-border shadow-neo-lg hover:shadow-none transition-all font-bold"
              >
                Save {generatedCards.length} Flashcards
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            {generatedCards.length > 0 ? (
              generatedCards.map((card, index) => (
                <div key={card.id} className="p-4 bg-[#F9F6FF] neo-border shadow-neo rounded-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Term</Label>
                      <Textarea 
                        value={card.term}
                        onChange={(e) => handleUpdateFlashcard(index, 'term', e.target.value)}
                        className="min-h-[100px] bg-white neo-border shadow-neo-sm resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">Definition</Label>
                      <Textarea 
                        value={card.definition}
                        onChange={(e) => handleUpdateFlashcard(index, 'definition', e.target.value)}
                        className="min-h-[100px] bg-white neo-border shadow-neo-sm resize-none"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteFlashcard(index)}
                      className="bg-white neo-border shadow-neo-sm text-[#FF5C00] hover:bg-[#FFDEE2] hover:shadow-none transition-all"
                    >
                      Remove Card
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8">
                <p className="text-lg font-medium">No flashcards generated yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashcardCreationForm;