import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, BrainCog, CheckCircle, FileText, Lightbulb, ListTodo, Target, Timer, Sparkles, Zap } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-[#fff6e5] flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
              About <span className="text-[#FF5C00]">DeepTerm</span>
            </h1>
            <p className="text-xl text-gray-700">
              Your all-in-one AI-powered productivity toolkit
            </p>
          </div>

          <Card className="neo-border overflow-hidden shadow-neo mb-12">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-[#ffead6] rounded-lg neo-border">
                  <BrainCog className="h-6 w-6 text-[#FF5C00]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3">What is DeepTerm?</h2>
                  <p className="text-lg text-gray-700">
                    DeepTerm is an AI-enhanced productivity platform designed to help you work more efficiently and effectively. We combine time management techniques with advanced AI-powered tools to create a comprehensive productivity solution for students, researchers, professionals, and anyone looking to improve their focus and organization.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-8 mt-10">
                <h3 className="text-xl font-bold border-b-2 border-gray-200 pb-2">Our Core Tools</h3>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Pomodoro Timer Section */}
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-[#f0f7ff] rounded-md border-2 border-[#1a1a1a] shadow-neo">
                        <Timer className="h-5 w-5 text-[#2563eb]" />
                      </div>
                      <h4 className="text-xl font-bold font-heading">Pomodoro Timer</h4>
                    </div>

                    <div className="bg-white neo-border p-4 rounded-lg mb-4">
                      <p className="text-gray-700">
                        Our Pomodoro Timer helps you maintain focus and avoid burnout with structured work sessions and breaks, complete with task tracking.
                      </p>
                    </div>

                    <div className="space-y-3 flex-grow mb-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] mt-0.5" />
                        <p>25-minute focused work intervals</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] mt-0.5" />
                        <p>Short and long break timers</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] mt-0.5" />
                        <p>Integrated task management</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] mt-0.5" />
                        <p>Progress tracking and completion history</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reviewer Maker Section */}
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-[#FDE1D3] rounded-md border-2 border-[#1a1a1a] shadow-neo">
                        <FileText className="h-5 w-5 text-[#FF5C00]" />
                      </div>
                      <h4 className="text-xl font-bold font-heading">Reviewer Maker</h4>
                    </div>

                    <div className="bg-white neo-border p-4 rounded-lg mb-4">
                      <p className="text-gray-700">
                        Our AI-powered tool extracts and organizes key terms, concepts, and definitions from text documents, creating hierarchically structured notes automatically.
                      </p>
                    </div>

                    <div className="space-y-3 flex-grow mb-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FF5C00] mt-0.5" />
                        <p>Multiple extraction modes: full, sentence, or keywords</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FF5C00] mt-0.5" />
                        <p>AI-powered categorization of terms into hierarchical structures</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FF5C00] mt-0.5" />
                        <p>Context-aware analysis for better understanding</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FF5C00] mt-0.5" />
                        <p>Export functionality for extracted terms</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* To-Do List Section */}
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-[#FFF9EB] rounded-md neo-border">
                      <ListTodo className="h-5 w-5 text-[#FFC225]" />
                    </div>
                    <h4 className="text-xl font-bold font-heading">Task Management</h4>
                  </div>

                  <div className="bg-white neo-border p-4 rounded-lg mb-4">
                    <p className="text-gray-700">
                      Our integrated task management system helps you organize your work and stay on track during your Pomodoro sessions.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FFC225] mt-0.5" />
                        <p>Create and manage tasks while working</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FFC225] mt-0.5" />
                        <p>Track completed and remaining tasks</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FFC225] mt-0.5" />
                        <p>Collapsible interface for distraction-free work</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#FFC225] mt-0.5" />
                        <p>Persistent storage between sessions</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Technology Section - New */}
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-[#e6f1ff] rounded-md neo-border">
                      <Sparkles className="h-5 w-5 text-[#2563eb]" />
                    </div>
                    <h4 className="text-xl font-bold font-heading">AI Technology</h4>
                  </div>

                  <div className="bg-white neo-border p-4 rounded-lg mb-4">
                    <p className="text-gray-700">
                      We leverage advanced AI algorithms to power our tools, helping you work smarter and more efficiently.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] mt-0.5" />
                        <p>Natural language processing for content understanding</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] mt-0.5" />
                        <p>Context-aware analysis of documents</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] mt-0.5" />
                        <p>Automated categorization and organization</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#2563eb] mt-0.5" />
                        <p>Continually improving systems</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How to Use Section */}
              <div className="mt-12">
                <h3 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-6">How to Get Started</h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF5C00] flex items-center justify-center text-white font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h5 className="text-lg font-bold mb-1">Choose Your Tool</h5>
                      <p className="text-gray-700">
                        Start with either the Pomodoro Timer to improve your focus or the Reviewer Maker to extract key information from your documents.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF5C00] flex items-center justify-center text-white font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h5 className="text-lg font-bold mb-1">Set Up Your Environment</h5>
                      <p className="text-gray-700">
                        For the Pomodoro Timer, create tasks you want to work on. For the Reviewer Maker, prepare your text or document for processing.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF5C00] flex items-center justify-center text-white font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h5 className="text-lg font-bold mb-1">Start Working</h5>
                      <p className="text-gray-700">
                        Begin your focused work sessions with the Pomodoro Timer, or extract key information from your text using the Reviewer Maker.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF5C00] flex items-center justify-center text-white font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h5 className="text-lg font-bold mb-1">Track and Review</h5>
                      <p className="text-gray-700">
                        Monitor your progress, check off completed tasks, and review or export your notes as needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Philosophy Section */}
              <div className="mt-12">
                <h3 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-6">Our Philosophy</h3>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white neo-border p-5 rounded-lg">
                    <div className="p-2 bg-[#e6f1ff] rounded-md neo-border mb-3 w-12 h-12 flex items-center justify-center">
                      <Target className="h-6 w-6 text-[#2563eb]" />
                    </div>
                    <h4 className="text-lg font-bold mb-2">Focus Enhancement</h4>
                    <p className="text-gray-700">
                      Structured methods to improve concentration and productivity during work sessions with minimal distractions.
                    </p>
                  </div>

                  <div className="bg-white neo-border p-5 rounded-lg">
                    <div className="p-2 bg-[#FDE1D3] rounded-md neo-border mb-3 w-12 h-12 flex items-center justify-center">
                      <Lightbulb className="h-6 w-6 text-[#FF5C00]" />
                    </div>
                    <h4 className="text-lg font-bold mb-2">Intuitive Design</h4>
                    <p className="text-gray-700">
                      Clean, brutalist interface that's easy to use without any learning curve or unnecessary distractions.
                    </p>
                  </div>

                  <div className="bg-white neo-border p-5 rounded-lg">
                    <div className="p-2 bg-[#FFF9EB] rounded-md neo-border mb-3 w-12 h-12 flex items-center justify-center">
                      <Brain className="h-6 w-6 text-[#FFC225]" />
                    </div>
                    <h4 className="text-lg font-bold mb-2">Smart Technology</h4>
                    <p className="text-gray-700">
                      Leveraging AI and proven productivity techniques to help you work smarter, not harder.
                    </p>
                  </div>
                </div>
              </div>

              {/* Latest Updates Section - New */}
              <div className="mt-12">
                <h3 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-6">Latest Updates</h3>
                
                <div className="bg-white neo-border p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-5 w-5 text-[#FF5C00]" />
                    <h4 className="text-lg font-bold">April 2025 Improvements</h4>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#FF5C00] mt-0.5" />
                      <p>Enhanced AI capabilities in our Reviewer Maker tool</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#FF5C00] mt-0.5" />
                      <p>Improved user interface with better accessibility</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#FF5C00] mt-0.5" />
                      <p>Updated task management system integration</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#FF5C00] mt-0.5" />
                      <p>Expanded documentation and guided tutorials</p>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;