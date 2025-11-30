"use client";

import { useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// Seeded random number generator for deterministic values
const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

// --- Confetti Explosion ---
export const Confetti = ({ isActive = false }: { isActive?: boolean }) => {
    const particles = useMemo(() => {
        const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"];
        return Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: (i % 2 === 0 ? -1 : 1) * (seededRandom(i * 1) * 200 + 50),
            y: -seededRandom(i * 2) * 300 - 100,
            rotation: seededRandom(i * 3) * 360,
            scale: seededRandom(i * 4) * 0.5 + 0.5,
            color: colors[Math.floor(seededRandom(i * 5) * 5)],
            delay: seededRandom(i * 6) * 0.2,
            isCircle: seededRandom(i * 7) > 0.5,
        }));
    }, []);

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                    animate={{
                        opacity: 0,
                        x: p.x,
                        y: p.y,
                        rotate: p.rotation,
                        scale: p.scale,
                    }}
                    transition={{
                        duration: 1.5,
                        ease: "easeOut",
                        delay: p.delay,
                    }}
                    style={{
                        position: "absolute",
                        width: "12px",
                        height: "12px",
                        backgroundColor: p.color,
                        borderRadius: p.isCircle ? "50%" : "2px",
                    }}
                />
            ))}
        </div>
    );
};

// --- Floating Mascot (The "Brainy" Orb) ---
export const FloatingOrb = ({ state = "idle" }: { state?: "idle" | "thinking" | "happy" | "focus" }) => {
    const variants: Variants = {
        idle: {
            scale: [1, 1.05, 1],
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        },
        thinking: {
            scale: [1, 0.9, 1.1, 1],
            rotate: [0, 180, 360],
            transition: { duration: 2, repeat: Infinity, ease: "linear" }
        },
        happy: {
            scale: [1, 1.2, 1],
            y: [0, -20, 0],
            transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" as const }
        },
        focus: {
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
            transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
    };

    const colors: Record<string, string> = {
        idle: "#171d2b",
        thinking: "#8B5CF6",
        happy: "#10B981",
        focus: "#3B82F6"
    };

    const currentColor = colors[state];

    return (
        <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Glow effect */}
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.1, 0.2],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 rounded-full blur-xl"
                style={{ backgroundColor: currentColor }}
            />

            {/* Core Orb */}
            <motion.div
                variants={variants}
                animate={state}
                className="relative w-16 h-16 rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm border-2 border-white/20"
                style={{
                    background: `linear-gradient(135deg, ${currentColor}dd, ${currentColor})`,
                }}
            >
                {/* Face Expressions - REMOVED */}
                <div className="relative w-full h-full">
                    {state === "thinking" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                            />
                        </div>
                    )}
                    {state === "focus" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full opacity-50" />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// --- Success Checkmark Explosion ---
export const SuccessCheck = () => {
    return (
        <div className="relative w-20 h-20 flex items-center justify-center">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10"
            >
                <motion.svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <polyline points="20 6 9 17 4 12" />
                </motion.svg>
            </motion.div>

            {/* Ripple rings */}
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="absolute inset-0 border-2 border-green-500 rounded-full"
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                />
            ))}
        </div>
    );
};

