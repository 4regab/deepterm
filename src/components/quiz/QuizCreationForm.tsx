import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Info, Wand2, Check, ChevronDown, ChevronUp, FileText, Edit, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { QuizGenerator } from "@/services/quizGenerator";
import { QuestionType, useQuiz, QuizQuestion } from "@/context/QuizContext";
import { v4 as uuidv4 } from "uuid";
import ApiKeyInput, { API_KEY_STORAGE_KEY } from "@/components/shared/ApiKeyInput";
import { initializeGemini, checkApiKey as serviceCheckApiKey } from "@/services/geminiService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const questionTypeOptions = [
  {
    value: "multiple",
    label: "Multiple Choice",
    emoji: "🅰️",
    description: "Questions with multiple options to choose from"
  },
  {
    value: "truefalse",
    label: "True/False",
    emoji: "✓✗",
    description: "Simple true or false questions"
  },
  {
    value: "identification",
    label: "Identification",
    emoji: "🔍",
    description: "Fill-in-the-blank questions to test recall"
  },
  {
    value: "statementTrueFalse",
    label: "Statement True/False",
    emoji: "📊",
    description: "Evaluate the truth of multiple statements"
  },
  {
    value: "mixed",
    label: "Mixed Types",
    emoji: "🎭",
    description: "Combination of all question types"
  }
];

