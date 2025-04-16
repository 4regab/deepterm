
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { readFileAsText } from "@/utils/fileUtils";
import { AlertCircle, FileText, Upload, X, ClipboardCopy } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TextInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const TextInput = ({ onSubmit, isLoading }: TextInputProps) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Maximum character limit before warning the user
  const MAX_TEXT_LENGTH = 100000;

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        
        try {
          let loadingToast;
          if (selectedFile.size > 1000000) { // 1MB
            loadingToast = toast({
              title: "Processing Large File",
              description: "Please wait while we extract the text...",
            });
          }
          
          const fileContent = await readFileAsText(selectedFile);
          
          if (loadingToast) {
            toast({
              title: "File Processed",
              description: "Text extraction complete.",
            });
          }
          
          setText(fileContent);
          
          if (fileContent.length > MAX_TEXT_LENGTH) {
            toast({
              title: "Text Too Long - Content Will Be Truncated",
              description: `Your text is ${fileContent.length.toLocaleString()} characters. The system can only process ${MAX_TEXT_LENGTH.toLocaleString()} characters. Please reduce your text or the end of your document will NOT be processed.`,
              variant: "destructive",
            });
          }
          
          if (selectedFile.name.endsWith('.docx')) {
            toast({
              title: "Limited DOCX Support",
              description: "DOCX parsing is limited. For best results, use TXT or PDF files.",
            });
          }
          
          // Log file size and content length for debugging
          console.log(`File processed: ${selectedFile.name}, size: ${selectedFile.size} bytes, extracted content length: ${fileContent.length} characters`);
        } catch (error) {
          console.error("Error reading file:", error);
          toast({
            title: `Error Reading File: ${selectedFile.name}`,
            description: error instanceof Error ? error.message : "Failed to read the file",
            variant: "destructive",
          });
        }
      }
    }
  });

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({
        title: "Missing Content",
        description: "Please enter some text or upload a file.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if text exceeds maximum length
    if (text.length > MAX_TEXT_LENGTH) {
      toast({
        title: "Text Too Long - Will Be Truncated",
        description: `Your text exceeds the ${MAX_TEXT_LENGTH.toLocaleString()} character limit. Please reduce your text or the end portion WILL NOT be processed.`,
        variant: "destructive",
      });
      return;
    }
    
    // Clean text of binary patterns or encoding issues
    const firstChunk = text.substring(0, 500);
    const lastChunk = text.substring(text.length - 500);
    
    const binaryPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]{10,}/;
    if (binaryPattern.test(firstChunk) || binaryPattern.test(lastChunk)) {
      console.warn("Content may contain binary data or encoding issues");
      
      const cleanedText = text
        .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
        .replace(/�/g, ' ');
      
      console.log(`Cleaned content for processing, original length: ${text.length}, cleaned length: ${cleanedText.length}`);
      
      onSubmit(cleanedText);
      return;
    }
    
    console.log(`Submitting text for processing, length: ${text.length}`);
    
    onSubmit(text);
  };

  const handleClearFile = () => {
    setFile(null);
    setText("");
  };

  const handlePaste = () => {
    navigator.clipboard.readText()
      .then(clipText => {
        setText(clipText);
        toast({
          title: "Text pasted successfully",
          description: `${clipText.length.toLocaleString()} characters pasted from clipboard`,
        });
      })
      .catch(err => {
        toast({
          title: "Could not access clipboard",
          description: "Please check your browser permissions",
          variant: "destructive",
        });
      });
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
        
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="text-input" className="block text-base font-bold text-neo-black">
              Enter text to analyze
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePaste}
              className="text-xs neo-border bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <ClipboardCopy className="h-3 w-3 mr-1" />
              Paste
            </Button>
          </div>
          <Textarea
            id="text-input"
            placeholder="Paste or type your text here..."
            className="min-h-[180px] mb-2 font-mono text-sm neo-border focus:ring-2 focus:ring-neo-accent3 rounded-lg resize-y"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {text.length > 0 && (
            <div className={`text-xs mb-2 text-right flex items-center justify-end ${text.length > MAX_TEXT_LENGTH ? 'text-red-500 font-bold' : 'text-neo-muted'}`}>
              <div className="flex-grow text-left">
                {text.length > MAX_TEXT_LENGTH && (
                  <span className="text-red-500">Text too long - end will be cut off!</span>
                )}
              </div>
              <div>
                <span className={text.length > MAX_TEXT_LENGTH ? 'font-bold' : ''}>
                  {text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()} characters
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-5">
          <div className="text-base font-bold mb-2 text-neo-black">Or upload a document</div>
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
              </p>
              <p className="text-xs text-neo-muted hidden sm:block">
                Supported formats: TXT, PDF (full support), DOCX (limited support)
              </p>
              <p className="text-xs text-neo-accent hidden sm:block mt-1">
                <strong>Keep files under {MAX_TEXT_LENGTH.toLocaleString()} characters for complete results</strong>
              </p>
            </div>
          </div>
          
          {file && (
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
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !text.trim() || text.length > MAX_TEXT_LENGTH}
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
      </CardContent>
    </Card>
  );
};

export default TextInput;
