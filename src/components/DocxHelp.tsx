import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Upload, Copy } from 'lucide-react';

interface DocxHelpProps {
  onClose?: () => void;
}

const DocxHelp: React.FC<DocxHelpProps> = ({ onClose }) => {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <FileText className="h-5 w-5" />
          DOCX File Issues? Here's How to Fix It
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>Quick Solution:</strong> Convert your DOCX file to PDF for 100% compatibility!
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Method 1: Convert to PDF */}
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800">Method 1: Convert to PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <Download className="h-4 w-4" />
                <span className="font-medium">Steps:</span>
              </div>
              <ol className="ml-6 space-y-1 text-green-700">
                <li>1. Open your DOCX file in Word/Google Docs</li>
                <li>2. Click "File" → "Save As" or "Download"</li>
                <li>3. Choose "PDF" format</li>
                <li>4. Save and upload the PDF here</li>
              </ol>
              <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800">
                ✅ PDFs work perfectly every time!
              </div>
            </CardContent>
          </Card>

          {/* Method 2: Copy Text */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800">Method 2: Copy Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <Copy className="h-4 w-4" />
                <span className="font-medium">Steps:</span>
              </div>
              <ol className="ml-6 space-y-1 text-blue-700">
                <li>1. Open your DOCX file</li>
                <li>2. Select all text (Ctrl+A)</li>
                <li>3. Copy (Ctrl+C)</li>
                <li>4. Paste directly into the text input below</li>
              </ol>
              <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                ⚡ Fastest option for text-only content
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Online Converters */}
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-800">Online Conversion Tools</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="text-purple-700">
              If you can't use Word or Google Docs, try these free online converters:
            </div>
            <ul className="mt-2 ml-4 space-y-1 text-purple-600">
              <li>• SmallPDF.com (DOCX to PDF)</li>
              <li>• ILovePDF.com (DOCX to PDF)</li>
              <li>• Online-Convert.com (Multiple formats)</li>
            </ul>
            <div className="mt-2 p-2 bg-purple-100 rounded text-xs text-purple-700">
              📝 Note: Only use trusted converter sites for sensitive documents
            </div>
          </CardContent>
        </Card>

        {/* Why This Happens */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Why DOCX Files Sometimes Fail</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            <ul className="space-y-1">
              <li>• DOCX files have complex internal structures</li>
              <li>• Embedded images, tables, or special formatting can cause issues</li>
              <li>• PDF format provides more consistent text extraction</li>
              <li>• Some DOCX files may be corrupted or use newer features</li>
            </ul>
          </CardContent>
        </Card>

        {onClose && (
          <div className="flex justify-end pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              className="text-gray-600"
            >
              Got it, thanks!
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocxHelp;