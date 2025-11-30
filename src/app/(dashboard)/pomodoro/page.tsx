"use client";

import { useState, useCallback, useRef } from "react";
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
    pendingPhasePrompt,
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



  // Background sound refs for manual control (looping)
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  // Get current background sound path
  const currentSoundPath = BACKGROUND_SOUNDS.find((s) => s.id === selectedSound)?.path || "";

  // Handle notification volume change
  const handleNotificationVolumeChange = useCallback((value: number) => {
    setNotificationVolume(value);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_VOLUME, JSON.stringify(value));
  }, []);

  // Handle background volume change
  const handleBackgroundVolumeChange = useCallback((value: number) => {
    setBackgroundVolume(value);
    localStorage.setItem(STORAGE_KEYS.BACKGROUND_VOLUME, JSON.stringify(value));
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = value;
    }
  }, []);

  // Handle background sound selection
  const handleSoundChange = useCallback((soundId: BackgroundSoundId) => {
    setSelectedSound(soundId);
    localStorage.setItem(STORAGE_KEYS.BACKGROUND_SOUND, JSON.stringify(soundId));

    // Stop current audio if playing
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current = null;
    }

    // Start new sound if timer is running and sound is not 'none'
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



  // Handle background sound based on timer state
  const startBackgroundSound = useCallback(() => {
    if (selectedSound === "none" || !currentSoundPath) return;
    if (backgroundAudioRef.current) return; // Already playing

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

  // Custom toggle that handles background sound
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

  // Custom reset that stops background sound
  const handleResetTimer = useCallback(() => {
    stopBackgroundSound();
    resetTimer();
  }, [resetTimer, stopBackgroundSound]);

  // Custom switch phase that stops background sound
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
      case "work": return "bg-[#171d2b]";
      case "shortBreak": return "bg-[#2d4a3e]";
      case "longBreak": return "bg-[#3d3a4a]";
    }
  };

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    addTask(newTaskInput.trim());
    setNewTaskInput("");
  };

  const currentDuration = phase === "work"
    ? settings.workDuration
    : phase === "shortBreak"
      ? settings.shortBreakDuration
      : settings.longBreakDuration;

  const progress = ((currentDuration * 60 - timeLeft) / (currentDuration * 60)) * 100;

  return (
    <div className="bg-[#f0f0ea] min-h-screen">
      <EncouragementToast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      <Confetti isActive={showConfetti} />

      <main className="px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-sora font-bold text-[#171d2b] mb-2">Pomodoro Timer</h1>
            <p className="text-[#171d2b]/60 font-sans text-lg">
              Boost productivity with focused work sessions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Section */}
          <div className="lg:col-span-2">
            <div className={`${getPhaseColor()} rounded-[24px] p-6 sm:p-10 text-center text-white relative overflow-hidden transition-colors duration-500`}>

              {/* Phase Indicator */}
              <div className="flex justify-center gap-2 mb-6 relative z-10">
                {["work", "shortBreak", "longBreak"].map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSwitchPhase(p as TimerPhase)}
                    className={`px-4 py-2 rounded-full text-[13px] sm:text-[14px] transition-all ${phase === p ? "bg-white/20 scale-105 font-medium" : "bg-white/5 hover:bg-white/10"}`}
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
                  className="w-[120px] h-[48px] bg-white text-[#171d2b] rounded-full font-sans font-medium text-[15px] hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  {isRunning ? "Pause" : "Start"}
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
                  className={`w-[48px] h-[48px] rounded-full flex items-center justify-center transition-all active:scale-95 ${showSettings ? "bg-white text-[#171d2b]" : "bg-white/10 hover:bg-white/20"}`}
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mt-6 bg-[rgba(210,210,200,0.55)] rounded-[20px] p-5 overflow-hidden shadow-sm"
                >
                  <h3 className="font-sans font-medium text-[16px] text-[#171d2b] mb-4">Timer Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="font-sans text-[13px] text-[#171d2b]/70 block mb-2">Focus Duration: {settings.workDuration} min</label>
                      <input type="range" min="1" max="60" value={settings.workDuration} onChange={(e) => setSettings({ workDuration: Number(e.target.value) })} className="w-full accent-[#171d2b]" />
                    </div>
                    <div>
                      <label className="font-sans text-[13px] text-[#171d2b]/70 block mb-2">Short Break: {settings.shortBreakDuration} min</label>
                      <input type="range" min="1" max="30" value={settings.shortBreakDuration} onChange={(e) => setSettings({ shortBreakDuration: Number(e.target.value) })} className="w-full accent-[#171d2b]" />
                    </div>
                    <div>
                      <label className="font-sans text-[13px] text-[#171d2b]/70 block mb-2">Long Break: {settings.longBreakDuration} min</label>
                      <input type="range" min="1" max="60" value={settings.longBreakDuration} onChange={(e) => setSettings({ longBreakDuration: Number(e.target.value) })} className="w-full accent-[#171d2b]" />
                    </div>
                  </div>

                  {/* Sound Settings */}
                  <h3 className="font-sans font-medium text-[16px] text-[#171d2b] mb-4 mt-6 pt-4 border-t border-[#171d2b]/10">Sound Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="font-sans text-[13px] text-[#171d2b]/70 block mb-2">Background Sound</label>
                      <select
                        value={selectedSound}
                        onChange={(e) => handleSoundChange(e.target.value as BackgroundSoundId)}
                        className="w-full h-[40px] px-3 rounded-lg border border-[#171d2b]/20 bg-white font-sans text-[13px] text-[#171d2b] focus:outline-none focus:border-[#171d2b]/40"
                      >
                        {BACKGROUND_SOUNDS.map((sound) => (
                          <option key={sound.id} value={sound.id}>{sound.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-sans text-[13px] text-[#171d2b]/70 block mb-2">Background Volume: {Math.round(backgroundVolume * 100)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={backgroundVolume}
                        onChange={(e) => handleBackgroundVolumeChange(Number(e.target.value))}
                        className="w-full accent-[#171d2b]"
                        disabled={selectedSound === "none"}
                      />
                    </div>
                    <div>
                      <label className="font-sans text-[13px] text-[#171d2b]/70 block mb-2">Notification Volume: {Math.round(notificationVolume * 100)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={notificationVolume}
                        onChange={(e) => handleNotificationVolumeChange(Number(e.target.value))}
                        className="w-full accent-[#171d2b]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Today's Progress */}
            <div className="mt-6 bg-[rgba(210,210,200,0.55)] rounded-[20px] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#171d2b] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-sans font-semibold text-[16px] text-[#171d2b]">Today&apos;s Progress</h3>
                </div>
                <span className="px-3 py-1 rounded-full border border-[#171d2b] text-[13px] font-medium text-[#171d2b]">
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
                        ? "bg-[#171d2b] border-[#171d2b]"
                        : isActive
                          ? "border-[#171d2b] bg-[#171d2b]/10"
                          : "border-[#171d2b]/20 bg-white"
                        }`}
                    />
                  );
                })}
              </div>

              {/* Cycle Counter */}
              <div className="inline-block px-3 py-1.5 bg-[#171d2b]/10 rounded-lg">
                <span className="font-sans text-[13px] text-[#171d2b]">
                  Cycle: {Math.floor(sessionCount / 4) + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="lg:col-span-1">
            <div className="bg-[rgba(210,210,200,0.55)] rounded-[20px] p-5 h-full flex flex-col shadow-sm">
              <h3 className="font-sans font-medium text-[16px] text-[#171d2b] mb-4">Tasks</h3>

              {/* Add Task */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Add a task..."
                  className="flex-1 h-[40px] px-3 rounded-lg border border-[#171d2b]/20 bg-white font-sans text-[13px] text-[#171d2b] placeholder:text-[#171d2b]/40 focus:outline-none focus:border-[#171d2b]/40 transition-shadow focus:shadow-sm"
                />
                <button onClick={handleAddTask} className="w-[40px] h-[40px] bg-[#171d2b] text-white rounded-lg flex items-center justify-center hover:bg-[#2a3347] transition-colors shadow-md hover:scale-105 active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>

              {/* Task List */}
              <div className="space-y-2 flex-1 overflow-y-auto min-h-[200px]">
                <AnimatePresence initial={false}>
                  {tasks.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-sans text-[13px] text-[#171d2b]/50 text-center py-8"
                    >
                      No tasks yet. Add one above!
                    </motion.p>
                  ) : (
                    tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-lg bg-white/50 transition-all ${task.completed ? "opacity-60 bg-white/30" : "hover:bg-white/80"}`}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? "bg-[#171d2b] border-[#171d2b]" : "border-[#171d2b]/30 hover:border-[#171d2b]"}`}
                        >
                          {task.completed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className={`flex-1 font-sans text-[13px] text-[#171d2b] transition-all ${task.completed ? "line-through text-[#171d2b]/50" : ""}`}>{task.text}</span>
                        <button onClick={() => removeTask(task.id)} className="w-6 h-6 text-[#171d2b]/40 hover:text-[#ef4444] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Stats */}
              {tasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#171d2b]/10">
                  <p className="font-sans text-[12px] text-[#171d2b]/60 flex justify-between">
                    <span>Progress</span>
                    <span>{Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)}%</span>
                  </p>
                  <div className="w-full h-1.5 bg-[#171d2b]/10 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#171d2b]"
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
