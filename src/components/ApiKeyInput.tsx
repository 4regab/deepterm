
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Zap } from "lucide-react";

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
}

const ApiKeyInput = ({ onSubmit }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="bg-neo-accent bg-opacity-10">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-neo-accent" strokeWidth={2.5} />
          <CardTitle className="text-xl font-pixel">GEMINI API Key Required</CardTitle>
        </div>
        <CardDescription className="font-mono text-xs">
          Enter your GEMINI API key to use the key term extraction functionality.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter your GEMINI API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full font-mono"
            />
            <p className="text-xs font-mono text-neo-muted mt-1">
              Your API key is only stored in your browser's session and is not saved.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!apiKey.trim()}>
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
