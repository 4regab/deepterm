import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ExtractionResult } from "@/types";
import { exportAsCSV, exportAsDocx, exportAsPDF } from "@/utils/fileUtils";
import { AlertTriangle, AlignJustify, BrainCog, Download, Edit, ExternalLink, FileText, FileType, List, Zap } from "lucide-react";
import { useState } from "react";

interface ResultsDisplayProps {
  result: ExtractionResult;
  onReset: () => void;
  originalFilename?: string;
}

const ResultsDisplay = ({ result, onReset, originalFilename }: ResultsDisplayProps) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  // Enhanced error check - ensure result and keyTerms are valid
  if (!result || !result.keyTerms) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          No extraction results found. There might have been an issue with the API response.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Additional safeguard - ensure keyTerms is an array with length
  const keyTerms = Array.isArray(result.keyTerms) ? result.keyTerms : [];
  if (keyTerms.length === 0) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          No key terms were found in the extraction results.
        </AlertDescription>
      </Alert>
    );
  }

  // Group terms by category if available
  const groupedTerms = keyTerms.reduce<Record<string, typeof keyTerms>>(
    (groups, term) => {
      const category = term.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(term);
      return groups;
    },
    {}
  );

  const handleExportPDF = async () => {
    try {
      setIsExporting("pdf");
      await exportAsPDF(result, originalFilename);
      toast({
        title: "PDF Export Successful",
        description: "Your terms have been exported to PDF with proper formatting",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "PDF Export Failed",
        description: error instanceof Error ? error.message : "There was an error exporting to PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportCSV = () => {
    try {
      setIsExporting("csv");
      exportAsCSV(result, originalFilename);
      toast({
        title: "CSV Export Successful",
        description: "Your terms have been exported to CSV",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "CSV Export Failed",
        description: error instanceof Error ? error.message : "There was an error exporting to CSV",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportDocx = async () => {
    try {
      setIsExporting("docx");
      await exportAsDocx(result, originalFilename);
      toast({
        title: "DOCX Export Successful",
        description: "Your terms have been exported to DOCX with proper formatting",
      });
    } catch (error) {
      console.error("Error exporting DOCX:", error);
      toast({
        title: "DOCX Export Failed",
        description: error instanceof Error ? error.message : "There was an error exporting to DOCX",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const getExtractionModeInfo = () => {
    switch (result.extractionMode) {
      case "full":
        return {
          name: "Normal Extraction",
          icon: <AlignJustify className="h-4 w-4" />,
          color: "bg-neo-accent text-neo-black"
        };
      case "sentence":
        return {
          name: "One Sentence",
          icon: <Edit className="h-4 w-4" />,
          color: "bg-neo-accent2 text-neo-black"
        };
      case "keywords":
        return {
          name: "Keywords",
          icon: <List className="h-4 w-4" />,
          color: "bg-neo-accent3 text-neo-black"
        };
      default:
        return {
          name: "Custom",
          icon: <FileText className="h-4 w-4" />,
          color: "bg-gray-500 text-white"
        };
    }
  };

  const modeInfo = getExtractionModeInfo();

  return (
    <Card className="w-full max-w-3xl neo-border shadow-neo border-2 border-neo-black">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-neo-black">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-neo-accent" strokeWidth={2.5} />
            <CardTitle className="text-xl font-heading text-neo-black">{result.title}</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-sm text-neo-muted">
              {keyTerms.length} key terms extracted
            </p>
            <Badge className={`flex items-center gap-1 text-xs rounded-full neo-border ${modeInfo.color}`}>
              {modeInfo.icon}
              {modeInfo.name}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs rounded-full neo-border text-neo-black bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            onClick={handleExportPDF}
            disabled={isExporting !== null}
          >
            {isExporting === "pdf" ? (
              <>Loading...</>
            ) : (
              <>
                <FileType className="h-4 w-4" />
                <span>PDF</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs rounded-full neo-border text-neo-black bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            onClick={handleExportDocx}
            disabled={isExporting !== null}
          >
            {isExporting === "docx" ? (
              <>Loading...</>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>DOCX</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs rounded-full neo-border text-neo-black bg-white hover:bg-neo-bg shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            onClick={handleExportCSV}
            disabled={isExporting !== null}
          >
            {isExporting === "csv" ? (
              <>Loading...</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">

        <div className="divide-y-2 divide-neo-black">
          {Object.keys(groupedTerms).length > 1 ? (
            Object.entries(groupedTerms).map(([category, terms], categoryIndex) => (
              <div key={categoryIndex} className="p-4 md:p-6">
                <h3 className="font-semibold text-lg mb-4 text-neo-black">{category}</h3>
                <Accordion type="multiple" className="space-y-3">
                  {terms.map((item, index) => (
                    <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}
                      className="neo-border bg-white overflow-hidden rounded-lg shadow-neo-sm">
                      <AccordionTrigger className="py-3 px-4 hover:bg-neo-bg font-medium text-neo-black">
                        <span className="text-base text-left">{item.term}</span>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 border-t-2 border-neo-black bg-white">
                        <p className="text-neo-black text-sm">{item.meaning}</p>

                        {item.subcategories && item.subcategories.length > 0 && (
                          <div className="mt-4 pt-3 border-t-2 border-neo-black">
                            <p className="text-sm font-medium text-neo-black mb-2">{item.subcategoryTitle || "Types"}:</p>
                            <ol className="list-disc ml-5 space-y-1">
                              {item.subcategories.map((subcategory, subIndex) => (
                                <li key={subIndex} className="text-sm text-neo-black">{subcategory}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {item.examples && item.examples.length > 0 && (
                          <div className="mt-4 pt-3 border-t-2 border-neo-black">
                            <p className="text-sm font-medium text-neo-black mb-2">Examples:</p>
                            <ul className="list-disc ml-5 space-y-1">
                              {item.examples.map((example, exIndex) => {
                                const cleanedExample = example
                                  .replace(/^[\s•\-–—*]+/, '')
                                  .trim();

                                return (
                                  <li key={exIndex} className="text-sm text-neo-black">
                                    {cleanedExample}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {item.keywords && item.keywords.length > 0 && (
                          <div className="mt-4 pt-3 border-t-2 border-neo-black">
                            <p className="text-sm font-medium text-neo-black mb-2">Keywords:</p>
                            <p className="text-sm text-neo-black">
                              {item.keywords.join(", ")}
                            </p>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          ) : (
            <div className="p-4 md:p-6">
              <Accordion type="multiple" className="space-y-3">
                {keyTerms.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}
                    className="neo-border bg-white overflow-hidden rounded-lg shadow-neo-sm">
                    <AccordionTrigger className="py-3 px-4 hover:bg-neo-bg font-medium text-neo-black">
                      <span className="text-base text-left">{item.term}</span>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t-2 border-neo-black bg-white">
                      <p className="text-neo-black text-sm">{item.meaning}</p>

                      {item.subcategories && item.subcategories.length > 0 && (
                        <div className="mt-4 pt-3 border-t-2 border-neo-black">
                          <p className="text-sm font-medium text-neo-black mb-2">{item.subcategoryTitle || "Types"}:</p>
                          <ol className="list-disc ml-5 space-y-1">
                            {item.subcategories.map((subcategory, subIndex) => (
                              <li key={subIndex} className="text-sm text-neo-black">{subcategory}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {item.examples && item.examples.length > 0 && (
                        <div className="mt-4 pt-3 border-t-2 border-neo-black">
                          <p className="text-sm font-medium text-neo-black mb-2">Examples:</p>
                          <ul className="list-disc ml-5 space-y-1">
                            {item.examples.map((example, exIndex) => {
                              const cleanedExample = example
                                .replace(/^[\s•\-–—*]+/, '')
                                .trim();

                              return (
                                <li key={exIndex} className="text-sm text-neo-black">
                                  {cleanedExample}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {item.keywords && item.keywords.length > 0 && (
                        <div className="mt-4 pt-3 border-t-2 border-neo-black">
                          <p className="text-sm font-medium text-neo-black mb-2">Keywords:</p>
                          <p className="text-sm text-neo-black">
                            {item.keywords.join(", ")}
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 border-t-2 border-neo-black">
          <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg neo-border border-2 border-neo-black">
            <div className="flex items-start gap-3">
              <BrainCog className="h-10 w-10 text-purple-600 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-neo-black text-lg mb-2">Test your knowledge</h3>
                <p className="text-neo-black text-sm mb-3">
                  Take these extracted notes to create a quiz using verbatim mode in QuillBro to improve retention and understanding.
                </p>
                <a
                  href="https://quillbro.live/quiz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                >
                  Create a quiz in QuillBro <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onReset}
            className="text-neo-black bg-white hover:bg-neo-bg neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg"
          >
            Process New Text
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
