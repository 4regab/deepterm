import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TodoList from "@/components/TodoList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimerType, usePomodoroContext } from "@/context/PomodoroContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { CheckCircle2, Clock, Coffee, InfoIcon, Pause, Play, RefreshCcw, Settings, Timer, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

const Pomodoro = () => {
  // Use global Pomodoro context
  const {
    timer,
    timerType,
    isRunning,
    completedPomodoros,
    isMuted,
    initialTime,
    isTimerCompleted,
    isPlayingSound,
    formatTime,
    toggleTimer,
    resetTimer,
    handleTimerTypeChange,
    handleStartNextPhase,
    toggleMute,
    nextTimerType,
    DEFAULT_SETTINGS,
    NOTIFICATION_SOUND_URL,
    setIsTimerCompleted,
    audioRef,
    stopSound,
    userSettings,
    updateUserSettings,
    isSettingsDialogOpen,
    setIsSettingsDialogOpen,
    setTimer,
    setInitialTime
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

  const isMobile = useIsMobile();

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
  }, [isSettingsDialogOpen, userSettings]);

  // Toggle todo list visibility
  const toggleTodoListVisibility = () => {
    setIsTodoListVisible(prev => !prev);
  };

  // Handle settings form submission
  const handleSaveSettings = () => {
    // Validate inputs
    const pomodoro = Math.max(1, Math.min(120, settingsForm.pomodoro));
    const shortBreak = Math.max(1, Math.min(30, settingsForm.shortBreak));
    const longBreak = Math.max(1, Math.min(60, settingsForm.longBreak));
    const pomodorosUntilLongBreak = Math.max(1, Math.min(10, settingsForm.pomodorosUntilLongBreak));

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

  // Get background and icon based on timer type
  const getTimerTypeStyles = () => {
    switch (timerType) {
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
        src={NOTIFICATION_SOUND_URL}
        preload="auto"
        className="hidden"
      />

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
              Customize your Pomodoro cycle durations
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pomodoroMinutes">Pomodoro (minutes)</Label>
                <Input
                  id="pomodoroMinutes"
                  type="number"
                  min="1"
                  max="120"
                  value={settingsForm.pomodoro}
                  onChange={(e) => setSettingsForm({ ...settingsForm, pomodoro: parseInt(e.target.value) || 1 })}
                  className="neo-border"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="shortBreakMinutes">Short Break (minutes)</Label>
                <Input
                  id="shortBreakMinutes"
                  type="number"
                  min="1"
                  max="30"
                  value={settingsForm.shortBreak}
                  onChange={(e) => setSettingsForm({ ...settingsForm, shortBreak: parseInt(e.target.value) || 1 })}
                  className="neo-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="longBreakMinutes">Long Break (minutes)</Label>
                <Input
                  id="longBreakMinutes"
                  type="number"
                  min="1"
                  max="60"
                  value={settingsForm.longBreak}
                  onChange={(e) => setSettingsForm({ ...settingsForm, longBreak: parseInt(e.target.value) || 1 })}
                  className="neo-border"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pomodorosUntilLongBreak">Pomodoros until Long Break</Label>
                <Input
                  id="pomodorosUntilLongBreak"
                  type="number"
                  min="1"
                  max="10"
                  value={settingsForm.pomodorosUntilLongBreak}
                  onChange={(e) => setSettingsForm({ ...settingsForm, pomodorosUntilLongBreak: parseInt(e.target.value) || 1 })}
                  className="neo-border"
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
          <h1 className="text-4xl font-bold mb-2 relative inline-block">
            Pomodoro Timer
            <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#FFC225] -z-10 transform -rotate-1"></div>
          </h1>
          <p className="text-gray-700 mt-3">Stay focused and productive with timed work sessions and task management</p>
        </div>

        <div className={`grid grid-cols-1 ${isTodoListVisible ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6 max-w-6xl mx-auto`}>
          <div className={isTodoListVisible ? 'lg:col-span-2' : 'lg:col-span-1'}>
            <div className={`${isTodoListVisible ? 'max-w-2xl mx-auto lg:max-w-none' : 'max-w-2xl mx-auto'}`}>

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
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsSettingsDialogOpen(true)}
                        className="px-3 py-2 flex items-center gap-1 rounded-md bg-white hover:bg-gray-100 transition-colors shadow-neo-sm neo-border"
                        aria-label="Customize timer settings"
                      >
                        <Settings className="w-4 h-4 text-[#1a1a1a]" />
                        <span className="text-sm hidden sm:inline">Customize</span>
                      </button>
                      <button
                        onClick={toggleMute}
                        className={`p-2 rounded-md ${bgColor} hover:opacity-90 transition-opacity shadow-neo-sm neo-border`}
                        aria-label={isMuted ? "Unmute notification sound" : "Mute notification sound"}
                      >
                        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                      </button>
                    </div>
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
                      <div className="font-mono text-5xl sm:text-6xl font-bold mb-4 text-[#1a1a1a] neo-border px-4 sm:px-8 py-4 sm:py-6 rounded-lg bg-white shadow-neo">
                        {formatTime(getDisplayTime())}
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
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Todo List Component - Right side on desktop, below on mobile */}
          <div className={`flex flex-col ${!isTodoListVisible ? 'lg:absolute lg:right-4 lg:top-24' : ''}`}>
            <div className="flex-grow">
              <TodoList onVisibilityChange={setIsTodoListVisible} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pomodoro;
