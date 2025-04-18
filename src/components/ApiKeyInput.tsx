import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

// Storage key to be consistent throughout the application
export const API_KEY_STORAGE_KEY = 'gemini-api-key';

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSubmit }) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check local storage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) return;
    
    setIsLoading(true);
    
    // Store the API key in local storage
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    
    // Add a small delay to show loading state
    setTimeout(() => {
      // Call the onSubmit callback with the API key
      onSubmit(apiKey.trim());
      setIsLoading(false);
    }, 300);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          placeholder="Enter your Gemini API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="neo-border focus:border-neo-accent focus:ring-neo-accent"
          required 
        />
        <Button 
          type="submit" 
          disabled={isLoading || !apiKey.trim()}
          className="w-full bg-neo-accent text-neo-black neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {isLoading ? "Saving..." : "Save and Continue"}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-neo-bg">
        <h3 className="text-sm font-semibold text-neo-black mb-2 flex items-center">
          <Info className="w-4 h-4 mr-1.5 text-neo-accent3" />
          How to get your Gemini API key:
        </h3>
        <ol className="list-decimal pl-5 space-y-1 text-xs text-neo-muted">
          <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.</li>
          <li>Sign in with your Google account.</li>
          <li>Click on "Get API key" in the top right</li>
          <li>Create a key for a new project (or use an existing one).</li>
          <li>Copy the generated API key.</li>
          <li>Paste it into the input field above.</li>
        </ol>
        <p className="text-xs text-neo-muted mt-2">
          Your API key is stored only in your browser's local storage.
          Free tiers are available but usage limits may apply.
        </p>
      </div>
    </>
  );
};

export default ApiKeyInput;
