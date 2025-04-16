import { useToast } from "@/components/ui/use-toast";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Default timer settings
const DEFAULT_SETTINGS = {
    pomodoro: 25 * 60, // 25 minutes in seconds
    shortBreak: 5 * 60, // 5 minutes in seconds
    longBreak: 15 * 60, // 15 minutes in seconds
    pomodorosUntilLongBreak: 4
};

// Audio notification path
const NOTIFICATION_SOUND_URL = '/notification.mp3';

// Flag to track if audio playback was initiated by user interaction
let userInteractionOccurred = false;

// Timer types
export type TimerType = 'pomodoro' | 'shortBreak' | 'longBreak';

interface PomodoroContextType {
    timer: number;
    timerType: TimerType;
    isRunning: boolean;
    completedPomodoros: number;
    isMuted: boolean;
    initialTime: number;
    isTimerCompleted: boolean;
    isPlayingSound: boolean;
    formatTime: (timeInSeconds: number) => string;
    toggleTimer: () => void;
    resetTimer: () => void;
    handleTimerTypeChange: (type: TimerType) => void;
    handleStartNextPhase: () => void;
    toggleMute: () => void;
    stopSound: () => void;
    nextTimerType: TimerType | null;
    DEFAULT_SETTINGS: typeof DEFAULT_SETTINGS;
    NOTIFICATION_SOUND_URL: string;
    setIsTimerCompleted: React.Dispatch<React.SetStateAction<boolean>>;
    audioRef: React.RefObject<HTMLAudioElement>;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Timer state
    const [timer, setTimer] = useState(DEFAULT_SETTINGS.pomodoro);
    const [timerType, setTimerType] = useState<TimerType>('pomodoro');
    const [isRunning, setIsRunning] = useState(false);
    const [completedPomodoros, setCompletedPomodoros] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [initialTime, setInitialTime] = useState(DEFAULT_SETTINGS.pomodoro);
    const [isTimerCompleted, setIsTimerCompleted] = useState(false);
    const [isPlayingSound, setIsPlayingSound] = useState(false);
    const [nextTimerType, setNextTimerType] = useState<TimerType | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    // Create audio element on component mount and set up user interaction tracking
    useEffect(() => {
        // Create audio element
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);

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

    // Handle timer completion
    const handleTimerComplete = useCallback(() => {
        // Play sound that will continue until user takes action
        playSound();

        // Set states for showing the completion dialog
        setIsTimerCompleted(true);

        // Determine next timer type
        let nextType: TimerType;

        if (timerType === 'pomodoro') {
            const newCount = completedPomodoros + 1;

            // After completing set number of pomodoros, take a long break
            if (newCount % DEFAULT_SETTINGS.pomodorosUntilLongBreak === 0) {
                nextType = 'longBreak';
            } else {
                nextType = 'shortBreak';
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

    // Toggle mute state
    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const value = {
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
        stopSound,
        nextTimerType,
        DEFAULT_SETTINGS,
        NOTIFICATION_SOUND_URL,
        setIsTimerCompleted,
        audioRef
    };

    return (
        <PomodoroContext.Provider value={value}>
            {children}
            {/* Include audio element */}
            <audio ref={audioRef} src={NOTIFICATION_SOUND_URL} preload="auto" />

            {/* Timer completion dialog */}
            {isTimerCompleted && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold mb-2">
                            {timerType === 'pomodoro' ? 'Break Time!' : 'Break Finished!'}
                        </h2>
                        <p className="mb-4">
                            {timerType === 'pomodoro'
                                ? 'Great job focusing! Time to take a break.'
                                : 'Break time is over. Ready to focus again?'}
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleStartNextPhase}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
                            >
                                {timerType === 'pomodoro'
                                    ? 'Start Break'
                                    : 'Start Pomodoro'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PomodoroContext.Provider>
    );
};

export const usePomodoroContext = (): PomodoroContextType => {
    const context = useContext(PomodoroContext);
    if (context === undefined) {
        throw new Error("usePomodoroContext must be used within a PomodoroProvider");
    }
    return context;
};
