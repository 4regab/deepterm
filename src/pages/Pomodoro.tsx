import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TodoList from "@/components/TodoList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BACKGROUND_SOUNDS,
  TimerType,
  formatDuration, 
  getFormattedDate 
} from "@/context/pomodoroUtils";
import { usePomodoroContext } from "@/hooks/usePomodoroContext";
import { CheckCircle2, Clock, Coffee, Flame, InfoIcon, Pause, Play, RefreshCcw, Settings, Timer, ChevronRight, Music } from "lucide-react";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


const Pomodoro = () => {
  // Use global Pomodoro context
  const {
    timer,
    timerType,
    isRunning,
    completedPomodoros,
    initialTime,
    isTimerCompleted,
    isPlayingSound,
    formatTime,
    toggleTimer,
    resetTimer,
    handleTimerTypeChange,
    handleStartNextPhase,
    nextTimerType,
    setIsTimerCompleted,
    audioRef,
    userSettings,
    updateUserSettings,
    isSettingsDialogOpen,
    setIsSettingsDialogOpen,
    setTimer,
    setInitialTime,
    // Streak related
    studyStreak,
    studySessions,
    isStreakDialogOpen,
    setIsStreakDialogOpen,
    totalStudyTimeToday,
    // Background Sound
    selectedSoundId,
    selectBackgroundSound
  } = usePomodoroContext();

  // Local state for settings form
  const [settingsForm, setSettingsForm] = useState({
    pomodoro: Math.floor(userSettings.pomodoro / 60),
    shortBreak: Math.floor(userSettings.shortBreak / 60),
    longBreak: Math.floor(userSettings.longBreak / 60),
    pomodorosUntilLongBreak: userSettings.pomodorosUntilLongBreak
  });

  // Local state for todo list visibility
  const [isTodoListVisible, setIsTodoListVisible] = useState(() => {
    const savedState = localStorage.getItem('pomodoro-todos-minimized');
    return savedState ? !JSON.parse(savedState) : true;
  });

  const [isExpanded, setIsExpanded] = useState(true);

  // Effect to save todo list visibility state to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-todos-minimized', JSON.stringify(!isTodoListVisible));
  }, [isTodoListVisible]);

  // Reset settings form when dialog opens
  useEffect(() => {
    if (isSettingsDialogOpen) {
      setSettingsForm({
        pomodoro: Math.floor(userSettings.pomodoro / 60),
        shortBreak: Math.floor(userSettings.shortBreak / 60),
        longBreak: Math.floor(userSettings.longBreak / 60),
        pomodorosUntilLongBreak: userSettings.pomodorosUntilLongBreak
      });
    }
  }, [isSettingsDialogOpen, userSettings.pomodoro, userSettings.shortBreak, userSettings.longBreak, userSettings.pomodorosUntilLongBreak]);
  // Handle settings form submission
  const handleSaveSettings = () => {
    // Validate inputs - ensure values are numbers and within range
    const pomodoro = Math.max(1, Math.min(999, Number(settingsForm.pomodoro) || 1));
    const shortBreak = Math.max(1, Math.min(999, Number(settingsForm.shortBreak) || 1));
    const longBreak = Math.max(1, Math.min(999, Number(settingsForm.longBreak) || 1));
    const pomodorosUntilLongBreak = Math.max(1, Math.min(99, Number(settingsForm.pomodorosUntilLongBreak) || 1));

    // Convert minutes to seconds
    const newSettings = {
      pomodoro: pomodoro * 60,
      shortBreak: shortBreak * 60,
      longBreak: longBreak * 60,
      pomodorosUntilLongBreak
    };

    // Update context with new settings
    updateUserSettings(newSettings);

    // Immediately update the current timer if it's not running
    if (!isRunning) {
      // Apply appropriate time based on current timer type
      switch (timerType) {
        case 'pomodoro':
          setTimer(newSettings.pomodoro);
          setInitialTime(newSettings.pomodoro);
          break;
        case 'shortBreak':
          setTimer(newSettings.shortBreak);
          setInitialTime(newSettings.shortBreak);
          break;
        case 'longBreak':
          setTimer(newSettings.longBreak);
          setInitialTime(newSettings.longBreak);
          break;
      }
    } else {
      // If timer is running, just update the initialTime for progress calculation
      switch (timerType) {
        case 'pomodoro':
          setInitialTime(newSettings.pomodoro);
          break;
        case 'shortBreak':
          setInitialTime(newSettings.shortBreak);
          break;
        case 'longBreak':
          setInitialTime(newSettings.longBreak);
          break;
      }
    }

    // Close the dialog
    setIsSettingsDialogOpen(false);
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    return Math.round((1 - timer / initialTime) * 100);
  };

  // Get background based on timer type
  const getTimerTypeStyles = () => {
    switch (timerType) {
      case 'pomodoro':
        return {
          bgColor: 'bg-[#FF5C00]'
        };
      case 'shortBreak':
        return {
          bgColor: 'bg-[#00C6C2]'
        };
      case 'longBreak':
        return {
          bgColor: 'bg-[#8B5CF6]'
        };
    }
  };

  // Get study sessions grouped by date
  const getStudySessionsByDate = () => {
    // Group sessions by date
    const sessionsByDate = studySessions.reduce<{[date: string]: number}>((acc, session) => {
      // Get date in YYYY-MM-DD format for grouping
      const date = new Date(session.date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      // Sum durations for the same date
      if (!acc[dateKey]) {
        acc[dateKey] = 0;
      }
      acc[dateKey] += session.duration;
      
      return acc;
    }, {});

    // Convert to array and sort by date (newest first)
    return Object.entries(sessionsByDate)
      .map(([date, duration]) => ({ 
        date, 
        duration,
        displayDate: getFormattedDate(date)
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const { bgColor } = getTimerTypeStyles();
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
  }, [timer, timerType, isTimerCompleted, isRunning, formatTime]);

  // Function to display the appropriate timer value for the current timer type
  const getDisplayTime = () => {
    if (!isRunning) {
      // When not running, show the actual timer value
      return timer;
    }

    // Calculate elapsed time from the current timer
    const elapsedSeconds = initialTime - timer;

    // When running, determine which timer to display based on the selected tab
    switch (timerType) {
      case 'pomodoro':
        // Show proper time for pomodoro tab
        return Math.max(0, userSettings.pomodoro - elapsedSeconds);
      case 'shortBreak':
        // Show proper time for short break tab
        return Math.max(0, userSettings.shortBreak - elapsedSeconds);
      case 'longBreak':
        // Show proper time for long break tab
        return Math.max(0, userSettings.longBreak - elapsedSeconds);
      default:
        return timer;
    }
  };

  return (
    <div className="min-h-screen bg-[#fff6e5] flex flex-col">
      <Navbar />

      {/* Hidden audio element for notification sound */}
      <audio
        ref={audioRef}
        src="/notification.mp3"
        preload="auto"
        className="hidden"
      />

      {/* Study Streak History Dialog */}
      <Dialog open={isStreakDialogOpen} onOpenChange={setIsStreakDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-xl bg-white max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Study History</DialogTitle>
            <DialogDescription>
              Your completed Pomodoro sessions history
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4">
              {getStudySessionsByDate().length > 0 ? (
                getStudySessionsByDate().map((sessionGroup, index) => (
                  <div key={index} className="py-3 border-b last:border-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold">{sessionGroup.displayDate}</h3>
                      <span className="bg-[#FFF9EB] px-3 py-1 rounded-full text-sm font-medium neo-border">
                        {formatDuration(sessionGroup.duration)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>No study sessions recorded yet.</p>
                  <p className="mt-2">Complete your first Pomodoro to start tracking!</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button className="w-full sm:w-auto">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timer Completion Dialog */}
      <Dialog open={isTimerCompleted} onOpenChange={(open) => {
        if (!open) {
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
                  ? "Take a short break to refresh."
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
              className={`w-full py-6 text-lg ${nextTimerType === 'pomodoro'
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

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4 rounded-xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Timer Settings</DialogTitle>
            <DialogDescription>
              Enter time in minutes (up to 999)
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pomodoroMinutes">Focus Time</Label>
                <Input
                  id="pomodoroMinutes"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={settingsForm.pomodoro}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Math.min(999, parseInt(e.target.value) || 1);
                    setSettingsForm({ ...settingsForm, pomodoro: Number(value) || 1 });
                  }}
                  onBlur={(e) => {
                    const value = e.target.value === '' ? 1 : Math.min(999, parseInt(e.target.value) || 1);
                    setSettingsForm({ ...settingsForm, pomodoro: Number(value) });
                  }}
                  className="neo-border text-2xl h-14 text-center font-mono [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="25"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="shortBreakMinutes">Short Break</Label>
                <Input
                  id="shortBreakMinutes"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={settingsForm.shortBreak}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Math.min(999, parseInt(e.target.value) || 1);
                    setSettingsForm({ ...settingsForm, shortBreak: Number(value) || 1 });
                  }}
                  onBlur={(e) => {
                    const value = e.target.value === '' ? 1 : Math.min(999, parseInt(e.target.value) || 1);
                    setSettingsForm({ ...settingsForm, shortBreak: Number(value) });
                  }}
                  className="neo-border text-2xl h-14 text-center font-mono [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="5"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="longBreakMinutes">Long Break</Label>
                <Input
                  id="longBreakMinutes"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={settingsForm.longBreak}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Math.min(999, parseInt(e.target.value) || 1);
                    setSettingsForm({ ...settingsForm, longBreak: Number(value) || 1 });
                  }}
                  onBlur={(e) => {
                    const value = e.target.value === '' ? 1 : Math.min(999, parseInt(e.target.value) || 1);
                    setSettingsForm({ ...settingsForm, longBreak: Number(value) });
                  }}
                  className="neo-border text-2xl h-14 text-center font-mono [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="15"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="pomodorosUntilLongBreak">Sessions Until Break</Label>
                <Input
                  id="pomodorosUntilLongBreak"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={settingsForm.pomodorosUntilLongBreak}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Math.min(99, parseInt(e.target.value) || 1);
                    // Ensure value passed to state is a number or empty string for controlled input, but store as number
                    setSettingsForm({ ...settingsForm, pomodorosUntilLongBreak: Number(value) || 1 }); 
                  }}
                  onBlur={(e) => {
                    const value = e.target.value === '' ? 1 : Math.min(99, parseInt(e.target.value) || 1);
                    setSettingsForm({ ...settingsForm, pomodorosUntilLongBreak: Number(value) });
                  }}
                  className="neo-border text-2xl h-14 text-center font-mono [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="4"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSaveSettings} className="w-full sm:w-auto">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="text-center mb-8">
          <div className="inline-block -rotate-1 p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-3 border-black bg-[#FF5C00] mb-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              POMODORO TIMER
            </h1>
          </div>
          <div className="block sm:inline-block mt-2 sm:mt-0">
            <p className="text-[#1A1A1A] text-base sm:text-lg font-bold px-3 py-2 bg-[#FFC225] inline-block border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              Stay focused and productive with timed work sessions and task management
            </p>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-6 max-w-6xl mx-auto`}>
          <div className="max-w-2xl mx-auto">

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

            {/* Redesigned Timer Card */}
            <Card className="mb-8 neo-box overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6">
                {/* Card Header: Title, Streak, Controls */}
                <div className="flex flex-wrap justify-between items-center gap-y-3 mb-4 sm:mb-6">
                  {/* Left Side: Title & Streak */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h2 className="text-lg font-semibold order-1 sm:order-none">
                      {timerType === 'pomodoro' ? 'Focus Time' : timerType === 'shortBreak' ? 'Short Break' : 'Long Break'}
                    </h2>
                    {/* MOVED Streak Display Back Here */}
                    <button 
                      onClick={() => setIsStreakDialogOpen(true)}
                      className="flex items-center gap-2 hover:bg-accent p-1.5 rounded-md transition-colors order-2 sm:order-none -ml-1.5 sm:ml-0"
                      title="View study history"
                    >
                      <div className={`p-1.5 rounded-md bg-[#FFA726] shadow-neo-xs neo-border flex-shrink-0`}>
                        <Flame 
                          className={`w-4 h-4 ${
                            studyStreak === 0 
                              ? 'text-gray-300/70' // Dimmed when no streak
                              : studyStreak === 1 
                                ? 'text-white/50' // 50% opacity for 1 day
                                : studyStreak === 2 
                                  ? 'text-white/75' // 75% opacity for 2 days
                                  : 'text-white' // Full opacity for 3+ days
                          }`} 
                        />
                      </div>
                      <div className="text-left leading-tight">
                        <h3 className="font-bold text-sm">
                          {studyStreak > 0 ? `${studyStreak} day streak` : 'No streak'}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {totalStudyTimeToday > 0 
                            ? `Today: ${formatDuration(totalStudyTimeToday)}` 
                            : 'No focus today'}
                        </p>
                      </div>
                      {/* Subtle history indicator */}
                      <ChevronRight className="w-3 h-3 text-gray-400 ml-1 flex-shrink-0" />
                    </button>
                  </div>

                  {/* Right Side: Controls */}
                  <div className="flex items-center space-x-1 sm:space-x-2 order-3 sm:order-none ml-auto sm:ml-0 pl-2 sm:pl-0">
                    {/* Background Sound Selector Button */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9">
                          <Music className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="sr-only">Select Background Sound</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {BACKGROUND_SOUNDS.map((sound) => (
                          <DropdownMenuItem 
                            key={sound.id} 
                            onSelect={() => selectBackgroundSound(sound.id)}
                            className={selectedSoundId === sound.id ? "bg-accent" : ""}
                          >
                            {sound.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {/* Settings Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSettingsDialogOpen(true)}
                      className="text-gray-600 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9" // Slightly smaller icons
                    >
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="sr-only">Customize Timer Settings</span>
                    </Button>
                  </div>
                </div>

                {/* Timer Display */}
                <div className="relative mx-auto w-full max-w-md mb-6 sm:mb-8">
                  {/* Progress Bar */}
                  <Progress
                    value={progress}
                    className="h-5 sm:h-6 mb-4 bg-gray-100 neo-border" // Adjusted background
                    indicatorClassName={bgColor}
                  />

                  {/* Timer Display Text */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="font-mono text-5xl sm:text-6xl font-bold mb-3 sm:mb-4 text-[#1a1a1a] neo-border px-4 sm:px-8 py-3 sm:py-5 rounded-lg bg-white shadow-neo">
                      {formatTime(getDisplayTime())}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium px-3 py-1.5 bg-white rounded-full neo-border">
                      {isRunning ? 'Time remaining' : timer === initialTime ? 'Ready to start' : 'Paused'}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4 mb-6">
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

                {/* Todo List Component - Now inside timer card */}
                <div className="border-t border-gray-200 pt-6">
                  <TodoList onVisibilityChange={setIsTodoListVisible} />
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
                  {Array.from({ length: userSettings.pomodorosUntilLongBreak }).map((_, i) => {
                    const isCompleted = i < completedPomodoros % userSettings.pomodorosUntilLongBreak;
                    return (
                      <div
                        key={i}
                        className={`h-10 rounded-md flex items-center justify-center neo-border shadow-neo-sm transition-all ${isCompleted ? 'bg-[#FF5C00] text-white translate-y-[-2px] translate-x-[-2px] shadow-neo' : 'bg-white'
                          }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-5 h-5" />}
                      </div>
                    );
                  })}
                </div>

                <div className="text-sm text-gray-600 bg-[#FFF9EB] p-2 rounded-md neo-border inline-block">
                  <p className="font-medium">Cycle: {Math.ceil(completedPomodoros / userSettings.pomodorosUntilLongBreak) || 1}</p>
                </div>
              </CardContent>
            </Card>

            {/* Technique Explanation - Now Collapsible */}
            <Card className="overflow-hidden bg-white neo-box">
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger 
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <InfoIcon className="w-5 h-5 text-[#FF5C00]" />
                    <h3 className="text-xl font-bold">What is the Pomodoro Technique?</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </CollapsibleTrigger>
              
                <CollapsibleContent>
                  <div className="p-6">
                    <p className="mb-4 text-gray-700">
                      The Pomodoro Technique is a time management method developed by Francesco Cirillo
                      in the late 1980s. It uses a timer to break work into intervals, traditionally
                      25 minutes in length, separated by short breaks. Combined with our task management tool,
                      you can track what you're working on during each session.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-[#FFF9EB] rounded-md neo-border shadow-neo-sm">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <div className="w-5 h-5 flex items-center justify-center bg-[#FF5C00] rounded-md text-white text-xs font-bold">1</div>
                          How to use it:
                        </h4>
                        <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                          <li>Choose a task to work on</li>
                          <li>Start the Pomodoro (customizable)</li>
                          <li>Work until the timer rings</li>
                          <li>Take a short break (customizable)</li>
                          <li>After {userSettings.pomodorosUntilLongBreak} pomodoros, take a longer break (customizable)</li>
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
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pomodoro;
