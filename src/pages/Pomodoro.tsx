import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Timer, Pause, Play, RefreshCcw, Volume2, VolumeX, CheckCircle2, Clock, Coffee, InfoIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";

// Import notification sound
const NOTIFICATION_SOUND_URL = '/notification.mp3';

// Flag to track if audio playback was initiated by user interaction
let userInteractionOccurred = false;

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isTimerCompleted, setIsTimerCompleted] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [nextTimerType, setNextTimerType] = useState<TimerType | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Create audio element on component mount and set up user interaction tracking
  useEffect(() => {
    // Capture the audio reference when the effect runs
    const currentAudioRef = audioRef.current;
    
    // Enable user interaction tracking for audio
    const handleUserInteraction = () => {
      userInteractionOccurred = true;
      // Remove listeners once we've captured user interaction
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      console.log("User interaction recorded for audio playback permission");
    };

    // Add event listeners to track user interaction
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    
    // Initialize audio element with event listeners
    if (currentAudioRef) {
      // Track audio element loading
      currentAudioRef.oncanplaythrough = () => {
        console.log("Audio file loaded and can be played");
      };
      
      currentAudioRef.onerror = (e) => {
        console.error("Audio element error:", e);
      };
    }

    return () => {
      // Clean up event listeners
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      
      // Clean up audio element using the captured reference
      if (currentAudioRef) {
        currentAudioRef.pause();
        currentAudioRef.oncanplaythrough = null;
        currentAudioRef.onerror = null;
      }
    };
  }, []);

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Play notification sound continuously
  const playSound = useCallback(() => {
    if (isMuted) return;

    if (audioRef.current) {
      // Configure audio to loop
      audioRef.current.loop = true;
      audioRef.current.currentTime = 0;
      
      // Create visual feedback state regardless of whether sound plays
      setIsPlayingSound(true);
      
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("Notification sound started playing");
        }).catch(error => {
          console.log("Audio playback failed:", error);
          
          // If autoplay is blocked, we still want the visual indicator
          // to show the timer has completed
          toast({
            title: "Sound notification blocked",
            description: "Click anywhere to enable sound notifications",
            duration: 3000
          });
        });
      }
    }
  }, [isMuted, toast]);

  // Stop playing sound
  const stopSound = useCallback(() => {
    if (!isPlayingSound) return;
    
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.loop = false;
      } catch (error) {
        console.error("Failed to stop sound:", error);
      }
    }
    
    setIsPlayingSound(false);
  }, [isPlayingSound]);

  // Start the next timer automatically
  const startNextTimer = useCallback((nextType: TimerType, nextDuration: number) => {
    setTimerType(nextType);
    setTimer(nextDuration);
    setInitialTime(nextDuration);
    setIsRunning(true); // Automatically start the next timer
  }, []);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    // Play sound that will continue until user takes action
    playSound();

    // Set states for showing the completion dialog
    setIsTimerCompleted(true);

    // Determine next timer type
    let nextType: TimerType;
    let nextTimeDuration: number;

    if (timerType === 'pomodoro') {
      const newCount = completedPomodoros + 1;

      // After completing set number of pomodoros, take a long break
      if (newCount % DEFAULT_SETTINGS.pomodorosUntilLongBreak === 0) {
        nextType = 'longBreak';
        nextTimeDuration = DEFAULT_SETTINGS.longBreak;
      } else {
        nextType = 'shortBreak';
        nextTimeDuration = DEFAULT_SETTINGS.shortBreak;
      }

      // Store the next timer information (but don't start it yet)
      setNextTimerType(nextType);

      // Update completed pomodoros count
      setCompletedPomodoros(newCount);
    } else {
      // After break, next timer is always a pomodoro
      setNextTimerType('pomodoro');
    }

    // Stop the current timer
    setIsRunning(false);
  }, [completedPomodoros, timerType, playSound]);

  // Handle starting the next timer phase
  const handleStartNextPhase = useCallback(() => {
    // Stop the alarm sound
    stopSound();

    // Close the completion dialog
    setIsTimerCompleted(false);

    // Set timer type to the next type
    if (nextTimerType) {
      const nextType = nextTimerType;
      setTimerType(nextType);

      // Set the appropriate time for the next phase
      let nextDuration: number;
      switch (nextType) {
        case 'pomodoro':
          nextDuration = DEFAULT_SETTINGS.pomodoro;
          break;
        case 'shortBreak':
          nextDuration = DEFAULT_SETTINGS.shortBreak;
          break;
        case 'longBreak':
          nextDuration = DEFAULT_SETTINGS.longBreak;
          break;
      }

      // Set the timer and begin
      setTimer(nextDuration);
      setInitialTime(nextDuration);
      setIsRunning(true);

      // Reset the next timer type
      setNextTimerType(null);
    }
  }, [nextTimerType, stopSound]);

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
  }, [isRunning, timer, handleTimerComplete]);

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
    // No sound should be played when starting the timer
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

    // Play a test sound when unmuting to confirm sound is working
    if (isMuted && audioRef.current) {
      audioRef.current.volume = 0.3; // Lower volume for test sound
      audioRef.current.play().then(() => {
        console.log("Test sound played.");
      }).catch(e => console.log('Test sound failed:', e));
      audioRef.current.volume = 1.0; // Reset to normal volume
    }
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

  // Show timer in browser tab title only when timer is running
  useEffect(() => {
    let label = '';
    switch (timerType) {
      case 'pomodoro':
        label = 'Focus';
        break;
      case 'shortBreak':
        label = 'Short Break';
        break;
      case 'longBreak':
        label = 'Long Break';
        break;
    }
    
    if (isTimerCompleted) {
      document.title = `${label} done! | Pomodoro Timer`;
    } else if (isRunning) {
      // Only show the timer in the tab title when it's actually running
      document.title = `${formatTime(timer)} (${label}) | Pomodoro Timer`;
    } else {
      // When timer is paused or not started, just show the default title
      document.title = 'Pomodoro Timer';
    }
    
    return () => {
      document.title = 'Pomodoro Timer';
    };
  }, [timer, timerType, isTimerCompleted, isRunning]);

  return (
    <div className="min-h-screen bg-[#fff6e5] flex flex-col">
      <Navbar />

      {/* Hidden audio element for notification sound */}
      <audio 
        ref={audioRef} 
        src={NOTIFICATION_SOUND_URL} 
        preload="auto" 
        className="hidden"
      />
      
      {/* Timer Completion Dialog */}
      <Dialog open={isTimerCompleted} onOpenChange={(open) => {
        if (!open) {
          stopSound();
          setIsTimerCompleted(false);
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-center font-bold">
              {timerType === 'pomodoro' 
                ? "Pomodoro Completed!" 
                : timerType === 'shortBreak' 
                  ? "Short Break Ended!" 
                  : "Long Break Ended!"}
            </DialogTitle>
            <DialogDescription className="text-center pt-2 text-base">
              {nextTimerType === 'pomodoro' 
                ? "It's time to focus again." 
                : nextTimerType === 'shortBreak' 
                  ? "Take a short 5-minute break." 
                  : "Take a longer break to recharge."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center gap-2 my-4">
            {/* Sound playing animation indicator */}
            {isPlayingSound && (
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="w-1 h-3 bg-red-500 animate-pulse"></div>
                <div className="w-1 h-5 bg-red-500 animate-pulse delay-75"></div>
                <div className="w-1 h-3 bg-red-500 animate-pulse delay-150"></div>
                <div className="w-1 h-6 bg-red-500 animate-pulse delay-300"></div>
                <div className="w-1 h-4 bg-red-500 animate-pulse delay-200"></div>
              </div>
            )}
            
            {nextTimerType === 'pomodoro' ? (
              <div className="w-16 h-16 rounded-full bg-[#FF5C00] flex items-center justify-center">
                <Timer className="w-8 h-8 text-white" />
              </div>
            ) : nextTimerType === 'shortBreak' ? (
              <div className="w-16 h-16 rounded-full bg-[#00C6C2] flex items-center justify-center">
                <Coffee className="w-8 h-8 text-white" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={handleStartNextPhase}
              className={`w-full py-6 text-lg ${
                nextTimerType === 'pomodoro'
                  ? 'bg-[#FF5C00] hover:bg-[#E05000]'
                  : nextTimerType === 'shortBreak'
                  ? 'bg-[#00C6C2] hover:bg-[#00B0AC]'
                  : 'bg-[#8B5CF6] hover:bg-[#7C4DEF]'
              }`}
            >
              {nextTimerType === 'pomodoro' 
                ? "Start Pomodoro" 
                : nextTimerType === 'shortBreak' 
                  ? "Start Short Break" 
                  : "Start Long Break"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
