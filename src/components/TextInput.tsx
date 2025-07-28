import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { processFileWithGemini, isFileTypeSupported, formatFileSize, getFileLimits } from "@/utils/fileProcessing";
import { AlertCircle, FileText, Upload, X, ClipboardCopy, Type, FileUp, ArrowLeft } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TextInputProps {
  onSubmit: (text: string, filename?: string) => void;
  isLoading: boolean;
  extractionMode?: "full" | "sentence" | "keywords" | null;
  onResetMode?: () => void;
}

const TextInput = ({ onSubmit, isLoading, extractionMode, onResetMode }: TextInputProps) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'text' | 'file' | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const { toast } = useToast();
  const fileLimits = getFileLimits();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        
        // Validate file type using our new utility
        if (!isFileTypeSupported(selectedFile)) {
          toast({
            title: "Unsupported File Type",
            description: `File type not supported. Please use: ${fileLimits.supportedTypes.join(', ')}`,
            variant: "destructive",
          });
          return;
        }

        // Validate file size
        if (selectedFile.size > fileLimits.maxSize) {
          toast({
            title: "File Too Large",
            description: `File size (${formatFileSize(selectedFile.size)}) exceeds the maximum limit of ${fileLimits.maxSizeFormatted}`,
            variant: "destructive",
          });
          return;
        }

        setFile(selectedFile);
        setMode('file');
        setIsProcessingFile(true);

        // Show loading toast for all files
        const loadingToast = toast({
          title: "Processing File with AI",
          description: `Uploading and extracting content from ${selectedFile.name}...`,
        });

        try {
          // Use the new Files API processing
          const result = await processFileWithGemini(selectedFile, extractionMode || "full");

          if (!result.success) {
            throw new Error(result.error || "Failed to process file");
          }

          // Set the extracted text
          setText(result.text || "");

          // Success feedback
          toast({
            title: "File Processed Successfully",
            description: `${selectedFile.name} has been processed and content extracted`,
          });

          console.log(`File processed with Gemini Files API: ${selectedFile.name}, size: ${selectedFile.size} bytes`);
          
        } catch (error) {
          console.error("Error processing file:", error);
          toast({
            title: `Error Processing File: ${selectedFile.name}`,
            description: error instanceof Error ? error.message : "Failed to process the file",
            variant: "destructive",
          });
          setFile(null);
          setText("");
          setMode(null);
        } finally {
          setIsProcessingFile(false);
        }
      }
    }
  });
  const handleSubmit = () => {
    if (!text.trim()) {
      toast({
        title: "Missing Content",
        description: "Please select a mode and enter text or upload a file.",
        variant: "destructive",
      });
      return;
    }

    proceedWithSubmission();
  };

  const handleClearFile = () => {
    setFile(null);
    setText("");
    setMode(null);
    setIsProcessingFile(false);
  };

  const handleClearText = () => {
    setText("");
    setMode(null);
    setIsProcessingFile(false);
  };

  const handlePaste = () => {
    navigator.clipboard.readText()
      .then(clipText => {
        setText(clipText);
        setMode('text');        toast({
          title: "Text pasted successfully",
          description: `${clipText.length.toLocaleString()} characters pasted from clipboard`,
        });
      })
      .catch(() => {
        toast({
          title: "Could not access clipboard",
          description: "Please check your browser permissions",
          variant: "destructive",
        });
      });
  };

  const handleBackToModeSelection = () => {
    setMode(null);
    setIsProcessingFile(false);
    if (extractionMode && onResetMode) {
      onResetMode();
    }
  };
  const proceedWithSubmission = () => {
    const firstChunk = text.substring(0, 500);
    const lastChunk = text.substring(text.length - 500);

    // Use a safer approach to detect binary content without direct use of control characters in regex
    // eslint-disable-next-line no-control-regex
    const binaryPattern = new RegExp("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F-\\x9F]{10,}");
    if (binaryPattern.test(firstChunk) || binaryPattern.test(lastChunk)) {
      console.warn("Content may contain binary data or encoding issues");
      // Disable ESLint for this line since we need to clean control characters
      // eslint-disable-next-line no-control-regex
      const cleanedText = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
      console.log(`Cleaned content for processing, original length: ${text.length}, cleaned length: ${cleanedText.length}`);
      onSubmit(cleanedText, file?.name);
      return;
    }

    console.log(`Submitting text for processing, length: ${text.length}`);
    onSubmit(text, file?.name);
  };

  return (
    <Card className="neo-border shadow-neo bg-white rounded-lg border-2 border-neo-black">
      <CardContent className="py-4 px-4 sm:py-6 sm:px-6">
        <Alert className="mb-4 sm:mb-5 bg-neo-bg neo-border rounded-lg shadow-neo-sm">
          <AlertCircle className="h-4 w-4 text-neo-accent flex-shrink-0" />
          <AlertDescription className="text-neo-black text-xs sm:text-sm leading-relaxed">
            <strong className="text-red-500">Important:</strong> Images with text or scanned PDFs cannot be extracted.
            Please ensure your document contains selectable text.
          </AlertDescription>
        </Alert>

        {!mode && (
          <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button
              variant="outline"
              onClick={() => setMode('text')}
              className="flex-1 neo-border bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all py-4 sm:py-6 text-sm sm:text-base min-h-[44px] touch-target"
            >
              <Type className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="font-medium">Enter Text</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode('file')}
              className="flex-1 neo-border bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all py-4 sm:py-6 text-sm sm:text-base min-h-[44px] touch-target"
            >
              <FileUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="font-medium">Upload File</span>
            </Button>
          </div>
        )}

        {mode && (
          <div className="mb-3 sm:mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToModeSelection}
              className="text-xs sm:text-sm flex items-center text-neo-muted hover:text-neo-black hover:bg-neo-bg neo-border rounded-lg shadow-neo-xs min-h-[36px] px-3 py-2"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="hidden sm:inline">Back to extraction mode selection</span>
              <span className="sm:hidden">Back to modes</span>
            </Button>
          </div>
        )}

        {mode === 'text' && (
          <div className="mb-4 sm:mb-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
              <label htmlFor="text-input" className="block text-sm sm:text-base font-bold text-neo-black">
                Enter text to analyze
              </label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePaste}
                  className="text-xs neo-border bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all min-h-[36px] px-3"
                >
                  <ClipboardCopy className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>Paste</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearText}
                  className="text-xs text-neo-muted hover:text-red-500 hover:bg-red-50 min-h-[36px] px-3"
                  title="Clear text and choose mode again"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  <span>Clear</span>
                </Button>
              </div>
            </div>
            <Textarea
              id="text-input"
              placeholder="Paste or type your text here..."
              className="min-h-[120px] sm:min-h-[180px] mb-2 font-mono text-xs sm:text-sm neo-border focus:ring-2 focus:ring-neo-accent3 rounded-lg resize-y"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />            {text.length > 0 && (
              <div className="text-xs mb-2 text-right text-neo-muted">
                {text.length.toLocaleString()} characters
              </div>
            )}
          </div>
        )}

        {mode === 'file' && (
          <div className="mb-4 sm:mb-5">
            <div className="text-sm sm:text-base font-bold mb-3 text-neo-black">Upload a document</div>
            {!file ? (
              <div
                {...getRootProps()}
                className={`neo-border border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors min-h-[120px] sm:min-h-[160px] flex flex-col justify-center ${
                  isProcessingFile ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-neo-bg'
                }`}
              >
                <input {...getInputProps()} disabled={isProcessingFile} />
                <div className="flex flex-col items-center py-2 sm:py-4">
                  <div className="bg-neo-bg p-2 sm:p-3 rounded-full mb-2 sm:mb-3 neo-border">
                    {isProcessingFile ? (
                      <LoadingSpinner size={20} className="text-neo-accent" />
                    ) : (
                      <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-neo-accent" />
                    )}
                  </div>
                  {isProcessingFile ? (
                    <>
                      <p className="text-sm sm:text-base font-bold text-neo-black mb-1 px-2">
                        Processing file...
                      </p>
                      <p className="text-xs text-neo-muted px-2 text-center">
                        Please wait while we extract content from your file
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm sm:text-base font-bold text-neo-black mb-1 px-2">
                        <span className="hidden sm:inline">Drag & drop a file here, or click to select</span>
                        <span className="sm:hidden">Tap to upload a file</span>
                      </p>
                      <p className="text-xs text-neo-muted hidden sm:block px-2 text-center">
                        Supported formats: PDF, DOCX, DOC, TXT (up to {fileLimits.maxSizeFormatted})
                      </p>
                      <p className="text-xs text-neo-muted sm:hidden px-2 text-center">
                        PDF, DOCX, DOC, TXT files
                      </p>
                    </>
                  )}
                </div>
                {!isProcessingFile && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setMode(null); }}
                    className="text-xs text-neo-muted hover:text-neo-black mt-1 sm:mt-2 min-h-[32px]"
                  >
                    Cancel Upload
                  </Button>
                )}
              </div>
            ) : (
              <div className="mt-3 sm:mt-4">
                <div className="p-3 bg-neo-bg neo-border rounded-lg flex items-center justify-between gap-2">
                  <div className="flex items-center overflow-hidden min-w-0 flex-1">
                    {isProcessingFile ? (
                      <LoadingSpinner size={16} className="mr-2 flex-shrink-0 text-neo-accent" />
                    ) : (
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 text-neo-accent" />
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-medium truncate text-neo-black">{file.name}</span>
                      {isProcessingFile && (
                        <span className="text-xs text-neo-muted">Processing with AI...</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearFile}
                    disabled={isProcessingFile}
                    className="h-8 w-8 flex-shrink-0 rounded-full hover:bg-red-100 min-h-[32px] min-w-[32px] disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isProcessingFile ? "Cannot clear while processing" : "Clear file and choose mode again"}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                {text.length > 0 && !isProcessingFile && (
                  <div className="text-xs mt-2 text-right text-neo-muted">
                    Content extracted: {text.length.toLocaleString()} characters
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode && (
          <div className="flex justify-center sm:justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !text.trim() || isProcessingFile}
              className="w-full sm:w-auto font-bold neo-border bg-neo-accent text-neo-black hover:bg-neo-accent/90 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg py-3 px-6 text-sm sm:text-base min-h-[44px] touch-target disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size={16} className="mr-2 flex-shrink-0" />
                  <span>Processing...</span>
                </>
              ) : isProcessingFile ? (
                <>
                  <LoadingSpinner size={16} className="mr-2 flex-shrink-0" />
                  <span>Uploading File...</span>
                </>
              ) : (
                "Extract All Terms"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TextInput;