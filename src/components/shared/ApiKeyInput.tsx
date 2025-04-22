import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export const API_KEY_STORAGE_KEY = 'gemini-api-key';

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

const ApiKeyInput = ({ onApiKeySubmit }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing API key on component mount
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!apiKey.trim()) return;

    try {
      // Store API key in localStorage
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      
      // Manually dispatch a storage event for other components in the same window
      window.dispatchEvent(new StorageEvent('storage', {
        key: API_KEY_STORAGE_KEY,
        newValue: apiKey.trim(),
        storageArea: localStorage
      }));
      
      // Call the callback with the API key
      onApiKeySubmit(apiKey.trim());
    } catch (error) {
      console.error("Error storing API key:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Enter Your Gemini API Key</h2>
        <p className="text-[#8E9196]">Required to generate quizzes and process text</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          placeholder="Enter your Gemini API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="neo-border focus:border-[#9b87f5] focus:ring-[#9b87f5]"
          required
        />
        <Button 
          type="submit" 
          disabled={isLoading || !apiKey.trim()}
          className="w-full bg-[#9b87f5] text-white neo-border shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {isLoading ? "Saving..." : "Save and Continue"}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-[#E5DEFF]">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-[#9b87f5]" />
          How to get your Gemini API key:
        </h3>
        <ol className="list-decimal pl-5 space-y-1 text-xs text-[#8E9196]">
          <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[#9b87f5] hover:underline">Google AI Studio</a></li>
          <li>Sign in with your Google account</li>
          <li>Click on "Get API key" in the top right</li>
          <li>Create a key for a new project (or use an existing one)</li>
          <li>Copy the generated API key</li>
          <li>Paste it into the input field above</li>
        </ol>
      </div>
    </div>
  );
};

export default ApiKeyInput;
