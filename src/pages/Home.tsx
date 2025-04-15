import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Zap, Clock, Target, Brain, Lightbulb, CheckCircle, ExternalLink, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Progress } from "@/components/ui/progress";
const Home = () => {
  return <div className="min-h-screen bg-[#fff6e5] flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {/* Hero Section */}
        <section className="mb-20 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 gap-12">
              <div className="text-center">
                <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 bg-white neo-border rounded-full shadow-neo">
                  <Zap className="h-5 w-5 text-neo-accent" strokeWidth={2.5} />
                  <span className="text-sm font-bold">Pomodoro &amp; Notes</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight font-heading tracking-tight">
                  Boost your <span className="text-[#FF5C00]">productivity</span> with DeepTerm
                </h1>
                
                <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
                  Our specialized tools help you focus better and extract knowledge efficiently from any content.
                </p>
                
                <div className="flex flex-wrap gap-5 justify-center">
                  <Link to="/extractor">
                    <Button size="lg" className="group h-14 text-lg">
                      <span>Try Key Term Extractor</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/pomodoro">
                    <Button variant="outline" size="lg" className="bg-white group h-14 text-lg">
                      <span>Use Pomodoro Timer</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 font-heading">Why Choose DeepTerm?</h2>
            <div className="w-24 h-2 bg-neo-accent mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="overflow-hidden border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] hover:shadow-[8px_8px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="w-16 h-16 flex items-center justify-center mb-6 rounded-lg bg-[#ffead6] neo-border">
                  <Brain className="h-8 w-8 text-[#FF5C00]" />
                </div>
                <h3 className="text-2xl font-bold mb-4 font-heading">AI-Powered Tools</h3>
                <p className="text-gray-700 text-lg">
                  Advanced algorithms that understand context and extract meaningful information from your documents and content.
                </p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] hover:shadow-[8px_8px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="w-16 h-16 flex items-center justify-center mb-6 rounded-lg bg-[#e6f1ff] neo-border">
                  <Target className="h-8 w-8 text-[#2563eb]" />
                </div>
                <h3 className="text-2xl font-bold mb-4 font-heading">Focus Enhancement</h3>
                <p className="text-gray-700 text-lg">
                  Structured methods to improve concentration and productivity during work sessions with minimal distractions.
                </p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] hover:shadow-[8px_8px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="w-16 h-16 flex items-center justify-center mb-6 rounded-lg bg-[#FDE1D3] neo-border">
                  <Lightbulb className="h-8 w-8 text-[#FF5C00]" />
                </div>
                <h3 className="text-2xl font-bold mb-4 font-heading">Intuitive Design</h3>
                <p className="text-gray-700 text-lg">
                  Clean, brutalist interface that's easy to use without any learning curve or unnecessary distractions.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Tools Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold mb-16 text-center font-heading">Our Productivity Suite</h2>
          
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Key Term Extractor Card */}
            <Card className="overflow-hidden border-3 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] hover:shadow-[10px_10px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex items-center mb-8">
                  <div className="mr-5 p-4 bg-[#ffead6] rounded-md border-2 border-[#1a1a1a] shadow-neo">
                    <FileText className="h-8 w-8 text-[#FF5C00]" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading">Key Term Extractor</h3>
                </div>
                
                <div className="bg-[#fff9ee] neo-border p-4 mb-6 rounded-lg">
                  <p className="mb-3 text-lg text-neo-black font-medium">
                    Quickly identify and extract important terms from your documents.
                  </p>
                </div>
                
                <ul className="mb-8 text-gray-700 space-y-4 flex-grow">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                    <span className="text-lg">Automatically identifies key terms and concepts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                    <span className="text-lg">Powered by advanced AI to understand context</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                    <span className="text-lg">Works with uploaded documents or pasted text</span>
                  </li>
                </ul>
                
                <div className="mt-auto">
                  <Link to="/extractor" className="w-full block">
                    <button className="cta-button w-full text-xl py-4">
                      <ExternalLink className="mr-2 h-6 w-6" />
                      Open Extractor
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Pomodoro Timer Card */}
            <Card className="overflow-hidden border-3 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] hover:shadow-[10px_10px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex items-center mb-8">
                  <div className="mr-5 p-4 bg-[#e6f1ff] rounded-md border-2 border-[#1a1a1a] shadow-neo">
                    <Clock className="h-8 w-8 text-[#2563eb]" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading">Pomodoro Timer</h3>
                </div>
                
                <div className="bg-[#f0f7ff] neo-border p-4 mb-6 rounded-lg">
                  <p className="mb-3 text-lg text-neo-black font-medium">
                    Boost your productivity with focused work sessions and scheduled breaks.
                  </p>
                </div>
                
                <ul className="mb-8 text-gray-700 space-y-4 flex-grow">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#2563eb] flex-shrink-0 mt-0.5" />
                    <span className="text-lg">25-minute focused work intervals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#2563eb] flex-shrink-0 mt-0.5" />
                    <span className="text-lg">Scheduled breaks to maintain mental freshness</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#2563eb] flex-shrink-0 mt-0.5" />
                    <span className="text-lg">Track your productivity cycles</span>
                  </li>
                </ul>
                
                <div className="mt-auto">
                  <Link to="/pomodoro" className="w-full block">
                    <button className="secondary-button w-full text-xl py-4">
                      <ExternalLink className="mr-2 h-6 w-6" />
                      Open Pomodoro
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="mb-16">
          <div className="max-w-5xl mx-auto bg-[#FFC225] neo-border rounded-xl p-8 md:p-12 shadow-neo-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">Ready to boost your productivity?</h2>
                <p className="text-xl mb-0 md:mb-4">
                  Get started with our powerful tools today and see the difference in your workflow.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/extractor">
                  <Button size="lg" variant="outline" className="bg-white border-2 border-[#1a1a1a] h-14 px-8 text-lg shadow-[4px_4px_0px_#1a1a1a]">
                    <FileText className="mr-2 h-5 w-5" />
                    Try Extractor
                  </Button>
                </Link>
                <Link to="/pomodoro">
                  <Button size="lg" variant="outline" className="bg-white border-2 border-[#1a1a1a] h-14 px-8 text-lg shadow-[4px_4px_0px_#1a1a1a]">
                    <Clock className="mr-2 h-5 w-5" />
                    Try Pomodoro
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>;
};
export default Home;