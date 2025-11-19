import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { uploadFileToGemini, extractKeyTermsFromFile, testApiKey } from '@/services/geminiService';
import { ExtractionMode } from '@/types';

const DocxDebuggerNew: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('full');
  const [results, setResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<unknown>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadedFileInfo(null);
      setResults('');
      console.log('File selected:', file.name, file.type, file.size);
    }
  };

  const testApiConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testApiKey();
      setApiKeyStatus(result.success ? '✅ API Key Valid' : `❌ API Key Error: ${result.error}`);
    } catch (error) {
      setApiKeyStatus(`❌ API Test Failed: ${error}`);
    }
    setIsLoading(false);
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      setResults('❌ No file selected');
      return;
    }

    setIsLoading(true);
    setResults('📤 Uploading file...');

    try {
      const fileInfo = await uploadFileToGemini(selectedFile);
      setUploadedFileInfo(fileInfo);
      setResults(`✅ Upload successful!\n\nFile Info:\n${JSON.stringify({
        name: fileInfo.name,
        uri: fileInfo.uri,
        mimeType: fileInfo.mimeType,
        sizeBytes: fileInfo.sizeBytes,
        state: fileInfo.state
      }, null, 2)}`);
    } catch (error) {
      setResults(`❌ Upload failed: ${error}`);
      console.error('Upload error:', error);
    }
    setIsLoading(false);
  };

  const extractContent = async () => {
    if (!uploadedFileInfo) {
      setResults('❌ No uploaded file. Please upload a file first.');
      return;
    }

    setIsLoading(true);
    setResults('🔍 Extracting content...');

    try {
      const extraction = await extractKeyTermsFromFile(uploadedFileInfo, extractionMode || undefined);
      setResults(`✅ Extraction successful!\n\nResults:\n${JSON.stringify(extraction, null, 2)}`);
    } catch (error) {
      setResults(`❌ Extraction failed: ${error}`);
      console.error('Extraction error:', error);
    }
    setIsLoading(false);
  };

  const testFullProcess = async () => {
    if (!selectedFile) {
      setResults('❌ No file selected');
      return;
    }

    setIsLoading(true);
    setResults('🚀 Testing full process...\n\n');

    try {
      // Step 1: Upload
      setResults(prev => prev + '📤 Step 1: Uploading file...\n');
      const fileInfo = await uploadFileToGemini(selectedFile);
      setUploadedFileInfo(fileInfo);
      setResults(prev => prev + `✅ Upload successful! State: ${fileInfo.state}\n\n`);

      // Step 2: Extract
      setResults(prev => prev + '🔍 Step 2: Extracting content...\n');
      const extraction = await extractKeyTermsFromFile(fileInfo, extractionMode || undefined);
      setResults(prev => prev + `✅ Extraction successful! Found ${extraction.keyTerms.length} terms\n\n`);
      
      // Step 3: Display results
      setResults(prev => prev + `📋 Results:\n${JSON.stringify(extraction, null, 2)}`);
      
    } catch (error) {
      setResults(prev => prev + `❌ Process failed: ${error}`);
      console.error('Full process error:', error);
    }
    setIsLoading(false);
  };

  const getFileTypeInfo = () => {
    if (!selectedFile) return null;
    
    const isDocx = selectedFile.name.toLowerCase().endsWith('.docx') || 
                   selectedFile.type.includes('wordprocessingml');
    
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">File Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Name:</span>
            <span className="font-mono text-sm">{selectedFile.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-mono text-sm">{selectedFile.type || 'unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span>Size:</span>
            <span className="font-mono text-sm">{(selectedFile.size / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex justify-between">
            <span>DOCX Detected:</span>
            <Badge variant={isDocx ? "default" : "secondary"}>
              {isDocx ? "Yes" : "No"}
            </Badge>
          </div>
          {selectedFile.size > 50 * 1024 * 1024 && (
            <Alert>
              <AlertDescription>
                ⚠️ File is larger than 50MB and may cause processing issues
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Enhanced DOCX Processing Debugger</h1>
      
      {/* API Key Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button onClick={testApiConnection} disabled={isLoading}>
              Test API Key
            </Button>
            {apiKeyStatus && (
              <span className="text-sm">{apiKeyStatus}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>File Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-input">Select DOCX File</Label>
            <Input
              id="file-input"
              type="file"
              accept=".docx,.doc,.pdf,.txt"
              onChange={handleFileSelect}
            />
          </div>
          
          <div>
            <Label htmlFor="extraction-mode">Extraction Mode</Label>
            <Select 
              value={extractionMode || ""} 
              onValueChange={(value: string) => setExtractionMode(value as ExtractionMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Definitions</SelectItem>
                <SelectItem value="sentence">Single Sentence</SelectItem>
                <SelectItem value="keywords">Keywords Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {getFileTypeInfo()}
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={uploadFile} 
              disabled={!selectedFile || isLoading}
              variant="outline"
            >
              1. Upload File Only
            </Button>
            
            <Button 
              onClick={extractContent} 
              disabled={!uploadedFileInfo || isLoading}
              variant="outline"
            >
              2. Extract Content Only
            </Button>
            
            <Separator orientation="vertical" className="h-8" />
            
            <Button 
              onClick={testFullProcess} 
              disabled={!selectedFile || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              🚀 Test Full Process
            </Button>
          </div>
          
          <Alert>
            <AlertDescription>
              <strong>Testing Strategy:</strong>
              <br />• <strong>Upload Only:</strong> Tests if the DOCX file can be uploaded successfully
              <br />• <strong>Extract Only:</strong> Tests content extraction from an already uploaded file
              <br />• <strong>Full Process:</strong> Tests the complete upload → extract workflow
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results & Debug Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={results}
            readOnly
            className="min-h-[400px] font-mono text-sm"
            placeholder="Test results will appear here..."
          />
          {isLoading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Processing...</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Enhanced DOCX Fixes Applied</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <ul className="space-y-1">
            <li>✅ DOCX-specific MIME type correction</li>
            <li>✅ Extended processing wait times for DOCX files</li>
            <li>✅ Using gemini-flash-latest model</li>
            <li>✅ Simplified prompt structure for complex documents</li>
            <li>✅ File size and validation checks</li>
            <li>✅ Detailed error messages with troubleshooting suggestions</li>
            <li>✅ Enhanced state monitoring during upload</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocxDebuggerNew;