"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Confetti, EncouragementToast } from "@/components/EmotionalAssets";
import { motion, AnimatePresence } from "framer-motion";
import { usePomodoroStore } from "@/lib/stores";
import type { TimerPhase } from "@/lib/schemas/pomodoro";
import {
  BACKGROUND_SOUNDS,
  STORAGE_KEYS,
  DEFAULT_NOTIFICATION_VOLUME,
  DEFAULT_BACKGROUND_VOLUME,
  DEFAULT_BACKGROUND_SOUND,
  type BackgroundSoundId,
} from "@/lib/sounds";
import { Timer, Play, X, Bell, Check } from "lucide-react";

const POMODORO_BG_KEY = "pomodoro_custom_bg";

const PHASE_LABELS: Record<TimerPhase, string> = {
  work: "Focus Time",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

// Helper to safely access localStorage
const getStoredValue = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultValue;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
};

// Fullscreen-compatible notifications component
function FullscreenNotifications() {
  const {
    pendingPhasePrompt,
    pendingNextPhase,
    phase: currentPhase,
    startNextPhase,
    dismissPhasePrompt,
    pendingTaskReminder,
    dismissTaskReminder,
  } = usePomodoroStore();

  return (
    <>
      {/* Pomodoro Phase Prompt */}
      <AnimatePresence>
        {pendingPhasePrompt && pendingNextPhase && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md"
          >
            <div className="rounded-2xl shadow-2xl overflow-hidden bg-primary text-white">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10">
                    <Timer size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans font-medium text-base mb-1">
                      {PHASE_LABELS[currentPhase]} Complete!
                    </h3>
                    <p className="text-white/70 text-sm">
                      Ready to start {PHASE_LABELS[pendingNextPhase].toLowerCase()}?
                    </p>
                  </div>
                  <button
                    onClick={dismissPhasePrompt}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Dismiss"
                  >
                    <X size={18} className="text-white/60" />
                  </button>
                </div>
              </div>
              <div className="flex border-t border-white/10">
                <button
                  onClick={dismissPhasePrompt}
                  className="flex-1 py-3 text-sm font-medium text-white/70 hover:bg-white/5 transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={startNextPhase}
                  className="flex-1 py-3 text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={14} />
                  Start {PHASE_LABELS[pendingNextPhase]}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Reminder */}
      <AnimatePresence>
        {pendingTaskReminder && !pendingPhasePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md"
          >
            <div className="rounded-2xl shadow-2xl overflow-hidden bg-primary text-white">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10">
                    <Bell size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans font-medium text-base mb-1 text-white">
                      Task Reminder
                    </h3>
                    <p className="text-sm text-white/70">
                      {pendingTaskReminder.taskText}
                    </p>
                  </div>
                  <button
                    onClick={dismissTaskReminder}
                    className="p-1.5 rounded-lg transition-colors flex-shrink-0 hover:bg-white/10"
                    aria-label="Dismiss"
                  >
                    <X size={18} className="text-white/60" />
                  </button>
                </div>
              </div>
              <div className="flex border-t border-white/10">
                <button
                  onClick={dismissTaskReminder}
                  className="flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white"
                >
                  <Check size={14} />
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function PomodoroPage() {
  const {
    settings,
    timeLeft,
    isRunning,
    phase,
    sessionCount,
    tasks,
    showSettings,
    showToast,
    toastMessage,
    showConfetti,
    setSettings,
    toggleTimer,
    resetTimer,
    switchPhase,
    addTask,
    toggleTask,
    removeTask,
    setShowSettings,
    setShowToast,
  } = usePomodoroStore();

  const [newTaskInput, setNewTaskInput] = useState("");
  const [newTaskReminder, setNewTaskReminder] = useState<string | null>(null);
  const [showReminderInput, setShowReminderInput] = useState(false);
  const [showFullscreenTasks, setShowFullscreenTasks] = useState(false);

  // Background image state - initialize as null to avoid hydration mismatch
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Load background image from localStorage after hydration
  useEffect(() => {
    const loadStoredBg = () => {
      const storedBg = localStorage.getItem(POMODORO_BG_KEY);
      if (storedBg) {
        setCustomBgImage(storedBg);
      }
    };
    loadStoredBg();
  }, []);

  // Handle background image upload with compression
  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;
    const QUALITY = 0.7;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", QUALITY);
        
        try {
          localStorage.setItem(POMODORO_BG_KEY, compressedDataUrl);
          setCustomBgImage(compressedDataUrl);
        } catch {
          const lowerQualityUrl = canvas.toDataURL("image/jpeg", 0.4);
          try {
            localStorage.setItem(POMODORO_BG_KEY, lowerQualityUrl);
            setCustomBgImage(lowerQualityUrl);
          } catch {
            alert("Image is too large. Please choose a smaller image.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const removeBgImage = useCallback(() => {
    setCustomBgImage(null);
    localStorage.removeItem(POMODORO_BG_KEY);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      fullscreenRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Sound state
  const [notificationVolume, setNotificationVolume] = useState(() =>
    getStoredValue(STORAGE_KEYS.NOTIFICATION_VOLUME, DEFAULT_NOTIFICATION_VOLUME)
  );
  const [backgroundVolume, setBackgroundVolume] = useState(() =>
    getStoredValue(STORAGE_KEYS.BACKGROUND_VOLUME, DEFAULT_BACKGROUND_VOLUME)
  );
  const [selectedSound, setSelectedSound] = useState<BackgroundSoundId>(() =>
    getStoredValue(STORAGE_KEYS.BACKGROUND_SOUND, DEFAULT_BACKGROUND_SOUND)
  );

  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentSoundPath = BACKGROUND_SOUNDS.find((s) => s.id === selectedSound)?.path || "";

  const handleNotificationVolumeChange = useCallback((value: number) => {
    setNotificationVolume(value);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_VOLUME, JSON.stringify(value));
  }, []);

  const handleBackgroundVolumeChange = useCallback((value: number) => {
    setBackgroundVolume(value);
    localStorage.setItem(STORAGE_KEYS.BACKGROUND_VOLUME, JSON.stringify(value));
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = value;
    }
  }, []);

  const handleSoundChange = useCallback((soundId: BackgroundSoundId) => {
    setSelectedSound(soundId);
    localStorage.setItem(STORAGE_KEYS.BACKGROUND_SOUND, JSON.stringify(soundId));

    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current = null;
    }

    if (isRunning && soundId !== "none") {
      const sound = BACKGROUND_SOUNDS.find((s) => s.id === soundId);
      if (sound?.path) {
        const audio = new Audio(sound.path);
        audio.loop = true;
        audio.volume = backgroundVolume;
        audio.play();
        backgroundAudioRef.current = audio;
      }
    }
  }, [isRunning, backgroundVolume]);

  const startBackgroundSound = useCallback(() => {
    if (selectedSound === "none" || !currentSoundPath) return;
    if (backgroundAudioRef.current) return;

    const audio = new Audio(currentSoundPath);
    audio.loop = true;
    audio.volume = backgroundVolume;
    audio.play();
    backgroundAudioRef.current = audio;
  }, [selectedSound, currentSoundPath, backgroundVolume]);

  const stopBackgroundSound = useCallback(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current = null;
    }
  }, []);

  const handleToggleTimer = useCallback(() => {
    const { dismissPhasePrompt, pendingPhasePrompt } = usePomodoroStore.getState();
    if (pendingPhasePrompt) {
      dismissPhasePrompt();
    }
    if (isRunning) {
      stopBackgroundSound();
    } else {
      startBackgroundSound();
    }
    toggleTimer();
  }, [isRunning, toggleTimer, startBackgroundSound, stopBackgroundSound]);

  const handleResetTimer = useCallback(() => {
    stopBackgroundSound();
    resetTimer();
  }, [resetTimer, stopBackgroundSound]);

  const handleSwitchPhase = useCallback((newPhase: TimerPhase) => {
    stopBackgroundSound();
    switchPhase(newPhase);
  }, [switchPhase, stopBackgroundSound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "work": return "bg-primary";
      case "shortBreak": return "bg-[#2d4a3e]";
      case "longBreak": return "bg-[#3d3a4a]";
    }
  };

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    addTask(newTaskInput.trim(), newTaskReminder);
    setNewTaskInput("");
    setNewTaskReminder(null);
    setShowReminderInput(false);
  };

  const currentDuration = phase === "work"
    ? settings.workDuration
    : phase === "shortBreak"
      ? settings.shortBreakDuration
      : settings.longBreakDuration;

  // Update browser tab title with timer when running
  useEffect(() => {
    const defaultTitle = "Pomodoro Timer | DeepTerm";
    
    if (isRunning) {
      const phaseLabel = PHASE_LABELS[phase];
      document.title = `${formatTime(timeLeft)} - ${phaseLabel} | DeepTerm`;
    } else if (timeLeft < currentDuration * 60) {
      // Paused state - show paused indicator
      const phaseLabel = PHASE_LABELS[phase];
      document.title = `⏸ ${formatTime(timeLeft)} - ${phaseLabel} | DeepTerm`;
    } else {
      document.title = defaultTitle;
    }

    // Cleanup: restore default title when leaving the page
    return () => {
      document.title = defaultTitle;
    };
  }, [timeLeft, isRunning, phase, currentDuration]);

  const progress = ((currentDuration * 60 - timeLeft) / (currentDuration * 60)) * 100;


  return (
    <div className="bg-background min-h-screen">
      <EncouragementToast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      <Confetti isActive={showConfetti} />

      <main className="px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-sans font-medium text-foreground mb-2">Pomodoro Timer</h1>
            <p className="text-muted-foreground font-sans text-lg">
              Boost productivity with focused work sessions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Section */}
          <div className="lg:col-span-2">
            {/* Hidden file input for background upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBgUpload}
              className="hidden"
            />
            
            <div 
              ref={fullscreenRef}
              className={`${getPhaseColor()} rounded-[24px] p-6 sm:p-10 text-center text-white relative overflow-hidden transition-colors duration-500 ${isFullscreen ? "!rounded-none min-h-screen flex flex-col justify-center" : ""}`}
              style={customBgImage ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${customBgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              } : undefined}
            >
              {/* Background & Fullscreen Controls */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-1.5 sm:gap-2 z-20">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                  title="Change background"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                {customBgImage && (
                  <button
                    onClick={removeBgImage}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500/50 transition-all"
                    title="Remove background"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
                {isFullscreen && (
                  <button
                    onClick={() => setShowFullscreenTasks(!showFullscreenTasks)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${showFullscreenTasks ? "bg-white text-foreground" : "bg-white/10 hover:bg-white/20"}`}
                    title="Tasks"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </button>
                )}
                <button
                  onClick={toggleFullscreen}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen mode"}
                >
                  {isFullscreen ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  )}
                </button>
              </div>

              {/* Fullscreen Notifications */}
              {isFullscreen && <FullscreenNotifications />}

              {/* Phase Indicator */}
              <div className="flex justify-center gap-1 sm:gap-2 mb-6 relative z-10 mt-10 sm:mt-0 flex-wrap px-2">
                {["work", "shortBreak", "longBreak"].map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSwitchPhase(p as TimerPhase)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[14px] transition-all ${phase === p ? "bg-white/20 scale-105 font-medium" : "bg-white/5 hover:bg-white/10"}`}
                  >
                    {PHASE_LABELS[p as TimerPhase]}
                  </button>
                ))}
              </div>

              {/* Timer Display */}
              <div className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] mx-auto mb-6">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="50%" cy="50%" r="45%" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 45}%`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}%`} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-[48px] sm:text-[64px] font-light tracking-wider">{formatTime(timeLeft)}</span>
                  <span className="text-[14px] text-white/70 uppercase tracking-widest text-xs mt-2">{PHASE_LABELS[phase]}</span>
                </div>
              </div>

              {/* Session Counter */}
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${i <= sessionCount % 4 || (sessionCount > 0 && sessionCount % 4 === 0 && i === 4) ? "bg-white scale-110" : "bg-white/20"}`} />
                ))}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4 relative z-10">
                <button
                  onClick={handleToggleTimer}
                  className={`px-6 h-[48px] rounded-full font-sans font-medium text-[14px] transition-all hover:scale-105 active:scale-95 ${
                    isRunning
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-white text-foreground hover:bg-white/90 shadow-lg"
                  }`}
                >
                  {isRunning ? "Pause" : timeLeft < currentDuration * 60 ? "Resume" : "Start"}
                </button>
                <button
                  onClick={handleResetTimer}
                  className="w-[48px] h-[48px] bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all hover:rotate-180 active:scale-95"
                  title="Reset Timer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`w-[48px] h-[48px] rounded-full flex items-center justify-center transition-all active:scale-95 ${showSettings ? "bg-white text-foreground" : "bg-white/10 hover:bg-white/20"}`}
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              </div>

              {/* Fullscreen Settings Panel */}
              <AnimatePresence>
                {isFullscreen && showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto bg-black/80 backdrop-blur-lg rounded-2xl p-5 z-30 max-h-[70vh] overflow-y-auto"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-sans font-medium text-[16px] text-white">Timer Settings</h3>
                      <button onClick={() => setShowSettings(false)} className="text-white/60 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="font-sans text-[12px] text-white/70 block mb-1">Focus: {settings.workDuration}m</label>
                        <input type="range" min="1" max="60" value={settings.workDuration} onChange={(e) => setSettings({ workDuration: Number(e.target.value) })} className="w-full accent-white" />
                      </div>
                      <div>
                        <label className="font-sans text-[12px] text-white/70 block mb-1">Short Break: {settings.shortBreakDuration}m</label>
                        <input type="range" min="1" max="30" value={settings.shortBreakDuration} onChange={(e) => setSettings({ shortBreakDuration: Number(e.target.value) })} className="w-full accent-white" />
                      </div>
                      <div>
                        <label className="font-sans text-[12px] text-white/70 block mb-1">Long Break: {settings.longBreakDuration}m</label>
                        <input type="range" min="1" max="60" value={settings.longBreakDuration} onChange={(e) => setSettings({ longBreakDuration: Number(e.target.value) })} className="w-full accent-white" />
                      </div>
                    </div>
                    
                    {/* Sound Settings in Fullscreen */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="font-sans font-medium text-[14px] text-white mb-3">Sound Settings</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="font-sans text-[12px] text-white/70 block mb-1">Background Sound</label>
                          <select
                            value={selectedSound}
                            onChange={(e) => handleSoundChange(e.target.value as BackgroundSoundId)}
                            className="w-full h-[36px] px-3 rounded-lg border border-white/20 bg-white/10 text-white font-sans text-[12px] focus:outline-none"
                          >
                            {BACKGROUND_SOUNDS.map((sound) => (
                              <option key={sound.id} value={sound.id} className="bg-[#1a1b26] text-white">{sound.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-sans text-[12px] text-white/70 block mb-1">Background Volume: {Math.round(backgroundVolume * 100)}%</label>
                          <input type="range" min="0" max="1" step="0.1" value={backgroundVolume} onChange={(e) => handleBackgroundVolumeChange(Number(e.target.value))} className="w-full accent-white" disabled={selectedSound === "none"} />
                        </div>
                        <div>
                          <label className="font-sans text-[12px] text-white/70 block mb-1">Notification Volume: {Math.round(notificationVolume * 100)}%</label>
                          <input type="range" min="0" max="1" step="0.1" value={notificationVolume} onChange={(e) => handleNotificationVolumeChange(Number(e.target.value))} className="w-full accent-white" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Fullscreen Tasks Panel */}
              <AnimatePresence>
                {isFullscreen && showFullscreenTasks && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute top-14 right-0 bottom-0 w-[320px] bg-black/40 p-4 z-20 flex flex-col"
                  >
                    {/* Add Task */}
                    <div className="mb-4 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTaskInput}
                          onChange={(e) => setNewTaskInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !showReminderInput && handleAddTask()}
                          placeholder="Add a task..."
                          className="flex-1 h-[36px] px-3 rounded-full bg-white/5 text-white font-sans text-[12px] placeholder:text-white/40 focus:outline-none focus:bg-white/10"
                        />
                        <button 
                          onClick={() => {
                            const newState = !showReminderInput;
                            setShowReminderInput(newState);
                            if (newState && !newTaskReminder) {
                              const now = new Date();
                              const localDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                              setNewTaskReminder(localDateTime);
                            }
                          }} 
                          title="Set reminder"
                          className={`w-[36px] h-[36px] rounded-full flex items-center justify-center transition-colors ${
                            showReminderInput || newTaskReminder
                              ? "bg-primary text-white"
                              : "bg-white/5 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </button>
                        <button onClick={handleAddTask} className="w-[36px] h-[36px] bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                      
                      {/* Reminder Input */}
                      <AnimatePresence>
                        {showReminderInput && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col gap-2 p-2 rounded-lg bg-white/5">
                              <div className="flex items-center gap-2">
                                <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-[10px] font-medium text-white/60">Remind me at:</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="datetime-local"
                                  value={newTaskReminder || ""}
                                  onChange={(e) => setNewTaskReminder(e.target.value || null)}
                                  min={new Date().toISOString().slice(0, 16)}
                                  className="flex-1 h-[32px] px-2 rounded bg-white/5 text-white font-sans text-[11px] focus:outline-none focus:bg-white/10 [color-scheme:dark]"
                                />
                                {newTaskReminder && (
                                  <button 
                                    onClick={() => setNewTaskReminder(null)}
                                    className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Task List */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto">
                      <AnimatePresence initial={false}>
                        {tasks.length === 0 ? (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-sans text-[12px] text-center py-6 text-white/40">
                            No tasks yet. Add one to keep this session on track.
                          </motion.p>
                        ) : (
                          tasks.map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              className={`flex items-center gap-2 p-2 rounded-lg transition-all ${task.completed ? "opacity-50" : "hover:bg-white/5"}`}
                            >
                              <button
                                onClick={() => toggleTask(task.id)}
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  task.completed ? "bg-primary border-primary" : "border-white/30 hover:border-white"
                                }`}
                              >
                                {task.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </button>
                              <div className="flex-1 min-w-0 text-left">
                                <span className={`font-sans text-[12px] transition-all block truncate ${task.completed ? "line-through text-white/40" : "text-white/90"}`}>{task.text}</span>
                                {task.reminder?.enabled && task.reminder.time && !task.completed && (
                                  <span className={`flex items-center gap-1 text-[9px] mt-0.5 ${task.reminder.notified ? "text-green-400/60" : "text-white/40"}`}>
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    {task.reminder.notified ? "Notified" : new Date(task.reminder.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <button onClick={() => removeTask(task.id)} className="w-5 h-5 text-white/30 hover:text-red-400 transition-colors flex-shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Progress */}
                    {tasks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="font-sans text-[11px] flex justify-between text-white/40">
                          <span>Progress</span>
                          <span>{Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)}%</span>
                        </p>
                        <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden bg-white/5">
                          <motion.div className="h-full bg-white/70" initial={{ width: 0 }} animate={{ width: `${(tasks.filter((t) => t.completed).length / tasks.length) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && !isFullscreen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mt-6 bg-[rgba(210,210,200,0.55)] rounded-[20px] p-5 overflow-hidden shadow-sm"
                >
                  <h3 className="font-sans font-medium text-[16px] text-foreground mb-4">Timer Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="font-sans text-[13px] text-muted-foreground block mb-2">Focus Duration: {settings.workDuration} min</label>
                      <input type="range" min="1" max="60" value={settings.workDuration} onChange={(e) => setSettings({ workDuration: Number(e.target.value) })} className="w-full accent-[var(--ink)]" />
                    </div>
                    <div>
                      <label className="font-sans text-[13px] text-muted-foreground block mb-2">Short Break: {settings.shortBreakDuration} min</label>
                      <input type="range" min="1" max="30" value={settings.shortBreakDuration} onChange={(e) => setSettings({ shortBreakDuration: Number(e.target.value) })} className="w-full accent-[var(--ink)]" />
                    </div>
                    <div>
                      <label className="font-sans text-[13px] text-muted-foreground block mb-2">Long Break: {settings.longBreakDuration} min</label>
                      <input type="range" min="1" max="60" value={settings.longBreakDuration} onChange={(e) => setSettings({ longBreakDuration: Number(e.target.value) })} className="w-full accent-[var(--ink)]" />
                    </div>
                  </div>

                  {/* Sound Settings */}
                  <h3 className="font-sans font-medium text-[16px] text-foreground mb-4 mt-6 pt-4 border-t border-border">Sound Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="font-sans text-[13px] text-muted-foreground block mb-2">Background Sound</label>
                      <select
                        value={selectedSound}
                        onChange={(e) => handleSoundChange(e.target.value as BackgroundSoundId)}
                        className="w-full h-[40px] px-3 rounded-lg border border-border bg-white font-sans text-[13px] text-foreground focus:outline-none focus:border-primary/40"
                      >
                        {BACKGROUND_SOUNDS.map((sound) => (
                          <option key={sound.id} value={sound.id}>{sound.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-sans text-[13px] text-muted-foreground block mb-2">Background Volume: {Math.round(backgroundVolume * 100)}%</label>
                      <input type="range" min="0" max="1" step="0.1" value={backgroundVolume} onChange={(e) => handleBackgroundVolumeChange(Number(e.target.value))} className="w-full accent-[var(--ink)]" disabled={selectedSound === "none"} />
                    </div>
                    <div>
                      <label className="font-sans text-[13px] text-muted-foreground block mb-2">Notification Volume: {Math.round(notificationVolume * 100)}%</label>
                      <input type="range" min="0" max="1" step="0.1" value={notificationVolume} onChange={(e) => handleNotificationVolumeChange(Number(e.target.value))} className="w-full accent-[var(--ink)]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Today's Progress */}
            <div className="mt-6 bg-[rgba(210,210,200,0.55)] rounded-[20px] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-sans font-medium text-[16px] text-foreground">Today&apos;s Progress</h3>
                </div>
                <span className="px-3 py-1 rounded-full border border-primary text-[13px] font-medium text-foreground">
                  {sessionCount} completed
                </span>
              </div>

              {/* Cycle Progress Boxes */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[1, 2, 3, 4].map((i) => {
                  const currentCycleProgress = sessionCount % 4;
                  const isCompleted = i <= currentCycleProgress || (sessionCount > 0 && currentCycleProgress === 0 && sessionCount >= 4);
                  const isActive = i === currentCycleProgress + 1 && phase === "work" && isRunning;

                  return (
                    <div
                      key={i}
                      className={`h-12 rounded-xl border-2 transition-all duration-300 ${isCompleted
                        ? "bg-primary border-primary"
                        : isActive
                          ? "border-primary bg-muted"
                          : "border-border bg-white"
                        }`}
                    />
                  );
                })}
              </div>

              {/* Cycle Counter */}
              <div className="inline-block px-3 py-1.5 bg-muted rounded-lg">
                <span className="font-sans text-[13px] text-foreground">
                  Cycle: {Math.floor(sessionCount / 4) + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="lg:col-span-1">
            <div className="bg-[rgba(210,210,200,0.55)] rounded-[20px] p-5 h-full flex flex-col shadow-sm">
              <h3 className="font-sans font-medium text-[16px] text-foreground mb-4">Tasks</h3>

              {/* Add Task */}
              <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !showReminderInput && handleAddTask()}
                    placeholder="Add a task..."
                    className="flex-1 h-[40px] px-3 rounded-lg border border-border bg-white font-sans text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-shadow focus:shadow-sm"
                  />
                  <button 
                    onClick={() => {
                      const newState = !showReminderInput;
                      setShowReminderInput(newState);
                      if (newState && !newTaskReminder) {
                        const now = new Date();
                        const localDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                        setNewTaskReminder(localDateTime);
                      }
                    }} 
                    title="Set reminder"
                    className={`w-[40px] h-[40px] rounded-lg flex items-center justify-center transition-colors ${
                      showReminderInput || newTaskReminder
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground hover:bg-primary/20"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </button>
                  <button onClick={handleAddTask} className="w-[40px] h-[40px] bg-primary text-white rounded-lg flex items-center justify-center hover:bg-[#2a3347] transition-colors shadow-md hover:scale-105 active:scale-95">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
                
                {/* Reminder DateTime Input */}
                <AnimatePresence>
                  {showReminderInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs font-medium text-muted-foreground">Remind me at:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={newTaskReminder || ""}
                            onChange={(e) => setNewTaskReminder(e.target.value || null)}
                            min={new Date().toISOString().slice(0, 16)}
                            className="flex-1 h-[36px] px-2 rounded border border-border bg-white text-foreground font-sans text-[12px] focus:outline-none focus:border-primary/40"
                          />
                          {newTaskReminder && (
                            <button 
                              onClick={() => setNewTaskReminder(null)}
                              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Task List */}
              <div className="space-y-2 flex-1 overflow-y-auto min-h-[200px]">
                <AnimatePresence initial={false}>
                  {tasks.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-sans text-[13px] text-muted-foreground text-center py-8"
                    >
                      No tasks yet. Add one above.
                    </motion.p>
                  ) : (
                    tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${task.completed ? "opacity-60 bg-white/30" : "bg-white/50 hover:bg-white/80"}`}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? "bg-primary border-primary" : "border-input hover:border-primary"}`}
                        >
                          {task.completed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`font-sans text-[13px] transition-all block ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.text}</span>
                          {task.reminder?.enabled && task.reminder.time && !task.completed && (
                            <span className={`flex items-center gap-1 text-[10px] mt-0.5 ${task.reminder.notified ? "text-green-600/70" : "text-muted-foreground"}`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                              {task.reminder.notified ? "Notified" : new Date(task.reminder.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <button onClick={() => removeTask(task.id)} className="w-6 h-6 text-muted-foreground hover:text-[#ef4444] transition-colors flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Stats */}
              {tasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="font-sans text-[12px] text-muted-foreground flex justify-between">
                    <span>Progress</span>
                    <span>{Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)}%</span>
                  </p>
                  <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(tasks.filter((t) => t.completed).length / tasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
