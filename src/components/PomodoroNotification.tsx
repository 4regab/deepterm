"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, X } from "lucide-react";
import { usePomodoroStore } from "@/lib/stores";
import type { TimerPhase } from "@/lib/schemas/pomodoro";

const PHASE_LABELS: Record<TimerPhase, string> = {
  work: "Focus Time",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

export default function PomodoroNotification() {
  const {
    pendingPhasePrompt,
    pendingNextPhase,
    phase: currentPhase,
    startNextPhase,
    dismissPhasePrompt,
  } = usePomodoroStore();

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
              Start {nextPhaseLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