// --- Encouragement Toast ---
export const EncouragementToast = ({ message, isVisible, onClose }: { message: string, isVisible: boolean, onClose: () => void }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#171d2b] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 cursor-pointer"
                    onClick={onClose}
                >
                    <span className="font-sora font-medium">{message}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- Happy Bird Mascot (Image) ---
export const HappyBirdMascot = ({ className = "w-20 h-20" }: { className?: string }) => (
    <div className={`relative ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/happy.webp" alt="Happy mascot" className="w-full h-full object-contain" />
    </div>
);

// --- Neutral Bird Mascot (uses happy image) ---
export const NeutralBirdMascot = ({ className = "w-20 h-20" }: { className?: string }) => (
    <div className={`relative ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/happy.webp" alt="Neutral mascot" className="w-full h-full object-contain" />
    </div>
);

// --- Sad Bird Mascot (Image) ---
export const SadBirdMascot = ({ className = "w-20 h-20" }: { className?: string }) => (
    <div className={`relative ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/sad.webp" alt="Sad mascot" className="w-full h-full object-contain" />
    </div>
);

// --- Animated Progress Bar (Segmented) ---
export const AnimatedProgress = ({ value, total, color = "#171d2b" }: { value: number, total: number, color?: string }) => {
    return (
        <div className="w-full flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => {
                const isActive = i === value - 1;
                const isCompleted = i < value - 1;

                return (
                    <div key={i} className="flex-1 h-2 rounded-full bg-[#171d2b]/10 overflow-hidden relative">
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{
                                width: isCompleted ? "100%" : isActive ? "100%" : "0%",
                                opacity: isActive ? 0.5 : 1
                            }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 h-full rounded-full"
                            style={{ backgroundColor: color }}
                        />
                    </div>
                );
            })}
        </div>
    );
};


// --- Session Result Card (Reusable) ---
interface SessionResultCardProps {
    title: string;
    percentage: number;
    correct: number;
    total: number;
    onBack: () => void;
    onRetry: () => void;
    backLabel?: string;
    retryLabel?: string;
    showConfetti?: boolean;
}

export const SessionResultCard = ({
    title,
    percentage,
    correct,
    total,
    onBack,
    onRetry,
    backLabel = "Back",
    retryLabel = "Try Again",
    showConfetti = true
}: SessionResultCardProps) => {
    const getMascot = () => {
        if (percentage >= 70) return <HappyBirdMascot />;
        if (percentage >= 50) return <NeutralBirdMascot />;
        return <SadBirdMascot />;
    };

    const getMessage = () => {
        if (percentage >= 90) return "Outstanding!";
        if (percentage >= 70) return "Great Job!";
        if (percentage >= 50) return "Good Effort!";
        return "Keep Practicing!";
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f0f0ea]">
            {showConfetti && percentage >= 70 && <Confetti isActive={true} />}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 md:p-12 max-w-2xl w-full text-center shadow-xl border border-[#171d2b]/5 z-10"
            >
                <div className="mb-6 flex flex-col items-center">
                    <div className="mb-4">
                        {getMascot()}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-sora font-bold text-[#171d2b] mb-1">
                        {getMessage()}
                    </h2>
                    <p className="text-[#171d2b]/60">{title}</p>
                </div>

                {/* Score Display */}
                <div className="bg-[#171d2b] rounded-2xl p-6 mb-6">
                    <div className="text-5xl md:text-6xl font-bold text-white mb-2">{percentage}%</div>
                    <p className="text-white/60 text-sm">{correct} out of {total} correct</p>
                </div>

                {/* Stats Pills */}
                <div className="flex justify-center gap-4 mb-8">
                    <div className="px-5 py-3 bg-[#171d2b]/5 rounded-xl">
                        <div className="text-xl font-bold text-[#171d2b]">{correct}</div>
                        <div className="text-xs text-[#171d2b]/60">Correct</div>
                    </div>
                    <div className="px-5 py-3 bg-[#171d2b]/5 rounded-xl">
                        <div className="text-xl font-bold text-[#171d2b]">{total - correct}</div>
                        <div className="text-xs text-[#171d2b]/60">To Review</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onBack}
                        className="flex-1 max-w-[160px] h-12 bg-white border border-[#171d2b]/10 text-[#171d2b] rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                    >
                        {backLabel}
                    </button>
                    <button
                        onClick={onRetry}
                        className="flex-1 max-w-[160px] h-12 bg-[#171d2b] text-white rounded-xl font-medium hover:bg-[#2a3347] transition-colors text-sm"
                    >
                        {retryLabel}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