const QuizCreationForm = () => {
  const {
    setActiveQuiz,
    activeQuiz,
    isGenerating,
    setIsGenerating,
    setQuizPhase,
    saveQuiz // Ensure saveQuiz is destructured
  } = useQuiz();

  // Add the user profile context to track achievements
  const { trackQuizCreated } = useUserProfile();
    const [quizTitle, setQuizTitle] = useState(activeQuiz?.title || "");
  const [studyMaterial, setStudyMaterial] = useState(activeQuiz?.studyMaterial || "");
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(activeQuiz?.settings?.numberOfQuestions || 5);
  const [isAutoQuestionCount, setIsAutoQuestionCount] = useState(activeQuiz ? false : true);
  const [questionType, setQuestionType] = useState<QuestionType>(activeQuiz?.settings?.questionType || "multiple");
  const [verbatimMode, setVerbatimMode] = useState<boolean>(false);  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [inputMode, setInputMode] = useState<'auto' | 'manual'>(activeQuiz?.settings?.inputMode as ('auto' | 'manual') || 'auto');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isQuestionTypeExpanded, setIsQuestionTypeExpanded] = useState(false);
    // New state variables for quiz review functionality
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);
  const [showQuestionsPreview, setShowQuestionsPreview] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false); // Track editing state to prevent interference
  const isUpdatingRef = useRef(false); // Track if we're in the middle of an update operation

  // Determine if we are in edit mode based *only* on the presence of an activeQuiz from context.
  const isEditMode = !!activeQuiz?.id;

  const questionCountOptions = Array.from({ length: 96 }, (_, i) => i + 5);

  // Effect to populate form state when activeQuiz changes (for editing)
  useEffect(() => {
    console.log(`[Effect activeQuiz] Running. activeQuiz ID: ${activeQuiz?.id ?? 'null'}`); // Log effect run
    if (activeQuiz) {
      console.log("[Effect activeQuiz] Populating form for editing quiz:", activeQuiz.id);
      setQuizTitle(activeQuiz.title || "");
      setStudyMaterial(activeQuiz.studyMaterial || "");
      setNumberOfQuestions(activeQuiz.settings?.numberOfQuestions || 5);
      setIsAutoQuestionCount(activeQuiz.settings?.numberOfQuestions === undefined); // Set auto if number wasn't explicitly set
      setQuestionType(activeQuiz.settings?.questionType || "multiple");
      setVerbatimMode(activeQuiz.settings?.verbatimMode ?? true);
      setInputMode(activeQuiz.settings?.inputMode || 'auto');
      // If editing, load the existing questions into the preview state immediately
      // This allows editing questions without regenerating
      setGeneratedQuestions(activeQuiz.questions || []);      // Show the questions preview dialog automatically when in edit mode
      if (activeQuiz.questions && activeQuiz.questions.length > 0 && !isUpdatingRef.current) {
        console.log("[Effect activeQuiz] Found questions, showing preview immediately (not during update)"); // Log immediate show
        setShowQuestionsPreview(true);
      } else if (isUpdatingRef.current) {
        console.log("[Effect activeQuiz] Skipping preview show because we're in the middle of an update");
      } else {
         console.log("[Effect activeQuiz] No questions found, not showing preview automatically.");
      }
    } else {
      // Reset form when activeQuiz is cleared (e.g., creating a new quiz)
      console.log("[Effect activeQuiz] Resetting form because activeQuiz is null.");
      setQuizTitle("");
      setStudyMaterial("");
      setNumberOfQuestions(5);
      setIsAutoQuestionCount(true);
      setQuestionType("multiple");
      setVerbatimMode(true);
      setInputMode('auto');      setGeneratedQuestions([]);
      console.log("[Effect activeQuiz] Calling setShowQuestionsPreview(false) in else block."); // Log reset call
      setShowQuestionsPreview(false);
      setEditingQuestionIndex(null);
    }
  }, [activeQuiz]); // Rerun this effect when activeQuiz changes

  // Cleanup effect to reset updating flag on unmount
  useEffect(() => {
    return () => {
      isUpdatingRef.current = false;
    };
  }, []);

  const checkApiKey = () => {
    const keyExists = serviceCheckApiKey();
    console.log("API key check: exists =", keyExists);
    setHasApiKey(keyExists);
    return keyExists;
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
    setHasApiKey(initialized);
    setShowApiKeyInput(false);
    if (initialized) {
      toast.success("API Key saved and initialized successfully");
    } else {
      toast.error("Failed to initialize API Key");
    }
  };
  // New function to handle updating an existing quiz
  const handleUpdateQuiz = () => {
    console.log("[handleUpdateQuiz] Starting update."); // Log start
    isUpdatingRef.current = true; // Set updating flag to prevent dialog flickering

    if (!activeQuiz) {
      toast.error("Cannot update: No active quiz selected for editing.");
      console.error("[handleUpdateQuiz] Error: No activeQuiz found."); // Log error
      isUpdatingRef.current = false; // Reset flag on error
      return;
    }

    // Use the questions currently in the preview/edit state
    if (generatedQuestions.length === 0) {
      toast.error("Cannot update: Quiz must have at least one question.");
       console.error("[handleUpdateQuiz] Error: No generatedQuestions found."); // Log error
      isUpdatingRef.current = false; // Reset flag on error
      return;
    }

    const updatedQuizData = {
      ...activeQuiz,
      title: quizTitle.trim() || `Quiz ${new Date().toLocaleDateString()}`,
      studyMaterial,
      questions: generatedQuestions, // Use the potentially edited questions
      lastModified: new Date().toISOString(),
      settings: {
        ...activeQuiz.settings, // Preserve original settings unless changed
        questionType,
        numberOfQuestions: generatedQuestions.length, // Update count based on edited questions
        verbatimMode,
        inputMode,
      },
      // Reset score/progress if settings or questions changed significantly? Optional.
      // score: undefined,
      // progress: undefined,
    };
    console.log("[handleUpdateQuiz] Constructed updatedQuizData:", updatedQuizData.id); // Log data

    console.log("[handleUpdateQuiz] Calling saveQuiz..."); // Log before save
    saveQuiz(updatedQuizData); // Use the context save function which handles updates
    console.log("[handleUpdateQuiz] Returned from saveQuiz."); // Log after save

    toast.success(`Quiz "${updatedQuizData.title}" updated successfully!`);    console.log("[handleUpdateQuiz] Calling setActiveQuiz(null)..."); // Log before setActiveQuiz
    setActiveQuiz(null);
    console.log("[handleUpdateQuiz] Returned from setActiveQuiz(null)."); // Log after setActiveQuiz

    console.log("[handleUpdateQuiz] Calling setShowQuestionsPreview(false)..."); // Log before setShowQuestionsPreview
    setShowQuestionsPreview(false);
    console.log("[handleUpdateQuiz] Returned from setShowQuestionsPreview(false). Update finished."); // Log end    // Reset the updating flag after a small delay to ensure all state updates are complete
    setTimeout(() => {
      isUpdatingRef.current = false;
      console.log("[handleUpdateQuiz] Reset updating flag."); // Log flag reset
    }, 100);
  };

  // Renamed from handleGenerateQuiz to reflect its dual purpose
  const handleGenerateOrUpdateQuiz = async () => {
    if (isEditMode) {
      // If editing, directly update the quiz with current form values
      handleUpdateQuiz();
    } else {
      // If creating, proceed with generation logic
      await generateNewQuiz();
    }
  };
  // Extracted generation logic into its own function
  const generateNewQuiz = async () => {
    // Check if we have either study material text or an uploaded file
    if (!studyMaterial.trim() && uploadedFiles.length === 0) {
      toast.error("Please enter some study material or upload a file");
      return;
    }

    const apiKeyPresent = checkApiKey();
    if (!apiKeyPresent) {
      setShowApiKeyInput(true);
      toast.error("API Key required to generate quiz.");
      return;
    }

    setShowApiKeyInput(false);

    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);

    try {
      setIsGenerating(true);

      let actualStudyMaterial = studyMaterial;
      let uploadedImageUris: { uri: string, mimeType: string }[] = [];

      if (uploadedFiles.length > 0) {
        const { uploadFileToGemini, deleteFileFromGemini } = await import('@/services/geminiService');
        const imageFiles = uploadedFiles.filter(file => file.type.startsWith('image/'));
        const textFiles = uploadedFiles.filter(file => !file.type.startsWith('image/'));

        if (textFiles.length > 0) {
          const loadingToast = toast.loading(`Processing ${textFiles[0].name}...`);
          try {
            const { processFileWithGemini } = await import('@/utils/fileProcessing');
            const result = await processFileWithGemini(textFiles[0], "full");
            toast.dismiss(loadingToast);
            if (!result.success) {
              toast.error(result.error || "Failed to process text file");
              setIsGenerating(false);
              return;
            }
            actualStudyMaterial += `\n\n--- From ${textFiles[0].name} ---\n${result.text}`;
          } catch (fileError) {
            toast.dismiss(loadingToast);
            toast.error(`Failed to process file: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
            setIsGenerating(false);
            return;
          }
        }

        if (imageFiles.length > 0) {
          const loadingToast = toast.loading(`Uploading ${imageFiles.length} image(s)...`);
          try {
            const uploadPromises = imageFiles.map(file => uploadFileToGemini(file));
            const uploadedImageInfos = await Promise.all(uploadPromises);
            uploadedImageUris = uploadedImageInfos.map(info => ({ uri: info.uri, mimeType: info.mimeType }));
            toast.dismiss(loadingToast);
          } catch (uploadError) {
            toast.dismiss(loadingToast);
            toast.error(`Failed to upload images: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
            setIsGenerating(false);
            return;
          }
        }
      }

      const generator = new QuizGenerator(apiKey!);
      const numQuestionsParam = isAutoQuestionCount ? undefined : numberOfQuestions;

      console.log(`[QuizCreationForm] Generating quiz with settings:`, {
        numQuestions: numQuestionsParam,
        quizType: questionType,
        verbatimMode,
        source: uploadedFiles.length > 0 ? `files: ${uploadedFiles.map(f => f.name).join(', ')}` : (studyMaterial ? 'studyMaterial' : 'manualInput'),
        textLength: actualStudyMaterial.length,
        imageCount: uploadedImageUris.length,
      });

      let result;
      if (uploadedImageUris.length > 0) {
        const { generateFromTextAndImages } = await import('@/services/geminiService');
        result = await generateFromTextAndImages(actualStudyMaterial, uploadedImageUris, "full");
      } else {
        if (inputMode === 'manual') {
          const parsedStudyMaterial = parseManualInput(actualStudyMaterial);
          if (parsedStudyMaterial.terms.length === 0) {
            toast.error("Could not parse any valid term-definition pairs. Please check your input format.");
            setIsGenerating(false);
            return;
          }

          result = await generator.generateQuizFromManualInput(
            parsedStudyMaterial,
            numQuestionsParam,
            questionType,
            verbatimMode
          );
        } else {
          result = await generator.extractAndGenerateQuiz(
            actualStudyMaterial,
            numQuestionsParam,
            questionType,
            verbatimMode
          );
        }
      }

      if (uploadedImageUris.length > 0) {
        const { deleteFileFromGemini } = await import('@/services/geminiService');
        const deletePromises = uploadedImageUris.map(image => deleteFileFromGemini(image.uri.split("/").pop()!));
        await Promise.all(deletePromises);
      }

      if (!result || !result.success) {
        toast.error(result?.error || "Failed to generate quiz");
        setIsGenerating(false);
        return;
      }

      if (!result.questions || result.questions.length === 0) {
        toast.error("No questions could be generated. Try with different study material.");
        setIsGenerating(false);
        return;
      }

      const convertedQuestions = result.questions.map(q => ({
        id: String(q.id || uuidv4()),
        question: q.question || "Question unavailable",
        options: q.options || [],
        answer: q.answer || "",
        explanation: q.explanation || "",
        type: q.type as QuestionType || questionType
      }));

      setGeneratedQuestions(convertedQuestions);
      setShowQuestionsPreview(true);
      toast.success(`Generated ${convertedQuestions.length} questions successfully! Please review them.`);

    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const parseManualInput = (input: string) => {
    const lines = input.split(/\n+/).filter(line => line.trim() !== '');

    const terms = lines.map(line => {
      const separatorMatch = line.match(/(.+?)[-–—:;]+(.+)/);

      if (separatorMatch) {
        const term = separatorMatch[1].trim();
        const definition = separatorMatch[2].trim();

        if (term && definition) {
          return { term, definition };
        }
      }

      return null;
    }).filter(Boolean);

    return {
      title: quizTitle || "Manual Quiz",
      terms: terms as Array<{ term: string, definition: string }>
    };
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    if (uploadedFiles.length + newFiles.length > 5) {
      toast.error("You can upload a maximum of 5 files.");
      return;
    }

    try {
      // Import file validation utilities
      const { isFileTypeSupported, formatFileSize, getFileLimits } = await import('@/utils/fileProcessing');

      for (const file of newFiles) {
        // Validate file type
        if (!isFileTypeSupported(file)) {
          const limits = getFileLimits();
          toast.error(`Unsupported file type: ${file.name}. Please use: ${limits.supportedTypes.join(', ')}`);
          return;
        }

        // Validate file size
        const limits = getFileLimits();
        if (file.size > limits.maxSize) {
          toast.error(`File size (${formatFileSize(file.size)}) for ${file.name} exceeds the maximum limit of ${limits.maxSizeFormatted}`);
          return;
        }
      }

      setUploadedFiles([...uploadedFiles, ...newFiles]);

      toast.success(`${newFiles.length} file(s) uploaded successfully.`);

    } catch (error) {
      console.error("File validation error:", error);
      toast.error(`Failed to validate file: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getSelectedQuestionType = () => {
    return questionTypeOptions.find(option => option.value === questionType) || questionTypeOptions[0];
  };

  const toggleQuestionTypeAccordion = () => {
    setIsQuestionTypeExpanded(!isQuestionTypeExpanded);
  };

  const selectQuestionType = (value: QuestionType) => {
    setQuestionType(value);
    if (window.innerWidth < 640) {
      setIsQuestionTypeExpanded(false);
    }
  };

  // Add new handlers for quiz review functionality
  const handleSaveQuiz = () => {
    console.log(`[handleSaveQuiz] Clicked. isEditMode: ${isEditMode}, activeQuiz ID: ${activeQuiz?.id ?? 'null'}`); // Log click
    if (generatedQuestions.length === 0 && !isEditMode) { // Allow saving empty if editing (though handleUpdateQuiz prevents it)
      toast.error("No questions to save");
      return;
    }

    // If we are editing an existing quiz, update it instead of creating a new one.
    if (isEditMode && activeQuiz) {
      console.log("[handleSaveQuiz] Entering edit mode branch, calling handleUpdateQuiz."); // Log branch
      handleUpdateQuiz();
      return; // IMPORTANT: Return here to prevent executing new quiz logic
    }

    // --- Logic for saving a NEW quiz (after generation and review) ---
    console.log("[handleSaveQuiz] Entering new quiz save branch."); // Log branch
    const newQuiz = {
      id: uuidv4(),
      title: quizTitle.trim() || `Quiz ${new Date().toLocaleDateString()}`,
      studyMaterial,
      questions: generatedQuestions,
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      settings: {
        questionType,
        numberOfQuestions: generatedQuestions.length,
        verbatimMode,
        inputMode
      }
    };

    // Save quiz using the context function
    console.log("[handleSaveQuiz] Calling saveQuiz for new quiz..."); // Log save new
    saveQuiz(newQuiz);
    console.log("[handleSaveQuiz] Returned from saveQuiz for new quiz."); // Log save new return

    console.log("[handleSaveQuiz] Calling setShowQuestionsPreview(false) for new quiz."); // Log close dialog new
    setShowQuestionsPreview(false);
    toast.success(`Quiz saved successfully with ${generatedQuestions.length} questions!`);

    // Track quiz creation for achievements
    trackQuizCreated();
  };

  const handleStartQuiz = () => {
    if (generatedQuestions.length === 0) {
      toast.error("No questions to start quiz");
      return;
    }

    const newQuiz = {
      id: uuidv4(),
      title: quizTitle.trim() || `Quiz ${new Date().toLocaleDateString()}`,
      studyMaterial,
      questions: generatedQuestions,
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      settings: {
        questionType,
        numberOfQuestions: generatedQuestions.length,
        verbatimMode,
        inputMode
      }
    };

    // Set active quiz and move to taking phase without saving
    setActiveQuiz(newQuiz);
    setQuizPhase("taking");
    setShowQuestionsPreview(false);

    // Track quiz creation for achievements
    trackQuizCreated();
  };
  const handleUpdateQuestion = useCallback((index: number, field: keyof QuizQuestion, value: string | string[]) => {
    // Prevent interference by batching updates
    setIsEditing(true);

    setGeneratedQuestions(prev => {
      const updatedQuestions = [...prev];
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value
      };
      return updatedQuestions;
    });

    // Reset editing state after a brief delay to prevent rapid re-renders
    setTimeout(() => setIsEditing(false), 100);
  }, []);

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = [...generatedQuestions];
    updatedQuestions.splice(index, 1);
    setGeneratedQuestions(updatedQuestions);

    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
    } else if (editingQuestionIndex !== null && editingQuestionIndex > index) {
      setEditingQuestionIndex(editingQuestionIndex - 1);
    }
  };

  const handleAddBlankQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: uuidv4(),
      question: "",
      options: questionType === "multiple" ? ["", "", "", ""] : (questionType === "truefalse" ? ["True", "False"] : []),
      answer: "",
      explanation: "",
      type: questionType
    };

    setGeneratedQuestions([...generatedQuestions, newQuestion]);
    setEditingQuestionIndex(generatedQuestions.length);
  };

  if (showApiKeyInput) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-[#E5DEFF] neo-border shadow-neo rounded-md">
          <p className="text-[#1A1F2C] font-medium mb-4">
            Please provide your API key to generate quizzes.
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

  const selectedType = getSelectedQuestionType();

  return (
    <div className="space-y-6 sm:space-y-8">
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg border-4 border-[#9b87f5] max-w-md w-full">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 border-4 border-[#9b87f5] border-t-transparent rounded-full animate-spin"></div>
                <div className="w-10 h-10 border-4 border-[#FF5C00] border-b-transparent rounded-full animate-spin absolute top-3 left-3"></div>
              </div>
              <h3 className="text-xl font-bold text-center">Generating Your Quiz</h3>
              <p className="text-center text-gray-600">This may take a minute or two. We're creating high-quality questions based on your study material.</p>
            </div>
          </div>
        </div>
      )}

      {/* Keep this Edit Mode indicator */}
      {isEditMode && (
        <div className="bg-blue-100 border-2 border-blue-400 p-4 rounded-md shadow-neo">
          <div className="flex items-center gap-3">
            <Edit className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="font-bold text-lg">Edit Mode</h3>
              <p className="text-sm text-blue-700">You are currently editing an existing quiz. Make your changes and click "Update Quiz" when done.</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Label className="text-lg sm:text-xl font-bold text-[#1A1F2C] flex flex-wrap items-center gap-2">
          Quiz Title {!isEditMode && "(Optional)"}
          <span className="px-2 py-1 text-sm bg-[#FFC225] border-2 border-black -rotate-3 inline-block">
            {isEditMode ? "Edit Title" : "Name It!"}
          </span>
        </Label>
        <Input
          placeholder="Enter a title for your quiz..."
          className="bg-white neo-border shadow-neo hover:shadow-neo-lg transition-shadow duration-200 placeholder:text-[#8E9196] p-4 text-base sm:text-lg"
          value={quizTitle}
          onChange={e => setQuizTitle(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg sm:text-xl font-bold text-[#1A1F2C] flex flex-wrap items-center gap-2">
            Study Material
            <span className="px-2 py-1 text-sm bg-[#FFC225] border-2 border-black rotate-2 inline-block">
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
                className="data-[state=active]:bg-[#FF5C00] data-[state=active]:text-white"
              >
                Manual Entry
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative">
          {inputMode === 'auto' ? (
            <Textarea
              placeholder="Paste your study material here... All key terms will be automatically extracted."
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
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.pdf,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif" className="hidden" multiple />
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

        {uploadedFiles.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`preview ${index}`}
                    className="w-full h-24 object-cover rounded-md neo-border"
                  />
                ) : (
                  <div className="w-full h-24 flex flex-col items-center justify-center bg-gray-100 rounded-md neo-border">
                    <FileText className="h-8 w-8 text-gray-500" />
                    <span className="text-xs text-gray-600 mt-1 truncate px-1">{file.name}</span>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {inputMode === 'manual' && (
          <div className="bg-[#FFF9EB] p-4 rounded-md neo-border shadow-neo-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#FF5C00]" />
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        <div className="space-y-4">
          <Label className="text-lg sm:text-xl font-bold text-[#1A1F2C] flex flex-wrap items-center gap-2">
            Number of Questions
            <span className="px-2 py-1 text-sm bg-[#9b87f5] text-white border-2 border-black rotate-2 inline-block">
              Step 2
            </span>
          </Label>

          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#E5DEFF] neo-border shadow-neo p-4 rounded-md">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-[#9b87f5]" />
                <span className="font-medium text-sm sm:text-base">Auto Determine Question Count</span>
              </div>
              <Switch
                checked={isAutoQuestionCount}
                onCheckedChange={setIsAutoQuestionCount}
                className="data-[state=checked]:bg-[#9b87f5] neo-border"
              />
            </div>

            {!isAutoQuestionCount && (
              <Select
                value={numberOfQuestions.toString()}
                onValueChange={value => setNumberOfQuestions(parseInt(value))}
              >
                <SelectTrigger className="w-full neo-border bg-white shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-4">
                  <SelectValue placeholder="Select number of questions" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {questionCountOptions.map(count => (
                    <SelectItem key={count} value={count.toString()}>
                      {count} questions
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-lg sm:text-xl font-bold text-[#1A1F2C] flex flex-wrap items-center gap-2">
            Question Type
            <span className="px-2 py-1 text-sm bg-[#FF5C00] text-white border-2 border-black rotate-2 inline-block">
              Step 3
            </span>
          </Label>

          <div className="bg-white neo-border shadow-neo rounded-md overflow-hidden">
            <button
              onClick={toggleQuestionTypeAccordion}
              className="w-full p-4 flex items-center justify-between bg-[#FFDE59] hover:bg-[#FFD226] transition-colors focus:outline-none focus:ring-2 focus:ring-black"
              type="button"
              aria-expanded={isQuestionTypeExpanded}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl" role="img" aria-hidden="true">{selectedType.emoji}</span>
                <div className="text-left">
                  <div className="font-bold">{selectedType.label}</div>
                  <div className="text-xs text-gray-700">{selectedType.description}</div>
                </div>
              </div>
              <div className="bg-[#FF5C00] h-8 w-8 flex items-center justify-center rounded-md border-2 border-black transform transition-transform duration-200">
                {isQuestionTypeExpanded ? (
                  <ChevronUp className="h-5 w-5 text-white" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-white" />
                )}
              </div>
            </button>

            <div
              className={`transition-all duration-300 overflow-hidden ${
                isQuestionTypeExpanded
                  ? 'max-h-[500px] border-t-2 border-black'
                  : 'max-h-0'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                {questionTypeOptions
                  .filter(option => option.value !== questionType)
                  .map((option) => (
                    <button
                      key={option.value}
                      onClick={() => selectQuestionType(option.value as QuestionType)}
                      className="relative flex flex-row items-center p-3 border-2 border-black bg-white shadow-neo-sm text-left
                        hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-none
                        focus:outline-none focus:ring-2 focus:ring-black transition-all duration-150 rounded-md"
                      type="button"
                      aria-pressed={false}
                    >
                      <span className="text-xl mr-3" role="img" aria-hidden="true">{option.emoji}</span>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-700">{option.description}</div>
                      </div>
                    </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#E5DEFF] neo-border shadow-neo p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-base font-bold text-[#1A1F2C] flex items-center gap-2">
            Verbatim Mode
            <div className="relative group">
              <Info className="h-4 w-4 text-[#9b87f5] cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-white neo-border shadow-neo w-64 hidden group-hover:block z-10">
                <p className="text-xs text-[#1A1F2C]">
                  When enabled, questions will use exact phrases from your study material. Great for vocabulary, definitions, and factual recall.
                </p>
              </div>
            </div>
          </Label>
        </div>
        <Switch
          checked={verbatimMode}
          onCheckedChange={setVerbatimMode}
          className="data-[state=checked]:bg-[#9b87f5] neo-border h-5 w-10"
        />
      </div>

      <Button
        onClick={handleGenerateOrUpdateQuiz} // Use the combined handler
        disabled={isGenerating || (inputMode === 'auto' && !studyMaterial.trim() && uploadedFiles.length === 0) || (inputMode === 'manual' && !studyMaterial.trim() && !isEditMode)} // Disable if generating or no material (unless editing)
        className={`w-full neo-border shadow-neo-lg hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all text-lg sm:text-xl font-bold py-4 sm:py-6 ${
          isEditMode
            ? "bg-blue-500 hover:bg-blue-600 text-white"
            : "bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
        }`}
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
            {isEditMode ? "Updating Quiz..." : "Generating Quiz..."}
          </div>
        ) : (
          <>
            {isEditMode ? (
              <span className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Update Quiz
              </span>
            ) : (
              "Generate Quiz ✨"
            )}
          </>
        )}
      </Button>

      {/* Questions Preview Dialog */}
      <Dialog open={showQuestionsPreview} onOpenChange={setShowQuestionsPreview}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white neo-border shadow-neo">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Review Your Quiz Questions</DialogTitle>
            <DialogDescription>
              Edit your questions before taking or saving the quiz. You can add, edit, or remove questions as needed.
            </DialogDescription>
          </DialogHeader>

          {/* Action buttons - above questions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6 mt-2">
            <Button
              onClick={handleAddBlankQuestion}
              className="bg-white text-[#9b87f5] hover:bg-[#E5DEFF] neo-border shadow-neo-sm hover:shadow-none transition-all font-bold"
            >
              + Add Question
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowQuestionsPreview(false)}
                className="neo-border shadow-neo-sm hover:shadow-none transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveQuiz} // This now handles both save new and update existing
                disabled={generatedQuestions.length === 0}
                className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white neo-border shadow-neo-sm hover:shadow-none transition-all font-bold"
              >
                {isEditMode ? "Save Changes" : "Save Quiz"} {/* Change button text in dialog */}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {generatedQuestions.length > 0 ? (
              generatedQuestions.map((question, index) => (
                <div key={question.id} className="p-4 bg-[#F9F6FF] neo-border shadow-neo rounded-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Question {index + 1}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingQuestionIndex(editingQuestionIndex === index ? null : index)}
                        className="bg-white neo-border shadow-neo-sm text-[#9b87f5] hover:bg-[#E5DEFF] hover:shadow-none transition-all"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        {editingQuestionIndex === index ? "Done" : "Edit"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuestion(index)}
                        className="bg-white neo-border shadow-neo-sm text-[#FF5C00] hover:bg-[#FFDEE2] hover:shadow-none transition-all"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  {editingQuestionIndex === index ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Question</Label>
                        <Textarea
                          value={question.question}
                          onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                          className="min-h-[80px] bg-white neo-border shadow-neo-sm resize-none"
                        />
                      </div>

                      {question.type === "multiple" && (
                        <div className="space-y-2">
                          <Label className="font-medium">Options</Label>
                          <div className="space-y-2">
                            {question.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex gap-2 items-center">
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const updatedOptions = [...(question.options || [])];
                                    updatedOptions[optIndex] = e.target.value;
                                    handleUpdateQuestion(index, 'options', updatedOptions);
                                  }}
                                  className="bg-white neo-border shadow-neo-sm"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    handleUpdateQuestion(index, 'answer', option);
                                  }}
                                  className={`min-w-[80px] ${
                                    question.answer === option
                                      ? "bg-[#9b87f5] text-white"
                                      : "bg-white"
                                  }`}
                                >
                                  {question.answer === option ? "Correct" : "Set Correct"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {question.type === "truefalse" && (
                        <div className="space-y-2">
                          <Label className="font-medium">Answer</Label>
                          <div className="flex gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleUpdateQuestion(index, 'answer', "True")}
                              className={`flex-1 ${
                                question.answer === "True"
                                  ? "bg-[#9b87f5] text-white"
                                  : "bg-white"
                              }`}
                            >
                              True
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleUpdateQuestion(index, 'answer', "False")}
                              className={`flex-1 ${
                                question.answer === "False"
                                  ? "bg-[#9b87f5] text-white"
                                  : "bg-white"
                              }`}
                            >
                              False
                            </Button>
                          </div>
                        </div>
                      )}

                      {question.type === "identification" && (
                        <div className="space-y-2">
                          <Label className="font-medium">Answer</Label>
                          <Input
                            value={question.answer}
                            onChange={(e) => handleUpdateQuestion(index, 'answer', e.target.value)}
                            className="bg-white neo-border shadow-neo-sm"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="font-medium">Explanation (Optional)</Label>
                        <Textarea
                          value={question.explanation || ""}
                          onChange={(e) => handleUpdateQuestion(index, 'explanation', e.target.value)}
                          className="bg-white neo-border shadow-neo-sm resize-none"
                          placeholder="Explain why this answer is correct"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-4">{question.question}</p>

                      {question.type === "multiple" && question.options && (
                        <div className="ml-4 space-y-2 mb-4">
                          {question.options.map((option, i) => (
                            <div
                              key={i}
                              className={`p-2 border rounded-md ${
                                option === question.answer
                                  ? "border-[#9b87f5] bg-[#F0EAFF]"
                                  : "border-gray-200"
                              }`}
                            >
                              {option === question.answer && (
                                <span className="inline-block mr-2 text-[#9b87f5]">✓</span>
                              )}
                              {option}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "truefalse" && (
                        <div className="ml-4 flex gap-4 mb-4">
                          <div className={`p-2 border rounded-md flex-1 text-center ${
                            question.answer === "True"
                              ? "border-[#9b87f5] bg-[#F0EAFF]"
                              : "border-gray-200"
                          }`}>
                            {question.answer === "True" && (
                              <span className="inline-block mr-2 text-[#9b87f5]">✓</span>
                            )}
                            True
                          </div>
                          <div className={`p-2 border rounded-md flex-1 text-center ${
                            question.answer === "False"
                              ? "border-[#9b87f5] bg-[#F0EAFF]"
                              : "border-gray-200"
                          }`}>
                            {question.answer === "False" && (
                              <span className="inline-block mr-2 text-[#9b87f5]">✓</span>
                            )}
                            False
                          </div>
                        </div>
                      )}

                      {question.type === "identification" && (
                        <div className="ml-4 mb-4">
                          <div className="p-2 border border-[#9b87f5] bg-[#F0EAFF] rounded-md">
                            <span className="font-medium">Answer:</span> {question.answer}
                          </div>
                        </div>
                      )}

                      {question.explanation && (
                        <div className="ml-4 p-2 border-t border-dashed border-gray-300 mt-3 pt-3">
                          <span className="font-medium">Explanation:</span> {question.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center p-8">
                <p className="text-lg font-medium">No questions generated yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizCreationForm;
