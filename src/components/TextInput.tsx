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

        // Show loading toast for files over 1MB
        let loadingToast: { id: string } | undefined;
        if (selectedFile.size > 1000000) {
          loadingToast = toast({
            title: "Processing File with AI",
            description: `Uploading and extracting content from ${selectedFile.name}...`,
          });
        }

        try {
          // Use the new Files API processing
          const result = await processFileWithGemini(selectedFile, extractionMode || "full");

          if (loadingToast) {
            toast({
              title: "File Processed Successfully",
              description: "Content extracted using Gemini Files API",
            });
          }

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
  };

  const handleClearText = () => {
    setText("");
    setMode(null);
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
      <CardContent className="py-6 px-6">
        <Alert className="mb-5 bg-neo-bg neo-border rounded-lg shadow-neo-sm">
          <AlertCircle className="h-4 w-4 text-neo-accent" />
          <AlertDescription className="text-neo-black text-sm">
            <strong className="text-red-500">Important:</strong> Images with text or scanned PDFs cannot be extracted.
            Please ensure your document contains selectable text.
          </AlertDescription>
        </Alert>

        {!mode && (
          <div className="mb-5 flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={() => setMode('text')}
              className="flex-1 neo-border bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all py-6 text-base"
            >
              <Type className="h-5 w-5 mr-2" />
              Enter Text
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode('file')}
              className="flex-1 neo-border bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all py-6 text-base"
            >
              <FileUp className="h-5 w-5 mr-2" />
              Upload File
            </Button>
          </div>
        )}

        {mode && (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToModeSelection}
              className="text-sm flex items-center text-neo-muted hover:text-neo-black hover:bg-neo-bg neo-border rounded-lg shadow-neo-xs"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to extraction mode selection
            </Button>
          </div>
        )}

        {mode === 'text' && (
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="text-input" className="block text-base font-bold text-neo-black">
                Enter text to analyze
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePaste}
                  className="text-xs neo-border bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <ClipboardCopy className="h-3 w-3 mr-1" />
                  Paste
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearText}
                  className="text-xs text-neo-muted hover:text-red-500 hover:bg-red-50"
                  title="Clear text and choose mode again"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
            <Textarea
              id="text-input"
              placeholder="Paste or type your text here..."
              className="min-h-[180px] mb-2 font-mono text-sm neo-border focus:ring-2 focus:ring-neo-accent3 rounded-lg resize-y"
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
          <div className="mb-5">
            <div className="text-base font-bold mb-2 text-neo-black">Upload a document</div>
            {!file ? (
              <div
                {...getRootProps()}
                className="neo-border border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-neo-bg transition-colors"
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center py-4">
                  <div className="bg-neo-bg p-3 rounded-full mb-3 neo-border">
                    <Upload className="h-6 w-6 text-neo-accent" />
                  </div>
                  <p className="text-base font-bold text-neo-black mb-1">
                    <span className="hidden sm:inline">Drag & drop a file here, or click to select</span>
                    <span className="sm:hidden">Upload a file</span>
                  </p>                  <p className="text-xs text-neo-muted hidden sm:block">
                    Supported formats: PDF, DOCX, DOC, TXT (up to {fileLimits.maxSizeFormatted})
                  </p>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setMode(null); }}
                  className="text-xs text-neo-muted hover:text-neo-black mt-2"
                >
                  Cancel Upload
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <div className="p-3 bg-neo-bg neo-border rounded-lg flex items-center justify-between">
                  <div className="flex items-center overflow-hidden">
                    <FileText className="h-5 w-5 mr-2 flex-shrink-0 text-neo-accent" />
                    <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px] text-neo-black">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearFile}
                    className="h-8 w-8 flex-shrink-0 rounded-full hover:bg-red-100"
                    title="Clear file and choose mode again"
                  >
                    <X className="h-4 w-4" />
                  </Button>                </div>
                {text.length > 0 && (
                  <div className="text-xs mt-2 text-right text-neo-muted">
                    Content extracted: {text.length.toLocaleString()} characters
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode && (
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !text.trim()}
              className="font-bold neo-border bg-neo-accent text-neo-black hover:bg-neo-accent/90 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg py-2 px-6"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  Processing...
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