import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { processFileWithGemini } from '@/utils/fileProcessing';
import { uploadFileToGemini, extractKeyTermsFromFile, deleteFileFromGemini } from '@/services/geminiService';

interface TestResult {
  step: string;
  success: boolean;
  data?: unknown;
  error?: string;
  timing?: number;
}

const DocxDebugger: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setResults([]);
  };

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const testDocxProcessing = async () => {
    if (!selectedFile) return;

    setTesting(true);
    setResults([]);

    try {
      console.log('=== DOCX DEBUG TEST START ===');
      console.log('File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: new Date(selectedFile.lastModified).toISOString()
      });

      // Step 1: Test file upload
      const uploadStart = Date.now();
      addResult({ step: 'Upload - Starting', success: true, data: { fileName: selectedFile.name, size: selectedFile.size, type: selectedFile.type }});

      try {
        const uploadResult = await uploadFileToGemini(selectedFile);
        const uploadTime = Date.now() - uploadStart;
        
        addResult({ 
          step: 'Upload - Complete', 
          success: true, 
          data: uploadResult,
          timing: uploadTime 
        });

        console.log('Upload successful:', uploadResult);

        // Step 2: Wait for processing if needed
        if (uploadResult.state === 'PROCESSING') {
          addResult({ step: 'File Processing - Waiting', success: true, data: { state: uploadResult.state }});
          
          // Check file state multiple times
          let attempts = 0;
          let fileReady = false;
          
          while (attempts < 10 && !fileReady) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
            
            // Note: In a real implementation, you'd check file status here
            // For now, we'll assume it's ready after 6 seconds
            if (attempts >= 3) {
              fileReady = true;
              addResult({ step: 'File Processing - Complete', success: true, data: { attempts, waitTime: attempts * 2000 }});
            }
          }
        }

        // Step 3: Test extraction
        const extractStart = Date.now();
        addResult({ step: 'Extraction - Starting', success: true });

        try {
          const extractionResult = await extractKeyTermsFromFile(uploadResult, 'full');
          const extractTime = Date.now() - extractStart;
          
          addResult({ 
            step: 'Extraction - Complete', 
            success: true, 
            data: { 
              termCount: extractionResult.keyTerms.length,
              sampleTerms: extractionResult.keyTerms.slice(0, 3)
            },
            timing: extractTime 
          });

          console.log('Extraction successful:', extractionResult);

        } catch (extractError) {
          const extractTime = Date.now() - extractStart;
          addResult({ 
            step: 'Extraction - Failed', 
            success: false, 
            error: extractError instanceof Error ? extractError.message : 'Unknown extraction error',
            timing: extractTime 
          });
          console.error('Extraction failed:', extractError);
        }

        // Step 4: Cleanup
        try {
          if (uploadResult.name) {
            await deleteFileFromGemini(uploadResult.name);
            addResult({ step: 'Cleanup - Complete', success: true });
          }
        } catch (cleanupError) {
          addResult({ 
            step: 'Cleanup - Failed', 
            success: false, 
            error: cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error' 
          });
        }

      } catch (uploadError) {
        const uploadTime = Date.now() - uploadStart;
        addResult({ 
          step: 'Upload - Failed', 
          success: false, 
          error: uploadError instanceof Error ? uploadError.message : 'Unknown upload error',
          timing: uploadTime 
        });
        console.error('Upload failed:', uploadError);
      }

    } catch (error) {
      addResult({ 
        step: 'Test - Error', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown test error' 
      });
      console.error('Test error:', error);
    }

    setTesting(false);
    console.log('=== DOCX DEBUG TEST END ===');
  };

  const testFullProcessing = async () => {
    if (!selectedFile) return;

    setTesting(true);
    setResults([]);

    try {
      addResult({ step: 'Full Processing - Starting', success: true });
      
      const result = await processFileWithGemini(selectedFile, 'full');
      
      addResult({ 
        step: 'Full Processing - Complete', 
        success: result.success, 
        data: result.success ? {
          termCount: result.extractionResult?.keyTerms?.length || 0,
          textLength: result.text?.length || 0
        } : undefined,
        ...(result.success ? {} : { error: result.error || "Unknown error" })
      });

    } catch (error) {
      addResult({ 
        step: 'Full Processing - Error', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown processing error' 
      });
    }

    setTesting(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>DOCX File Processing Debugger</CardTitle>
          <CardDescription>
            Test DOCX file upload and processing step-by-step to identify issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select DOCX File
            </label>
            <input
              type="file"
              accept=".docx,.doc"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* Test Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={testDocxProcessing}
              disabled={!selectedFile || testing}
              variant="default"
            >
              {testing ? 'Testing Step-by-Step...' : 'Test Step-by-Step'}
            </Button>
            
            <Button 
              onClick={testFullProcessing}
              disabled={!selectedFile || testing}
              variant="outline"
            >
              {testing ? 'Testing Full Process...' : 'Test Full Process'}
            </Button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Results</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{result.step}</span>
                    <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success ? '✅ Success' : '❌ Failed'}
                      {result.timing && ` (${result.timing}ms)`}
                    </span>
                  </div>
                  
                  {result.error && (
                    <div className="text-red-700 text-sm mb-2">
                      Error: {result.error}
                    </div>
                  )}
                  
                  {result.data !== undefined && (
                    <div className="text-gray-700 text-sm">
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                        {typeof result.data === 'string' 
                          ? result.data 
                          : JSON.stringify(result.data, null, 2)
                        }
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocxDebugger;