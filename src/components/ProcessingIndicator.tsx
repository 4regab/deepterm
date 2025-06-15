import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtractionMode } from "@/services/geminiService";
import { useEffect, useState } from "react";
import { Zap, BrainCircuit, Bot, Cpu, Dna, Sparkle, Flame } from "lucide-react";

interface ProcessingIndicatorProps {
  mode: ExtractionMode;
}

const ProcessingIndicator = ({ mode }: ProcessingIndicatorProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Array of processing steps
  const steps = [
    "Analyzing document structure",
    "Identifying key terms",
    "Extracting definitions",
    "Organizing information",
    "Finalizing results"
  ];
  
  useEffect(() => {
    // Simulate progress updates
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        
        // Update step based on progress
        const newProgress = prev + (Math.random() * 3 + 1);        if (newProgress > currentStep * 20 + 20 && currentStep < steps.length - 1) {
          setCurrentStep(currStep => currStep + 1);
        }
        
        return newProgress;
      });
    }, 300);
    
    return () => clearInterval(timer);
  }, [currentStep, steps.length]);
  
  const renderIcon = () => {
    const icons = [
      <BrainCircuit key="brain" className="animate-pixel-pulse text-neo-accent" size={40} strokeWidth={2.5} />,
      <Sparkle key="sparkle" className="animate-pixel-pulse text-neo-accent4" size={40} strokeWidth={2.5} />,
      <Bot key="bot" className="animate-pixel-pulse text-neo-accent2" size={40} strokeWidth={2.5} />,
      <Cpu key="cpu" className="animate-pixel-pulse text-neo-accent3" size={40} strokeWidth={2.5} />,
      <Flame key="flame" className="animate-pixel-pulse text-neo-accent" size={40} strokeWidth={2.5} />
    ];
    
    return (
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {icons.map((icon, i) => (
          <div 
            key={i} 
            className={`transition-all duration-500 ${
              i === currentStep % icons.length ? "scale-125" : "scale-75 opacity-40"
            }`}
            style={{ 
              imageRendering: 'pixelated',
              transform: i === currentStep % icons.length ? 
                'scale(1.25) translate(0, -4px)' : 'scale(0.75) translate(0, 0)'
            }}
          >
            {icon}
          </div>
        ))}
      </div>
    );
  };
  
  const getModeTitle = () => {
    switch (mode) {
      case "full": return "Normal Extraction";
      case "sentence": return "One Sentence Definitions";
      case "keywords": return "Keywords Extraction";
      default: return "Custom Extraction";
    }
  };
  
  return (
    <Card className="w-full max-w-md neo-border shadow-neo bg-white border-2 border-neo-black rounded-lg">
      <CardHeader className="pb-3 bg-neo-accent bg-opacity-50 border-b-2 border-neo-black">
        <CardTitle className="text-center flex items-center justify-center gap-2 font-heading">
          <Zap className="h-5 w-5 text-neo-black animate-pixel-pulse" strokeWidth={2.5} />
          Processing with {getModeTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {renderIcon()}
        
        <div className="space-y-5">
          <div className="w-full h-4 neo-border overflow-hidden">
            <div 
              className="h-full bg-neo-accent" 
              style={{width: `${progress}%`, transition: 'width 0.3s'}}
            ></div>
          </div>
          
          <div className="text-center font-heading text-lg text-neo-black">
            {steps[currentStep]}
            <span className="inline-block ml-1 animate-bounce">...</span>
          </div>
          
          <div className="text-sm text-center font-mono text-neo-muted">
            Using AI to extract key terms and their meanings
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingIndicator;
