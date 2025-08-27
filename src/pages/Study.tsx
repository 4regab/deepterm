import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Brain, BookOpen, ArrowRight } from "lucide-react";

const Study = () => {
  // Set document title on mount
  useEffect(() => {
    document.title = "Study Center - DeepTerm";
  }, []);

  const studyTools = [
    {
      title: "Text Reviewer",
      description: "Extract key terms and create study materials from documents and text",
      icon: FileText,
      link: "/extractor",
      color: "bg-[#20C997]",
      hoverColor: "hover:bg-[#1BA085]",
      features: ["PDF & DOCX upload", "AI key term extraction", "Study material creation", "Save & export results"]
    },
    {
      title: "Quiz Maker",
      description: "Create and take AI-generated quizzes based on your study materials",
      icon: Brain,
      link: "/quiz",
      color: "bg-[#FF5C00]",
      hoverColor: "hover:bg-[#E54700]",
      features: ["Multiple choice & true/false", "Auto-generated questions", "Progress tracking", "Performance analytics"]
    },
    {
      title: "Flashcard Creator",
      description: "Build and study flashcard decks with spaced repetition learning",
      icon: BookOpen,
      link: "/flashcards",
      color: "bg-[#9b87f5]",
      hoverColor: "hover:bg-[#8A76E5]",
      features: ["AI-powered flashcards", "Spaced repetition", "Progress tracking", "Multiple study modes"]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6e5]">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12 flex-grow">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-block -rotate-2 p-3 sm:p-4 lg:p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-3 sm:border-4 border-black mb-4 sm:mb-6 bg-[#FFC225]">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-black relative rotate-2">
              Study Center
            </h1>
          </div>
          <p className="text-[#1A1F2C] mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl font-medium px-3 sm:px-4 py-1.5 sm:py-2 bg-white inline-block border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Your all-in-one hub for AI-powered study tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {studyTools.map((tool, index) => {
            const IconComponent = tool.icon;
            return (
              <Link key={index} to={tool.link} className="group block">
                <Card className="h-full border-3 sm:border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 overflow-hidden">
                  <CardHeader className={`${tool.color} ${tool.hoverColor} transition-colors duration-300 p-4 sm:p-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-white rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
                          <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
                        </div>
                        <CardTitle className="text-lg sm:text-xl lg:text-2xl font-black text-white">
                          {tool.title}
                        </CardTitle>
                      </div>
                      <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-white opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 sm:p-6">
                    <p className="text-sm sm:text-base text-[#1A1F2C] font-medium mb-4 sm:mb-6 leading-relaxed">
                      {tool.description}
                    </p>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <h4 className="text-sm sm:text-base font-bold text-[#1A1F2C] mb-2 sm:mb-3">Key Features:</h4>
                      <ul className="space-y-1 sm:space-y-2">
                        {tool.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center text-xs sm:text-sm text-[#1A1F2C]">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#1A1F2C] rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-[#1A1F2C]">
                          Get Started
                        </span>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-[#1A1F2C] group-hover:text-black transition-colors">
                          <span>Launch Tool</span>
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Study;