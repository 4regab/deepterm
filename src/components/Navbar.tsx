import React, { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Clock, Menu, Home, BarChart2, Play, Pause, Square, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePomodoroContext } from "@/hooks/usePomodoroContext";
import { Progress } from "./ui/progress";

const Navbar = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    timer, 
    timerType, 
    isRunning, 
    isTimerCompleted, 
    initialTime, 
    toggleTimer, 
    formatTime,
    isTimerVisibleInNavbar
  } = usePomodoroContext();

  // Debounced navigation to prevent double-click issues
  const debouncedNavigate = (path: string) => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    navigationTimeoutRef.current = setTimeout(() => {
      navigate(path);
    }, 100);
  };

  const timerColor = timerType === 'pomodoro' 
    ? 'bg-[#FF5C00]' 
    : timerType === 'shortBreak' 
      ? 'bg-[#20C997]' 
      : 'bg-[#9b87f5]';
  
  const percentComplete = Math.round(((initialTime - timer) / initialTime) * 100);
  
  const NavLinks = () => (
    <nav className="flex items-center gap-3">
      {isTimerVisibleInNavbar && (        <div 
          className="mr-2 neo-border bg-white rounded-lg shadow-neo px-3 py-1 cursor-pointer hover:shadow-neo-lg transition-all hover:-translate-y-0.5"
          onClick={() => debouncedNavigate('/pomodoro')}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <div className="text-sm font-bold">{formatTime(timer)}</div>
            <div className="flex gap-1">
              {isRunning ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTimer();
                  }}
                >
                  <Pause className="h-3 w-3" />
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTimer();
                  }}
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <Progress value={percentComplete} className={`h-1 mt-1 ${timerColor}`} />
        </div>
      )}
      
      <Link to="/">
        <Button variant="outline" className="neo-border bg-white hover:bg-gray-100 text-neo-black font-medium flex items-center gap-2 shadow-neo hover:shadow-neo-lg transition-all hover:-translate-y-0.5 hover:-translate-x-0.5">
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Button>
      </Link>
      <Link to="/extractor">
        <Button variant="outline" className="neo-border bg-neo-accent2 hover:bg-neo-accent2/90 text-white font-medium flex items-center gap-2 shadow-neo hover:shadow-neo-lg transition-all hover:-translate-y-0.5 hover:-translate-x-0.5">
          <FileText className="h-4 w-4" />
          <span>Reviewer</span>
        </Button>
      </Link>
      <Link to="/pomodoro">
        <Button variant="outline" className="neo-border bg-neo-accent3 hover:bg-neo-accent3/90 text-neo-black font-medium flex items-center gap-2 shadow-neo hover:shadow-neo-lg transition-all hover:-translate-y-0.5 hover:-translate-x-0.5">
          <Clock className="h-4 w-4" />
          <span>Pomodoro</span>
        </Button>
      </Link>
      <Link to="/study">
        <Button variant="outline" className="neo-border bg-[#9b87f5] hover:bg-[#8A76E5] text-white font-medium flex items-center gap-2 shadow-neo hover:shadow-neo-lg transition-all hover:-translate-y-0.5 hover:-translate-x-0.5">
          <BookOpen className="h-4 w-4" />
          <span>Study Center</span>
        </Button>
      </Link>
      <Link to="/dashboard">
        <Button variant="outline" className="neo-border bg-[#FFC225] hover:bg-[#FFB300] text-neo-black font-medium flex items-center gap-2 shadow-neo hover:shadow-neo-lg transition-all hover:-translate-y-0.5 hover:-translate-x-0.5">
          <BarChart2 className="h-4 w-4" />
          <span>Dashboard</span>
        </Button>
      </Link>
    </nav>
  );
  
  return (
    <header className="bg-white border-b-2 border-neo-black py-3 sticky top-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.07)]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.ico" alt="Logo" className="h-7 w-7" />
            <h1 className="text-2xl font-bold font-heading">DeepTerm</h1>
          </Link>
          
          {isMobile ? (
            <div className="flex items-center gap-2">
              {isTimerVisibleInNavbar && (                <div 
                  className="neo-border bg-white rounded-lg shadow-neo px-3 py-2 cursor-pointer touch-target"
                  onClick={() => debouncedNavigate('/pomodoro')}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <div className="text-sm font-bold">{formatTime(timer)}</div>
                    {isRunning ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 p-0 touch-target" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTimer();
                        }}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 p-0 touch-target" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTimer();
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}                  </div>
                  <Progress value={percentComplete} className={`h-1.5 mt-1 ${timerColor}`} />
                </div>
              )}
                <Sheet>                <SheetTrigger asChild>
                  <Button variant="outline" className="neo-border shadow-neo p-3 min-h-[48px] min-w-[48px] touch-target hover:shadow-neo-lg hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="border-l-2 border-neo-black bg-white w-[85vw] max-w-[300px] p-4 pt-8">
                  <div className="py-4 flex flex-col gap-4">
                    {isTimerVisibleInNavbar && (                      <div 
                        className="neo-border bg-white rounded-lg shadow-neo p-4 cursor-pointer mb-2"
                        onClick={() => {
                          debouncedNavigate('/pomodoro');
                        }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold">
                            {timerType === 'pomodoro' 
                              ? 'Focus Time' 
                              : timerType === 'shortBreak' 
                                ? 'Short Break' 
                                : 'Long Break'}
                          </h3>                          {isRunning ? (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-10 w-10 touch-target" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTimer();
                              }}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-10 w-10 touch-target" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTimer();
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-center my-2">
                          {formatTime(timer)}
                        </div>
                        <Progress value={percentComplete} className={`h-2 ${timerColor}`} />
                      </div>
                    )}
                      <Link to="/" className="w-full">
                      <Button variant="outline" className="neo-border w-full justify-start font-medium p-4 h-auto min-h-[48px] text-base">
                        <Home className="h-5 w-5 mr-3" />
                        Home
                      </Button>
                    </Link>
                    <Link to="/extractor" className="w-full">
                      <Button variant="outline" className="neo-border w-full justify-start font-medium bg-neo-accent2 text-white p-4 h-auto min-h-[48px] text-base">
                        <FileText className="h-5 w-5 mr-3" />
                        Reviewer Maker
                      </Button>
                    </Link>
                    <Link to="/pomodoro" className="w-full">
                      <Button variant="outline" className="neo-border w-full justify-start font-medium bg-neo-accent3 text-neo-black p-4 h-auto min-h-[48px] text-base">
                        <Clock className="h-5 w-5 mr-3" />
                        Pomodoro Timer
                      </Button>
                    </Link>
                    <Link to="/study" className="w-full">
                      <Button variant="outline" className="neo-border w-full justify-start font-medium bg-[#9b87f5] text-white p-4 h-auto min-h-[48px] text-base">
                        <BookOpen className="h-5 w-5 mr-3" />
                        Study Center
                      </Button>
                    </Link>
                    <Link to="/dashboard" className="w-full">
                      <Button variant="outline" className="neo-border w-full justify-start font-medium bg-[#FFC225] text-neo-black p-4 h-auto min-h-[48px] text-base">
                        <BarChart2 className="h-5 w-5 mr-3" />
                        Dashboard
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          ) : <NavLinks />}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
