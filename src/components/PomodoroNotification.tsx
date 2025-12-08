"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, X } from "lucide-react";
import { usePomodoroStore } from "@/lib/stores";
import type { TimerPhase } from "@/lib/schemas/pomodoro";
import useSound from "use-sound";
import {
  NOTIFICATION_SOUND,
  STORAGE_KEYS,
  DEFAULT_NOTIFICATION_VOLUME,
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

// Module-level subscription to avoid re-subscribing on each render
let subscriptionInitialized = false;
let notificationCallback: (() => void) | null = null;

export default function PomodoroNotification() {
  const {
    pendingPhasePrompt,
    pendingNextPhase,
    phase: currentPhase,
    startNextPhase,
    dismissPhasePrompt,
  } = usePomodoroStore();

  const [shouldPlaySound, setShouldPlaySound] = useState(false);
  const playNotificationRef = useRef<(() => void) | null>(null);
  
  // Get notification volume from localStorage
  const [notificationVolume] = useState(() =>
    getStoredValue(STORAGE_KEYS.NOTIFICATION_VOLUME, DEFAULT_NOTIFICATION_VOLUME)
  );

  const [playNotification, { stop: stopNotification }] = useSound(NOTIFICATION_SOUND, {
    volume: notificationVolume,
  });

  // Store playNotification in ref for subscription callback
  playNotificationRef.current = playNotification;

  // Initialize subscription once at module level
  if (!subscriptionInitialized) {
    subscriptionInitialized = true;
    usePomodoroStore.subscribe((state, prevState) => {
      if (state.pendingPhasePrompt && !prevState.pendingPhasePrompt) {
        notificationCallback?.();
      }
    });
  }

  // Update the callback reference
  notificationCallback = () => setShouldPlaySound(true);

  // Play sound when flag is set, then reset
  if (shouldPlaySound) {
    playNotification();
    setShouldPlaySound(false);
  }

  // Stop sound when prompt is dismissed (from any source - global or fullscreen component)
  // This ensures sound stops even when dismissed from fullscreen mode
  const prevPendingRef = useRef(pendingPhasePrompt);
  if (prevPendingRef.current && !pendingPhasePrompt) {
    stopNotification();
  }
  prevPendingRef.current = pendingPhasePrompt;

  // Handler to stop notification sound and dismiss prompt
  const handleDismiss = () => {
    stopNotification();
    dismissPhasePrompt();
  };

  // Handler to stop notification sound and start next phase
  const handleStartNextPhase = () => {
    stopNotification();
    startNextPhase();
  };

  if (!pendingPhasePrompt || !pendingNextPhase) return null;

  const completedPhaseLabel = PHASE_LABELS[currentPhase];
  const nextPhaseLabel = PHASE_LABELS[pendingNextPhase];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
      >
        <div className="bg-[#171d2b] text-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Timer size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-sora font-semibold text-base mb-1">
                  {completedPhaseLabel} Complete!
                </h3>
                <p className="text-white/70 text-sm">
                  Ready to start {nextPhaseLabel.toLowerCase()}?
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X size={18} className="text-white/60" />
              </button>
            </div>
          </div>
          <div className="flex border-t border-white/10">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 text-sm font-medium text-white/70 hover:bg-white/5 transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleStartNextPhase}
              className="flex-1 py-3 text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <Play size={14} />
              Start {nextPhaseLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
