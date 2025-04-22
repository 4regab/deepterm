import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Zap, Clock, Brain, Lightbulb, CheckCircle, ExternalLink, ArrowRight, BookText, GraduationCap, Timer, Settings, MoreHorizontal } from "lucide-react";

const About = () => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>About DeepTerm - AI-Powered Learning Tools</title>
        <meta name="description" content="Learn about DeepTerm's mission to enhance productivity and learning with AI-powered tools for quiz creation, note extraction, and focus improvement." />
      </Helmet>
      <div className="min-h-screen bg-[#fff6e5] flex flex-col">
        <Navbar />
        
        <main className="container mx-auto px-4 py-12 flex-grow">
          {/* Hero Section */}
          <section className="mb-16 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 bg-white neo-border rounded-full shadow-neo">
              <Zap className="h-5 w-5 text-[#FF5C00]" strokeWidth={2.5} />
              <span className="text-sm font-bold">About DeepTerm</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading tracking-tight">
              Empowering learners with <span className="text-[#9b87f5]">AI-powered</span> tools
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              DeepTerm combines advanced AI technology with proven productivity methods to help students, educators, and professionals maximize their learning and productivity.
            </p>
          </section>
          
          {/* Our Mission Section */}
          <section className="mb-20 max-w-6xl mx-auto">
            <Card className="neo-box overflow-hidden border-none">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                    <p className="text-lg text-gray-700 mb-6">
                      DeepTerm was created with a simple mission: to make learning more efficient, enjoyable, and accessible for everyone. We believe that AI technology should enhance human capability, not replace it.
                    </p>
                    <p className="text-lg text-gray-700">
                      Our tools are designed to help you extract knowledge, reinforce learning through testing, and maintain focus through structured work sessions—combining the best cognitive science principles with cutting-edge AI technology.
                    </p>
                  </div>
                  <div className="bg-[#f5f2ff] p-8 rounded-2xl border-2 border-[#e5deff]">
                    <div className="mb-8">
                      <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-white neo-border mb-4">
                        <Brain className="h-7 w-7 text-[#9b87f5]" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">AI-Powered Tools</h3>
                      <p className="text-gray-700">
                        We leverage AI to transform the way you study, helping you extract meaningful information and create effective study materials from your study materials.
                      </p>
                    </div>
                    <div>
                      <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-white neo-border mb-4">
                        <Lightbulb className="h-7 w-7 text-[#FF5C00]" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Learning Science</h3>
                      <p className="text-gray-700">
                        Our tools are based on proven learning principles like active recall, spaced repetition, and focused deep work sessions.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* What's New Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6 font-heading">What's New at DeepTerm</h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                We're constantly updating our tools based on user feedback and the latest advancements in AI technology.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Quiz Feature Card */}
              <Card className="neo-box overflow-hidden border-none">
                <CardContent className="p-0">
                  <div className="bg-[#9b87f5] p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">Quiz Generator</h3>
                      <div className="bg-white p-1.5 rounded-md">
                        <GraduationCap className="h-5 w-5 text-[#9b87f5]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="font-bold text-lg mb-4">New Features:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#9b87f5] flex-shrink-0 mt-0.5" />
                        <span>Auto-determine mode is now default for better question generation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#9b87f5] flex-shrink-0 mt-0.5" />
                        <span>Verbatim mode is enabled by default for precise learning</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#9b87f5] flex-shrink-0 mt-0.5" />
                        <span>New manual mode for custom term-definition pairs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#9b87f5] flex-shrink-0 mt-0.5" />
                        <span>Enhanced document processing for DOCX files</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              {/* Pomodoro Feature Card */}
              <Card className="neo-box overflow-hidden border-none">
                <CardContent className="p-0">
                  <div className="bg-[#FF5C00] p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">Pomodoro Timer</h3>
                      <div className="bg-white p-1.5 rounded-md">
                        <Clock className="h-5 w-5 text-[#FF5C00]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="font-bold text-lg mb-4">New Features:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                        <span>Daily streak tracking to build consistent habits</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                        <span>Visual streak indicators with progressive coloring</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                        <span>Improved session history visualization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                        <span>Enhanced task management integration</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              {/* Extractor Feature Card */}
              <Card className="neo-box overflow-hidden border-none">
                <CardContent className="p-0">
                  <div className="bg-[#2563eb] p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">Note Extractor</h3>
                      <div className="bg-white p-1.5 rounded-md">
                        <FileText className="h-5 w-5 text-[#2563eb]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="font-bold text-lg mb-4">New Features:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] flex-shrink-0 mt-0.5" />
                        <span>Improved DOCX file text extraction</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] flex-shrink-0 mt-0.5" />
                        <span>Better handling of formatted documents</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] flex-shrink-0 mt-0.5" />
                        <span>Enhanced term recognition in complex texts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] flex-shrink-0 mt-0.5" />
                        <span>Optimized export formats for better readability</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
          
          {/* How It Works Section */}
          <section className="mb-20 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6 font-heading">How Our Tools Work</h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Each of our tools is designed to address specific learning and productivity needs.
              </p>
            </div>
            
            <div className="space-y-12">
              {/* Quiz Generator */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1">
                  <h3 className="text-2xl font-bold mb-4">AI Quiz Generator</h3>
                  <p className="text-lg text-gray-700 mb-6">
                    Our quiz generator uses advanced AI to analyze your study materials and generate effective questions that test your knowledge and reinforce learning.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-[#9b87f5] flex-shrink-0 mt-1" />
                      <span>Upload PDF, DOCX, or TXT files or paste text directly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-[#9b87f5] flex-shrink-0 mt-1" />
                      <span>Choose from multiple question types or use mixed format</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-[#9b87f5] flex-shrink-0 mt-1" />
                      <span>Use manual mode to create custom term-definition pairs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-[#9b87f5] flex-shrink-0 mt-1" />
                      <span>Save quizzes for later practice and review</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-[#f5f2ff] p-8 rounded-2xl border-2 border-[#e5deff] order-1 md:order-2">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-[#9b87f5] shadow-md">
                      <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    <h4 className="text-xl font-bold">Quiz Features</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Auto Question Count</span>
                        <div className="w-10 h-5 bg-[#9b87f5] rounded-full"></div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Verbatim Mode</span>
                        <div className="w-10 h-5 bg-[#9b87f5] rounded-full"></div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Input Mode:</span>
                        <span className="bg-[#9b87f5] text-white text-xs px-2 py-1 rounded mr-2">Auto</span>
                        <span className="bg-[#FF5C00] text-white text-xs px-2 py-1 rounded">Manual</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pomodoro Timer */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-[#FFF9EB] p-8 rounded-2xl border-2 border-[#FFE9C9]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-[#FF5C00] shadow-md">
                      <Timer className="h-7 w-7 text-white" />
                    </div>
                    <h4 className="text-xl font-bold">Pomodoro Features</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-md bg-[#FFA726]">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="font-medium block">3-day streak</span>
                          <div className="h-2 w-32 bg-gray-200 rounded-full mt-1">
                            <div className="h-2 w-full bg-[#FF5C00] rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">Customizable Timers</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-[#FF5C00] text-white text-xs px-2 py-1 rounded">25:00</span>
                        <span className="bg-[#00C6C2] text-white text-xs px-2 py-1 rounded">5:00</span>
                        <span className="bg-[#8B5CF6] text-white text-xs px-2 py-1 rounded">15:00</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FF5C00]" />
                        <span className="font-medium">Todo & Task Integration</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4">Pomodoro Focus Timer</h3>
                  <p className="text-lg text-gray-700 mb-6">
                    Our Pomodoro timer combines the proven time-management technique with modern features to help you maintain focus and track your progress over time.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-[#FF5C00] flex-shrink-0 mt-1" />
                      <span>Customizable focus and break intervals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-[#FF5C00] flex-shrink-0 mt-1" />
                      <span>Visual streak tracking to build daily habits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-[#FF5C00] flex-shrink-0 mt-1" />
                      <span>Integrated task management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-[#FF5C00] flex-shrink-0 mt-1" />
                      <span>Session history and productivity insights</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
          
          {/* Call-to-Action Section */}
          <section className="mb-12 py-16 px-6 bg-[#f5f2ff] rounded-3xl border-2 border-[#d4c8ff] max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">Start using DeepTerm today</h2>
            <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
              Discover how our AI-powered tools can help you learn more efficiently, stay focused, and boost your productivity.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/quiz">
                <Button size="lg" className="h-14 text-lg bg-[#9b87f5] hover:bg-[#8A76E5]">Try Quiz Generator</Button>
              </Link>
              <Link to="/pomodoro">
                <Button size="lg" className="h-14 text-lg bg-[#FF5C00] hover:bg-[#E05000]">Use Pomodoro Timer</Button>
              </Link>
              <Link to="/extractor">
                <Button size="lg" className="h-14 text-lg bg-[#2563eb] hover:bg-[#2050c3]">Extract Notes</Button>
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default About;