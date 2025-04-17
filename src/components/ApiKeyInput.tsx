import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Zap, PlusCircle, MinusCircle } from "lucide-react";

interface ApiKeyInputProps {
  onSubmit: (apiKeys: string[]) => void;
}

const ApiKeyInput = ({ onSubmit }: ApiKeyInputProps) => {
  const [apiKeys, setApiKeys] = useState<string[]>(['']);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validKeys = apiKeys.filter(key => key.trim().length > 0);
    if (validKeys.length > 0) {
      onSubmit(validKeys);
    }
  };

  const addApiKeyInput = () => {
    if (apiKeys.length < 10) {
      setApiKeys([...apiKeys, '']);
    }
  };

  const removeApiKeyInput = (index: number) => {
    const updatedKeys = [...apiKeys];
    updatedKeys.splice(index, 1);
    setApiKeys(updatedKeys.length > 0 ? updatedKeys : ['']);
  };

  const handleApiKeyChange = (index: number, value: string) => {
    const updatedKeys = [...apiKeys];
    updatedKeys[index] = value;
    setApiKeys(updatedKeys);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="bg-neo-accent bg-opacity-10">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-neo-accent" strokeWidth={2.5} />
          <CardTitle className="text-xl font-pixel">GEMINI API Key Required</CardTitle>
        </div>
        <CardDescription className="font-mono text-xs">
          Enter your GEMINI API keys to use the key term extraction functionality.
          Adding multiple keys enables automatic rotation for uninterrupted service.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiKeys.map((apiKey, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-grow">
                <label className="block text-sm font-medium mb-1">
                  {index === 0 ? 'Primary API Key' : `API Key ${index + 1}`}
                </label>
                <Input
                  type="password"
                  placeholder={`Enter your ${index === 0 ? 'primary' : ''} GEMINI API key`}
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(index, e.target.value)}
                  className="w-full font-mono"
                />
              </div>
              
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeApiKeyInput(index)}
                >
                  <MinusCircle className="h-5 w-5" />
                </Button>
              )}
            </div>
          ))}

          {apiKeys.length < 10 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-neo-accent hover:text-neo-accent hover:bg-neo-accent/10"
              onClick={addApiKeyInput}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Another API Key ({apiKeys.length}/10)
            </Button>
          )}

          <p className="text-xs font-mono text-neo-muted mt-1">
            Your API keys are only stored in your browser's session and are not saved.
            {apiKeys.length > 1 && " If one key fails, the next key will be used automatically."}
          </p>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={!apiKeys.some(key => key.trim().length > 0)}>
              <Key className="mr-2 h-4 w-4" />
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;
