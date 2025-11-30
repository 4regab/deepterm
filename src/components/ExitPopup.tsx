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
            className="absolute inset-0 bg-[#171d2b]/40 backdrop-blur-sm"
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
              className="absolute top-4 right-4 p-2 text-[#171d2b]/40 hover:text-[#171d2b] hover:bg-[#171d2b]/5 rounded-full transition-colors z-10"
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
              <div className="bg-[#f8f9fa] rounded-[20px] p-5 mb-8 border border-[#171d2b]/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sora font-semibold text-[#171d2b] text-lg">
                    Level {currentLevel}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center">
                    <span className="font-sora font-bold text-purple-600 text-sm">{nextLevel}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-3 bg-[#171d2b]/5 rounded-full overflow-hidden mb-2">
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
                  <span className="text-[#171d2b]/60 font-sans font-medium">{currentXp}/{maxXp} XP</span>
                  <span className="text-red-500 font-sans font-bold">- {xpToLose} XP</span>
                </div>
              </div>

              {/* Warning text */}
              <div className="text-center mb-8">
                <h3 className="font-sora font-bold text-[#171d2b] text-xl mb-3 leading-tight">
                  Wait! You&apos;ll lose progress
                </h3>
                <p className="font-sans text-[#171d2b]/60 text-[15px] leading-relaxed">
                  If you leave now, you&apos;ll lose <strong className="text-[#171d2b]">{xpToLose} XP</strong> and your study session won&apos;t be saved.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onExit}
                  className="flex-1 px-6 py-3.5 bg-white border-2 border-[#171d2b]/10 text-[#171d2b] rounded-2xl font-sora font-semibold hover:bg-gray-50 hover:border-[#171d2b]/20 transition-all"
                >
                  Exit
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 bg-[#171d2b] text-white rounded-2xl font-sora font-semibold hover:bg-[#2a3347] transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
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
