import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Zap, Clock, Target, Brain, Lightbulb, CheckCircle, ExternalLink, ArrowRight, BookText, FlaskConical, Flame, GraduationCap, Trophy, LineChart, BarChart3 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Progress } from "@/components/ui/progress";
import { Helmet, HelmetProvider } from "react-helmet-async";

const Home = () => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>DeepTerm - AI-Powered Productivity & Learning Tools</title>
        <meta name="description" content="Boost your productivity with DeepTerm's completely free AI-powered tools. Create quizzes, extract organized notes, and stay focused with our Pomodoro timer." />
        <link rel="canonical" href="https://deepterm.tech/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://deepterm.tech/" />
        <meta property="og:title" content="DeepTerm - Free AI-Powered Productivity & Learning Tools" />
        <meta property="og:description" content="Boost your productivity with completely free AI-powered tools to create quizzes, extract organized notes, and stay focused with our Pomodoro timer." />
        <meta property="og:image" content="https://deepterm.tech/og-image.jpg" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://deepterm.tech/" />
        <meta property="twitter:title" content="DeepTerm - Free AI-Powered Productivity & Learning Tools" />
        <meta property="twitter:description" content="Boost your productivity with completely free AI-powered tools to create quizzes, extract organized notes, and stay focused with our Pomodoro timer." />
        <meta property="twitter:image" content="https://deepterm.tech/og-image.jpg" />
      </Helmet>
      <div className="min-h-screen bg-[#fff6e5] flex flex-col">
        <Navbar />
        
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 flex-grow">
          {/* Hero Section */}
          <section className="mb-16 sm:mb-20 py-8 sm:py-10 md:py-16">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 gap-8 sm:gap-12">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border-2 border-[#1a1a1a] shadow-neo-sm rounded-full">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-neo-accent" strokeWidth={2.5} />
                    <span className="text-xs sm:text-sm font-bold">100% FREE • No Paywalls • No Account Required</span>
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight font-heading tracking-tight">
                    Boost your <span className="text-[#FF5C00]">productivity</span> with DeepTerm
                  </h1>
                  
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 sm:mb-10 max-w-3xl mx-auto px-4">
                    Our AI-powered tools help you learn efficiently, create custom quizzes, extract organized notes, track progress, and maintain focus with our Pomodoro timer — all completely free.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
                    <Link to="/dashboard">
                      <Button size="lg" className="group h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg border-2 border-[#1a1a1a] bg-[#FFC225] text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] w-full sm:w-auto">
                        <span>Dashboard</span>
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link to="/study">
                      <Button size="lg" className="group h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg border-2 border-[#1a1a1a] bg-[#9b87f5] text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] w-full sm:w-auto">
                        <span>Study Center</span>
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link to="/extractor">
                      <Button size="lg" className="group h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] w-full sm:w-auto">
                        <span>Try Now</span>
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Features Section */}
          <section className="mb-20 sm:mb-24">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 font-heading">Why Choose DeepTerm?</h2>
              <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-neo-accent mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
              <Card className="overflow-hidden border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a] sm:shadow-[6px_6px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_#1a1a1a] sm:hover:shadow-[8px_8px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200">
                <CardContent className="p-4 sm:p-6 md:p-8 flex flex-col h-full">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center mb-4 sm:mb-6 rounded-lg bg-[#ffead6] border-2 border-[#1a1a1a]">
                    <Brain className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#FF5C00]" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 font-heading">AI-Powered Tools</h3>
                  <p className="text-gray-700 text-sm sm:text-base md:text-lg">
                    Advanced algorithms that understand context and create interactive learning materials from your documents and content.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a] sm:shadow-[6px_6px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_#1a1a1a] sm:hover:shadow-[8px_8px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200">
                <CardContent className="p-4 sm:p-6 md:p-8 flex flex-col h-full">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center mb-4 sm:mb-6 rounded-lg bg-[#e6f1ff] border-2 border-[#1a1a1a]">
                    <Target className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#2563eb]" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 font-heading">Focus Enhancement</h3>
                  <p className="text-gray-700 text-sm sm:text-base md:text-lg">
                    Structured methods to improve concentration and productivity with our Pomodoro timer featuring day streaks and task management.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a] sm:shadow-[6px_6px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_#1a1a1a] sm:hover:shadow-[8px_8px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-6 md:p-8 flex flex-col h-full">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center mb-4 sm:mb-6 rounded-lg bg-[#FDE1D3] border-2 border-[#1a1a1a]">
                    <Trophy className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#FF5C00]" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 font-heading">Gamified Learning</h3>
                  <p className="text-gray-700 text-sm sm:text-base md:text-lg">
                    Track achievements, gain experience levels, and maintain learning streaks with our gamified study tools to stay motivated.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
          
          {/* Tools Section */}
          <section className="mb-16 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-12 sm:mb-16 text-center font-heading">Our Productivity Suite</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 max-w-5xl mx-auto">
              {/* Dashboard Card */}
              <Card className="overflow-hidden border-2 sm:border-3 border-[#1a1a1a] bg-white shadow-[6px_6px_0px_#1a1a1a] sm:shadow-[8px_8px_0px_#1a1a1a] hover:shadow-[8px_8px_0px_#1a1a1a] sm:hover:shadow-[10px_10px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-[#FFC225] p-4 sm:p-5 md:p-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#1a1a1a]">Study Dashboard</h3>
                      <div className="bg-white p-1.5 sm:p-2 rounded-md border-2 border-[#1a1a1a]">
                        <LineChart className="h-5 w-5 sm:h-6 sm:w-6 text-[#1a1a1a]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-5 md:p-6 bg-white flex flex-col min-h-[320px] sm:min-h-[360px]">
                    <div className="mb-4 sm:mb-5 md:mb-6 p-2.5 sm:p-3 bg-[#fffbf2] rounded-lg border-2 border-[#1a1a1a]">
                      <p className="text-[#1a1a1a] font-medium text-sm sm:text-base">
                        <span className="font-bold">NEW:</span> Achievement tracking & gamified learning experience
                      </p>
                    </div>
                  
                    <ul className="space-y-2.5 sm:space-y-3 md:space-y-4 mb-5 sm:mb-6 md:mb-8">
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#FFC225] flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base md:text-lg">Track daily study time and achievements</span>
                      </li>
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#FFC225] flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base md:text-lg">Gain experience levels as you learn</span>
                      </li>
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#FFC225] flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base md:text-lg">Monitor your progress with visual charts</span>
                      </li>
                    </ul>
                    
                    <div className="mt-auto">
                      <Link to="/dashboard" className="w-full block">
                        <button className="w-full text-sm sm:text-base md:text-xl py-2.5 sm:py-3 md:py-4 bg-[#FFC225] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-y-[2px] hover:translate-x-[2px] transition-all rounded-md flex items-center justify-center touch-target">
                          <ExternalLink className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                          Open Dashboard
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Study Center Card */}
              <Card className="overflow-hidden border-2 sm:border-3 border-[#1a1a1a] bg-white shadow-[6px_6px_0px_#1a1a1a] sm:shadow-[8px_8px_0px_#1a1a1a] hover:shadow-[8px_8px_0px_#1a1a1a] sm:hover:shadow-[10px_10px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-[#9b87f5] p-4 sm:p-5 md:p-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#1a1a1a]">Study Center</h3>
                      <div className="bg-white p-1.5 sm:p-2 rounded-md border-2 border-[#1a1a1a]">
                        <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-[#1a1a1a]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-5 md:p-6 bg-white flex flex-col min-h-[320px] sm:min-h-[360px]">
                    <div className="mb-4 sm:mb-5 md:mb-6 p-2.5 sm:p-3 bg-[#f5f2ff] rounded-lg border-2 border-[#1a1a1a]">
                      <p className="text-[#1a1a1a] font-medium text-sm sm:text-base">
                        <span className="font-bold">NEW:</span> Flashcards & custom quiz question types
                      </p>
                    </div>
                  
                    <ul className="space-y-2.5 sm:space-y-3 md:space-y-4 mb-5 sm:mb-6 md:mb-8">
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#9b87f5] flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base md:text-lg">Create interactive flashcards for studying</span>
                      </li>
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#9b87f5] flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base md:text-lg">Generate custom quizzes from your materials</span>
                      </li>
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#9b87f5] flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base md:text-lg">Save and revisit your learning resources</span>
                      </li>
                    </ul>
                    
                    <div className="mt-auto">
                      <Link to="/study" className="w-full block">
                        <button className="w-full text-sm sm:text-base md:text-xl py-2.5 sm:py-3 md:py-4 bg-[#9b87f5] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-y-[2px] hover:translate-x-[2px] transition-all rounded-md flex items-center justify-center touch-target">
                          <ExternalLink className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                          Study Now
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Pomodoro Timer Card */}
              <Card className="overflow-hidden border-3 border-[#1a1a1a] bg-white shadow-[8px_8px_0px_#1a1a1a] hover:shadow-[10px_10px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-[#FF5C00] p-5 md:p-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl md:text-2xl font-bold text-white">Pomodoro Timer</h3>
                      <div className="bg-white p-2 rounded-md border-2 border-[#1a1a1a]">
                        <Clock className="h-6 w-6 text-[#FF5C00]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 md:p-6 bg-white flex flex-col h-[360px]">
                    <div className="mb-5 md:mb-6 p-3 bg-[#FFF9EB] rounded-lg border-2 border-[#1a1a1a]">
                      <p className="text-[#1a1a1a] font-medium">
                        <span className="font-bold">NEW:</span> Integrated task management & focus streaks
                      </p>
                    </div>
                  
                    <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 md:h-6 w-5 md:w-6 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                        <span className="text-base md:text-lg">Customizable work and break durations</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 md:h-6 w-5 md:w-6 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                        <span className="text-base md:text-lg">Integrated to-do list for task management</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 md:h-6 w-5 md:w-6 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                        <span className="text-base md:text-lg">Visual progress indicators and history</span>
                      </li>
                    </ul>
                    
                    <div className="mt-auto">
                      <Link to="/pomodoro" className="w-full block">
                        <button className="w-full text-base md:text-xl py-3 md:py-4 bg-[#FF5C00] text-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-y-[2px] hover:translate-x-[2px] transition-all rounded-md flex items-center justify-center">
                          <ExternalLink className="mr-2 h-5 md:h-6 w-5 md:w-6" />
                          Start Timer
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Notes Extractor Card */}
              <Card className="overflow-hidden border-3 border-[#1a1a1a] bg-white shadow-[8px_8px_0px_#1a1a1a] hover:shadow-[10px_10px_0px_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-[#2563eb] p-5 md:p-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl md:text-2xl font-bold text-white">Reviewer Maker </h3>
                      <div className="bg-white p-2 rounded-md border-2 border-[#1a1a1a]">
                        <FileText className="h-6 w-6 text-[#2563eb]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 md:p-6 bg-white flex flex-col h-[360px]">
                    <div className="mb-5 md:mb-6 p-3 bg-[#EBF5FF] rounded-lg border-2 border-[#1a1a1a]">
                      <p className="text-[#2563eb] font-medium">
                        <span className="font-bold">NEW:</span> Improved file support & organization options
                      </p>
                    </div>
                  
                    <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 md:h-6 w-5 md:w-6 text-[#2563eb] flex-shrink-0 mt-0.5" />
                        <span className="text-base md:text-lg">Extract key terms and definitions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 md:h-6 w-5 md:w-6 text-[#2563eb] flex-shrink-0 mt-0.5" />
                        <span className="text-base md:text-lg">Organize content hierarchically</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 md:h-6 w-5 md:w-6 text-[#2563eb] flex-shrink-0 mt-0.5" />
                        <span className="text-base md:text-lg">Export to PDF, DOCX, or CSV formats</span>
                      </li>
                    </ul>
                    
                    <div className="mt-auto">
                      <Link to="/extractor" className="w-full block">
                        <button className="w-full text-base md:text-xl py-3 md:py-4 bg-[#2563eb] text-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-y-[2px] hover:translate-x-[2px] transition-all rounded-md flex items-center justify-center">
                          <ExternalLink className="mr-2 h-5 md:h-6 w-5 md:w-6" />
                          Extract Notes
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
          
          {/* Free Banner Section */}
          <section className="mb-16 py-12 px-6 bg-white rounded-3xl border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-6 px-4 py-1 bg-[#FFF9EB] border-2 border-[#1a1a1a] rounded-full">
                <Zap className="h-4 w-4 text-[#FF5C00] mr-2" strokeWidth={2.5} />
                <span className="text-sm font-bold text-[#1a1a1a]">100% FREE FOREVER</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 font-heading">No Premium Tiers. No Hidden Fees.</h2>
              <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
                All tools are completely free to use without restrictions. No premium features, no account required, no limitations.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/dashboard">
                  <Button size="lg" className="h-12 md:h-14 text-base md:text-lg border-2 border-[#1a1a1a] bg-[#FFC225] text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">Start Using Now</Button>
                </Link>
              </div>
            </div>
          </section>
          
          {/* Features Grid */}
          <section className="mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-12 text-center font-heading">All the Tools You Need</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="p-6 bg-white border-2 border-[#1a1a1a] rounded-lg shadow-[4px_4px_0px_#1a1a1a] flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[#ffead6] border border-[#1a1a1a]">
                    <LineChart className="h-5 w-5 text-[#FF5C00]" />
                  </div>
                  <h3 className="font-bold text-lg">Progress Tracking</h3>
                </div>
                <p className="text-gray-700">Track study time, achievements, and learning milestones on your personal dashboard</p>
              </div>
              
              <div className="p-6 bg-white border-2 border-[#1a1a1a] rounded-lg shadow-[4px_4px_0px_#1a1a1a] flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[#f5f2ff] border border-[#1a1a1a]">
                    <BookText className="h-5 w-5 text-[#9b87f5]" />
                  </div>
                  <h3 className="font-bold text-lg">Flashcards</h3>
                </div>
                <p className="text-gray-700">Create and review custom flashcards with spaced repetition for better retention</p>
              </div>
              
              <div className="p-6 bg-white border-2 border-[#1a1a1a] rounded-lg shadow-[4px_4px_0px_#1a1a1a] flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[#FFF9EB] border border-[#1a1a1a]">
                    <GraduationCap className="h-5 w-5 text-[#FF5C00]" />
                  </div>
                  <h3 className="font-bold text-lg">Custom Quizzes</h3>
                </div>
                <p className="text-gray-700">Generate personalized quizzes from your study materials with multiple question types</p>
              </div>
              
              <div className="p-6 bg-white border-2 border-[#1a1a1a] rounded-lg shadow-[4px_4px_0px_#1a1a1a] flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[#EBF5FF] border border-[#1a1a1a]">
                    <FileText className="h-5 w-5 text-[#2563eb]" />
                  </div>
                  <h3 className="font-bold text-lg">Notes Extraction</h3>
                </div>
                <p className="text-gray-700">Transform complex documents into organized notes with key terms and definitions</p>
              </div>
              
              <div className="p-6 bg-white border-2 border-[#1a1a1a] rounded-lg shadow-[4px_4px_0px_#1a1a1a] flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[#FDE1D3] border border-[#1a1a1a]">
                    <Clock className="h-5 w-5 text-[#FF5C00]" />
                  </div>
                  <h3 className="font-bold text-lg">Pomodoro Timer</h3>
                </div>
                <p className="text-gray-700">Stay focused with customizable work and break cycles and integrated task management</p>
              </div>
              
              <div className="p-6 bg-white border-2 border-[#1a1a1a] rounded-lg shadow-[4px_4px_0px_#1a1a1a] flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[#e6f1ff] border border-[#1a1a1a]">
                    <Trophy className="h-5 w-5 text-[#2563eb]" />
                  </div>
                  <h3 className="font-bold text-lg">Achievements</h3>
                </div>
                <p className="text-gray-700">Earn badges and unlock achievements as you reach learning and productivity milestones</p>
              </div>
            </div>
          </section>
          
          {/* Call-to-Action Section */}
          <section className="mb-12 py-12 md:py-16 px-6 bg-[#f5f2ff] rounded-3xl border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] max-w-5xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 font-heading">Ready to boost your productivity?</h2>
              <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
                Get started with our comprehensive suite of AI-powered tools designed to help you learn faster, focus better, and achieve more.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/dashboard">
                  <Button size="lg" className="h-12 md:h-14 text-base md:text-lg border-2 border-[#1a1a1a] bg-[#FFC225] text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">Dashboard</Button>
                </Link>
                <Link to="/study">
                  <Button size="lg" className="h-12 md:h-14 text-base md:text-lg border-2 border-[#1a1a1a] bg-[#9b87f5] text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">Study Center</Button>
                </Link>
                <Link to="/pomodoro">
                  <Button size="lg" className="h-12 md:h-14 text-base md:text-lg border-2 border-[#1a1a1a] bg-[#FF5C00] text-white shadow-[4px_4px_0px_#1a1a1a]">Pomodoro Timer</Button>
                </Link>
                <Link to="/extractor">
                  <Button size="lg" className="h-12 md:h-14 text-base md:text-lg border-2 border-[#1a1a1a] bg-[#2563eb] text-white shadow-[4px_4px_0px_#1a1a1a]">Notes Extractor</Button>
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default Home;