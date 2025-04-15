
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Timer, Pause, Play, RefreshCcw, Volume2, VolumeX, CheckCircle2, Clock, Coffee, InfoIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";

// Default timer settings
const DEFAULT_SETTINGS = {
  pomodoro: 25 * 60, // 25 minutes in seconds
  shortBreak: 5 * 60, // 5 minutes in seconds
  longBreak: 15 * 60, // 15 minutes in seconds
  pomodorosUntilLongBreak: 4
};

// Timer types
type TimerType = 'pomodoro' | 'shortBreak' | 'longBreak';

const Pomodoro = () => {
  // Timer state
  const [timer, setTimer] = useState(DEFAULT_SETTINGS.pomodoro);
  const [timerType, setTimerType] = useState<TimerType>('pomodoro');
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [initialTime, setInitialTime] = useState(DEFAULT_SETTINGS.pomodoro);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle timer completion
  const handleTimerComplete = () => {
    // Play sound if not muted
    if (!isMuted) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }

    // Show toast notification
    toast({
      title: `${timerType === 'pomodoro' ? 'Pomodoro' : 'Break'} completed!`,
      description: timerType === 'pomodoro' 
        ? "Great job! Take a break now." 
        : "Break time is over. Ready to focus?"
    });

    // Update completed pomodoros count and determine next timer
    if (timerType === 'pomodoro') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);

      // After completing set number of pomodoros, take a long break
      if (newCount % DEFAULT_SETTINGS.pomodorosUntilLongBreak === 0) {
        setTimerType('longBreak');
        setTimer(DEFAULT_SETTINGS.longBreak);
        setInitialTime(DEFAULT_SETTINGS.longBreak);
      } else {
        setTimerType('shortBreak');
        setTimer(DEFAULT_SETTINGS.shortBreak);
        setInitialTime(DEFAULT_SETTINGS.shortBreak);
      }
    } else {
      // After break, start another pomodoro
      setTimerType('pomodoro');
      setTimer(DEFAULT_SETTINGS.pomodoro);
      setInitialTime(DEFAULT_SETTINGS.pomodoro);
    }
    setIsRunning(false);
  };

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTime => {
          if (prevTime <= 1) {
            clearInterval(interval!);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timer]);

  // Handle timer type change
  const handleTimerTypeChange = (type: TimerType) => {
    setIsRunning(false);
    setTimerType(type);

    // Set the appropriate time based on the selected timer type
    switch (type) {
      case 'pomodoro':
        setTimer(DEFAULT_SETTINGS.pomodoro);
        setInitialTime(DEFAULT_SETTINGS.pomodoro);
        break;
      case 'shortBreak':
        setTimer(DEFAULT_SETTINGS.shortBreak);
        setInitialTime(DEFAULT_SETTINGS.shortBreak);
        break;
      case 'longBreak':
        setTimer(DEFAULT_SETTINGS.longBreak);
        setInitialTime(DEFAULT_SETTINGS.longBreak);
        break;
    }
  };

  // Toggle timer running state
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset the current timer
  const resetTimer = () => {
    setIsRunning(false);
    switch (timerType) {
      case 'pomodoro':
        setTimer(DEFAULT_SETTINGS.pomodoro);
        setInitialTime(DEFAULT_SETTINGS.pomodoro);
        break;
      case 'shortBreak':
        setTimer(DEFAULT_SETTINGS.shortBreak);
        setInitialTime(DEFAULT_SETTINGS.shortBreak);
        break;
      case 'longBreak':
        setTimer(DEFAULT_SETTINGS.longBreak);
        setInitialTime(DEFAULT_SETTINGS.longBreak);
        break;
    }
  };

  // Toggle sound mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    return Math.round((1 - timer / initialTime) * 100);
  };

  // Get background and icon based on timer type
  const getTimerTypeStyles = () => {
    switch(timerType) {
      case 'pomodoro':
        return {
          bgColor: 'bg-[#FF5C00]',
          iconColor: 'text-[#FF5C00]',
          borderColor: 'border-[#FF5C00]'
        };
      case 'shortBreak':
        return {
          bgColor: 'bg-[#00C6C2]',
          iconColor: 'text-[#00C6C2]',
          borderColor: 'border-[#00C6C2]'
        };
      case 'longBreak':
        return {
          bgColor: 'bg-[#8B5CF6]',
          iconColor: 'text-[#8B5CF6]',
          borderColor: 'border-[#8B5CF6]'
        };
    }
  };

  const { bgColor, iconColor, borderColor } = getTimerTypeStyles();
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-[#fff6e5] flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 relative inline-block">
              Pomodoro Timer
              <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#FFC225] -z-10 transform -rotate-1"></div>
            </h1>
            <p className="text-gray-700 mt-3">Stay focused and productive with timed work sessions</p>
          </div>
          
          {/* Timer Type Tabs */}
          <Tabs 
            defaultValue="pomodoro" 
            value={timerType}
            onValueChange={(value) => handleTimerTypeChange(value as TimerType)}
            className="mb-8"
          >
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto neo-border overflow-hidden p-1 bg-white shadow-neo">
              <TabsTrigger 
                value="pomodoro"
                className="data-[state=active]:bg-[#FF5C00] data-[state=active]:text-white"
              >
                Pomodoro
              </TabsTrigger>
              <TabsTrigger 
                value="shortBreak"
                className="data-[state=active]:bg-[#00C6C2] data-[state=active]:text-white"
              >
                Short Break
              </TabsTrigger>
              <TabsTrigger 
                value="longBreak"
                className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white"
              >
                Long Break
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Redesigned Timer Card - Neo-brutalist styling */}
          <Card className="mb-8 neo-box overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-md ${bgColor} shadow-neo-sm neo-border`}>
                    {timerType === 'pomodoro' ? 
                      <Timer className="w-5 h-5 text-white" /> : 
                      timerType === 'shortBreak' ? 
                      <Coffee className="w-5 h-5 text-white" /> : 
                      <Clock className="w-5 h-5 text-white" />
                    }
                  </div>
                  <span className="font-bold text-lg capitalize text-[#1a1a1a]">
                    {timerType === 'pomodoro' ? 'Focus Time' : timerType === 'shortBreak' ? 'Short Break' : 'Long Break'}
                  </span>
                </div>
                <button 
                  onClick={toggleMute} 
                  className={`p-2 rounded-md ${bgColor} hover:opacity-90 transition-opacity shadow-neo-sm neo-border`}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                </button>
              </div>
              
              {/* Neo-brutalist Timer Display */}
              <div className="relative mx-auto w-full max-w-md mb-8">
                {/* Progress Bar */}
                <Progress
                  value={progress}
                  className="h-6 mb-4 bg-white neo-border"
                  indicatorClassName={bgColor}
                />
                
                {/* Timer Display */}
                <div className="flex flex-col items-center justify-center">
                  <div className="font-mono text-6xl font-bold mb-4 text-[#1a1a1a] neo-border px-8 py-6 rounded-lg bg-white shadow-neo">
                    {formatTime(timer)}
                  </div>
                  <span className="text-sm text-gray-700 font-medium px-4 py-2 bg-white rounded-full neo-border">
                    {isRunning ? 'Time remaining' : timer === initialTime ? 'Ready to start' : 'Paused'}
                  </span>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={toggleTimer}
                  className={`w-16 h-16 rounded-lg ${bgColor} text-white shadow-neo neo-border`}
                  size="icon"
                >
                  {isRunning ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
                <Button
                  onClick={resetTimer}
                  className="w-16 h-16 rounded-lg bg-white text-[#1a1a1a] shadow-neo neo-border"
                  variant="outline"
                  size="icon"
                >
                  <RefreshCcw className="w-7 h-7" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Pomodoro Progress */}
          <Card className="mb-8 neo-box overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center bg-[#FFC225] rounded-md neo-border shadow-neo-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1a1a1a]" />
                  </div>
                  Today's Progress
                </h3>
                <div className="bg-white rounded-md py-1 px-3 text-sm font-medium neo-border shadow-neo-sm">
                  {completedPomodoros} completed
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {Array.from({ length: DEFAULT_SETTINGS.pomodorosUntilLongBreak }).map((_, i) => {
                  const isCompleted = i < completedPomodoros % DEFAULT_SETTINGS.pomodorosUntilLongBreak;
                  return (
                    <div 
                      key={i} 
                      className={`h-10 rounded-md flex items-center justify-center neo-border shadow-neo-sm transition-all ${
                        isCompleted ? 'bg-[#FF5C00] text-white translate-y-[-2px] translate-x-[-2px] shadow-neo' : 'bg-white'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-5 h-5" />}
                    </div>
                  );
                })}
              </div>
              
              <div className="text-sm text-gray-600 bg-[#FFF9EB] p-2 rounded-md neo-border inline-block">
                <p className="font-medium">Cycle: {Math.ceil(completedPomodoros / DEFAULT_SETTINGS.pomodorosUntilLongBreak) || 1}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Technique Explanation */}
          <Card className="overflow-hidden bg-white neo-box">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <InfoIcon className="w-5 h-5 text-[#FF5C00]" />
                <h3 className="text-xl font-bold">What is the Pomodoro Technique?</h3>
              </div>
              
              <p className="mb-4 text-gray-700">
                The Pomodoro Technique is a time management method developed by Francesco Cirillo
                in the late 1980s. It uses a timer to break work into intervals, traditionally 
                25 minutes in length, separated by short breaks.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-[#FFF9EB] rounded-md neo-border shadow-neo-sm">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center bg-[#FF5C00] rounded-md text-white text-xs font-bold">1</div>
                    How to use it:
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                    <li>Choose a task to work on</li>
                    <li>Start the Pomodoro (25 minutes)</li>
                    <li>Work until the timer rings</li>
                    <li>Take a short break (5 minutes)</li>
                    <li>After 4 pomodoros, take a longer break (15-30 minutes)</li>
                  </ol>
                </div>
                
                <div className="p-4 bg-[#FFF9EB] rounded-md neo-border shadow-neo-sm">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center bg-[#00C6C2] rounded-md text-white text-xs font-bold">2</div>
                    Benefits:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Improved focus and concentration</li>
                    <li>Reduced mental fatigue</li>
                    <li>Increased productivity</li>
                    <li>Better work/break balance</li>
                    <li>Enhanced time awareness</li>
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

export default Pomodoro;
