"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

interface ExitPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onExit: () => void;
  xpToLose?: number;
  currentLevel?: number;
  currentXp?: number;
  maxXp?: number;
  nextLevel?: number;
}

export default function ExitPopup({
  isOpen,
  onClose,
  onExit,
  xpToLose = 10,
  currentLevel = 1,
  currentXp = 0,
  maxXp = 100,
  nextLevel = 2,
}: ExitPopupProps) {
  const progressPercent = Math.min((currentXp / maxXp) * 100, 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-[32px] w-full max-w-[480px] overflow-visible shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors z-10"
            >
              <X size={24} />
            </button>

            {/* Mascot peeking over */}
            <div className="absolute -top-[80px] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Image src="/assets/sad.webp" alt="Sad mascot" width={160} height={140} />
              </motion.div>
            </div>

            {/* Content */}
            <div className="pt-16 pb-8 px-8">
              {/* Level progress card */}
              <div className="bg-muted rounded-[20px] p-5 mb-8 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans font-medium text-foreground text-lg">
                    Level {currentLevel}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center">
                    <span className="font-sans font-medium text-purple-600 text-sm">{nextLevel}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: `${progressPercent}%` }}
                    animate={{ width: `${Math.max(progressPercent - (xpToLose / maxXp) * 100, 0)}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                  />
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full opacity-30"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-sans font-medium">{currentXp}/{maxXp} XP</span>
                  <span className="text-red-500 font-sans font-medium">- {xpToLose} XP</span>
                </div>
              </div>

              {/* Warning text */}
              <div className="text-center mb-8">
                <h3 className="font-sans font-medium text-foreground text-xl mb-3 leading-tight">
                  Wait! You&apos;ll lose progress
                </h3>
                <p className="font-sans text-muted-foreground text-[15px] leading-relaxed">
                  If you leave now, you&apos;ll lose <strong className="text-foreground">{xpToLose} XP</strong> and your study session won&apos;t be saved.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onExit}
                  className="flex-1 px-6 py-3.5 bg-white border-2 border-border text-foreground rounded-2xl font-sans font-medium hover:bg-gray-50 hover:border-border transition-all"
                >
                  Exit
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 bg-primary text-white rounded-2xl font-sans font-medium hover:bg-[#2a3347] transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  Keep going
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
