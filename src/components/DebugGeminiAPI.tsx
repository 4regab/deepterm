import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testApiKey, testFileUpload, checkApiKey } from '@/services/geminiService';

const DebugGeminiAPI = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (testName: string, result: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { testName, result, timestamp }]);
  };

  const runApiKeyTest = async () => {
    setIsLoading(true);
    try {
      const result = await testApiKey();
      addResult('API Key Test', result);
    } catch (error) {
      addResult('API Key Test', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setIsLoading(false);
  };

  const runFileUploadTest = async () => {
    setIsLoading(true);
    try {
      const result = await testFileUpload();
      addResult('File Upload Test', result);
    } catch (error) {
      addResult('File Upload Test', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setIsLoading(false);
  };

  const checkApiKeyStatus = () => {
    const hasKey = checkApiKey();
    addResult('API Key Check', { hasApiKey: hasKey });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Gemini API Debug Console</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={checkApiKeyStatus} variant="outline">
            Check API Key Status
          </Button>
          <Button onClick={runApiKeyTest} disabled={isLoading} variant="outline">
            Test API Key
          </Button>
          <Button onClick={runFileUploadTest} disabled={isLoading} variant="outline">
            Test File Upload
          </Button>
          <Button onClick={clearResults} variant="destructive">
            Clear Results
          </Button>
        </div>

        <div className="space-y-4">
          {testResults.map((test, index) => (
            <div key={index} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{test.testName}</h3>
                <span className="text-sm text-gray-500">{test.timestamp}</span>
              </div>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(test.result, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <span>Running test...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugGeminiAPI;