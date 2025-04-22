import { useToast } from "@/components/ui/use-toast";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { 
  DEFAULT_SETTINGS, 
  NOTIFICATION_SOUND_URL, 
  StudySession, 
  TimerType, 
  formatDuration, 
  formatTime, 
  getFormattedDate 
} from "./pomodoroUtils";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserProfile } from "./UserProfileContext";

// Extend the Window interface to include our custom property
interface Window {
  __pomodoroAudio?: HTMLAudioElement | null;
}

// Flag to track if audio playback was initiated by user interaction
let userInteractionOccurred = false;

// Store the previous page path for returning after breaks
let previousPagePath = '';

// Export the type
export interface PomodoroContextType {
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
    userSettings: {
        pomodoro: number;
        shortBreak: number;
        longBreak: number;
        pomodorosUntilLongBreak: number;
    };
    updateUserSettings: (newSettings: Partial<{
        pomodoro: number;
        shortBreak: number;
        longBreak: number;
        pomodorosUntilLongBreak: number;
    }>) => void;
    isSettingsDialogOpen: boolean;
    setIsSettingsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setTimer: React.Dispatch<React.SetStateAction<number>>;
    setInitialTime: React.Dispatch<React.SetStateAction<number>>;
    // Streak tracking
    studyStreak: number;
    studySessions: StudySession[];
    isStreakDialogOpen: boolean;
    setIsStreakDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    totalStudyTimeToday: number;
    formatDuration: (durationInSeconds: number) => string;
    getFormattedDate: (dateStr: string) => string;
    // Global state preservation
    previousPagePath: string;
    setPreviousPagePath: (path: string) => void;
    // Timer visibility in navbar
    isTimerVisibleInNavbar: boolean;
    setIsTimerVisibleInNavbar: React.Dispatch<React.SetStateAction<boolean>>;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { updateMinutesStudied, resetTasksInPomodoro } = useUserProfile();

    // Load saved user settings from localStorage or use defaults
    const loadSavedSettings = () => {
        try {
            const savedSettings = localStorage.getItem('pomodoro-settings');
            if (savedSettings) {
                return JSON.parse(savedSettings);
            }
        } catch (error) {
            console.error("Failed to load saved settings:", error);
        }
        return DEFAULT_SETTINGS;
    };

    // Load study sessions from localStorage
    const loadStudySessions = (): StudySession[] => {
        try {
            const savedSessions = localStorage.getItem('study-sessions');
            if (savedSessions) {
                return JSON.parse(savedSessions);
            }
        } catch (error) {
            console.error("Failed to load study sessions:", error);
        }
        return [];
    };

    // User settings state
    const [userSettings, setUserSettings] = useState(loadSavedSettings);
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [isStreakDialogOpen, setIsStreakDialogOpen] = useState(false);

    // Timer state
    const [timer, setTimer] = useState(userSettings.pomodoro);
    const [timerType, setTimerType] = useState<TimerType>('pomodoro');
    const [isRunning, setIsRunning] = useState(false);
    const [completedPomodoros, setCompletedPomodoros] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [initialTime, setInitialTime] = useState(userSettings.pomodoro);
    const [isTimerCompleted, setIsTimerCompleted] = useState(false);
    const [isPlayingSound, setIsPlayingSound] = useState(false);
    const [nextTimerType, setNextTimerType] = useState<TimerType | null>(null);
    
    // State for timer visibility in navbar
    const [isTimerVisibleInNavbar, setIsTimerVisibleInNavbar] = useState(false);
    
    // Store the previous page path for returning after breaks
    const setPreviousPagePath = useCallback((path: string) => {
        previousPagePath = path;
    }, []);
    
    // Streak tracking
    const [studySessions, setStudySessions] = useState<StudySession[]>(loadStudySessions);
    const [studyStreak, setStudyStreak] = useState(0);
    const [totalStudyTimeToday, setTotalStudyTimeToday] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();
    const completionProcessed = useRef(false); // Ref to prevent double completion processing

    // Track the current page and store it if it's not the Pomodoro page
    useEffect(() => {
        if (location.pathname !== '/pomodoro') {
            setPreviousPagePath(location.pathname);
        }
    }, [location.pathname, setPreviousPagePath]);

    // Update document title based on timer state
    useEffect(() => {
        const originalTitle = "Focus Deep";
        
        if (isRunning) {
            const formattedTime = formatTime(timer);
            const prefix = timerType === 'pomodoro' ? '🎯 ' : '☕ ';
            document.title = `${prefix}${formattedTime} - Focus Deep`;
        } else if (isTimerCompleted) {
            document.title = `⏰ Timer Complete! - Focus Deep`;
        } else {
            document.title = originalTitle;
        }
        
        return () => {
            document.title = originalTitle;
        };
    }, [timer, isRunning, timerType, isTimerCompleted]);

    // Calculate streak on component mount and when study sessions change
    useEffect(() => {
        // Calculate streak based on consecutive days
        const calculateStreak = () => {
            if (studySessions.length === 0) return 0;

            // Create a set of unique dates (YYYY-MM-DD format)
            const uniqueDatesSet = new Set(
                studySessions.map(session => {
                    const date = new Date(session.date);
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                })
            );

            const uniqueDates = Array.from(uniqueDatesSet).sort().reverse(); // Sort in descending order
            
            if (uniqueDates.length === 0) return 0;
            
            let currentStreak = 1; // Start with 1 for the most recent day
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            // Check if the most recent study day is today
            if (uniqueDates[0] !== todayStr) {
                const mostRecentDate = new Date(uniqueDates[0]);
                const diffTime = Math.abs(today.getTime() - mostRecentDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // If the most recent study day was not yesterday or today, break the streak
                if (diffDays > 1) return 0;
            }
            
            // Count consecutive days
            for (let i = 0; i < uniqueDates.length - 1; i++) {
                const currentDate = new Date(uniqueDates[i]);
                const prevDate = new Date(uniqueDates[i + 1]);
                
                // Calculate the difference in days
                const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // If the days are consecutive, increase the streak
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    break; // Break in the streak
                }
            }
            
            return currentStreak;
        };

        // Calculate today's total study time
        const calculateTodayStudyTime = () => {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            return studySessions
                .filter(session => {
                    const sessionDate = new Date(session.date);
                    const sessionDateStr = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`;
                    return sessionDateStr === todayStr;
                })
                .reduce((total, session) => total + session.duration, 0);
        };

        const streak = calculateStreak();
        const todayTime = calculateTodayStudyTime();
        
        setStudyStreak(streak);
        setTotalStudyTimeToday(todayTime);
    }, [studySessions]);

    // Update user settings and save to localStorage
    const updateUserSettings = useCallback((newSettings: Partial<typeof userSettings>) => {
        setUserSettings(prevSettings => {
            const updatedSettings = { ...prevSettings, ...newSettings };
            try {
                localStorage.setItem('pomodoro-settings', JSON.stringify(updatedSettings));
            } catch (error) {
                console.error("Failed to save settings:", error);
            }
            return updatedSettings;
        });
    }, []);

    // Create audio element on component mount and set up user interaction tracking
    useEffect(() => {
        // Create and configure audio element
        const audioElement = new Audio(NOTIFICATION_SOUND_URL);
        audioRef.current = audioElement;
        (window as Window).__pomodoroAudio = audioElement;
        
        audioElement.preload = "auto";
        audioElement.loop = true;

        // Handle user interaction for audio permission
        const handleUserInteraction = () => {
            if (!userInteractionOccurred) {
                userInteractionOccurred = true;
                
                // Try to initialize audio context
                const warmupAudio = new Audio(NOTIFICATION_SOUND_URL);
                const silentPlay = warmupAudio.play();
                if (silentPlay) {
                    silentPlay.then(() => {
                        warmupAudio.pause();
                        warmupAudio.currentTime = 0;
                    }).catch(() => {
                        // Ignore errors during warmup
                    });
                }
            }
        };

        // Handle audio error recovery
        const handleAudioError = (error: Event) => {
            console.error("Audio playback error:", error);
            if (isPlayingSound && !isMuted) {
                // Try to recover by recreating the audio element
                const newAudio = new Audio(NOTIFICATION_SOUND_URL);
                newAudio.loop = true;
                audioRef.current = newAudio;
                (window as Window).__pomodoroAudio = newAudio;
                newAudio.play().catch(console.error);
            }
        };

        // Add event listeners
        window.addEventListener('click', handleUserInteraction);
        window.addEventListener('keydown', handleUserInteraction);
        window.addEventListener('touchstart', handleUserInteraction);
        audioElement.addEventListener('error', handleAudioError);

        return () => {
            // Clean up event listeners
            window.removeEventListener('click', handleUserInteraction);
            window.removeEventListener('keydown', handleUserInteraction);
            window.removeEventListener('touchstart', handleUserInteraction);
            audioElement.removeEventListener('error', handleAudioError);

            // Clean up audio elements
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if ((window as Window).__pomodoroAudio) {
                (window as Window).__pomodoroAudio.pause();
                (window as Window).__pomodoroAudio = null;
            }
        };
    }, [isPlayingSound, isMuted]);

    // Keep track of tab visibility state
    const wasVisible = useRef(true);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            
            // Handle tab becoming visible
            if (isVisible && !wasVisible.current && isPlayingSound && !isMuted) {
                console.log("Tab became visible, checking audio...");
                
                // Check if audio is actually playing
                const currentAudio = audioRef.current;
                if (currentAudio && (currentAudio.paused || currentAudio.ended)) {
                    console.log("Audio was paused, attempting to resume...");
                    
                    // Try to resume playback
                    const resumePromise = currentAudio.play();
                    if (resumePromise) {
                        resumePromise.catch(error => {
                            console.error("Failed to resume audio:", error);
                            // Create new audio element if resume fails
                            const newAudio = new Audio(NOTIFICATION_SOUND_URL);
                            newAudio.loop = true;
                            audioRef.current = newAudio;
                            (window as Window).__pomodoroAudio = newAudio;
                            newAudio.play().catch(console.error);
                        });
                    }
                }
            }
            
            // Update visibility state
            wasVisible.current = isVisible;
        };

        // Set up visibility change listener
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isPlayingSound, isMuted]);

    // Play notification sound continuously
    const playSound = useCallback(() => {
        if (isMuted) return;

        const playAudio = async () => {
            try {
                if (!audioRef.current) {
                    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
                }

                // Configure audio settings
                audioRef.current.currentTime = 0;
                audioRef.current.loop = true;
                
                // Show desktop notification if supported
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Pomodoro Timer', {
                        body: timerType === 'pomodoro' ? 'Time for a break!' : 'Break is over!',
                        icon: '/favicon.ico'
                    });
                }

                // Set state for visual feedback before attempting playback
                setIsPlayingSound(true);

                // Attempt to play using the primary audio element
                await audioRef.current.play();

                // Backup audio for redundancy
                if (!(window as Window).__pomodoroAudio) {
                    (window as Window).__pomodoroAudio = audioRef.current;
                }

                // Log success for debugging
                console.log("Notification sound playing successfully");

            } catch (error) {
                console.error("Initial audio playback failed:", error);
                
                // First recovery attempt - try reinitializing audio
                try {
                    const newAudio = new Audio(NOTIFICATION_SOUND_URL);
                    newAudio.loop = true;
                    await newAudio.play();
                    
                    // If successful, update references
                    audioRef.current = newAudio;
                    (window as Window).__pomodoroAudio = newAudio;
                    
                } catch (retryError) {
                    console.error("Retry audio playback failed:", retryError);
                    
                    // Second recovery attempt - try playing without loop
                    try {
                        const fallbackAudio = new Audio(NOTIFICATION_SOUND_URL);
                        await fallbackAudio.play();
                        
                        // Manually handle looping
                        fallbackAudio.addEventListener('ended', function() {
                            if (isPlayingSound && !isMuted) {
                                fallbackAudio.currentTime = 0;
                                fallbackAudio.play().catch(console.error);
                            }
                        });
                        
                        audioRef.current = fallbackAudio;
                        (window as Window).__pomodoroAudio = fallbackAudio;
                        
                    } catch (finalError) {
                        console.error("Final audio playback attempt failed:", finalError);
                        
                        // Show a more specific toast message
                        toast({
                            title: "Sound notifications blocked",
                            description: userInteractionOccurred 
                                ? "Please check your browser's audio settings"
                                : "Click anywhere to enable sound notifications",
                            duration: 5000
                        });
                    }
                }
            }
        };

        // Start playing and ensure visual feedback even if sound fails
        playAudio().catch(() => {
            setIsPlayingSound(true);
        });
    }, [isMuted, timerType, toast]);

    // Stop playing sound
    const stopSound = useCallback(() => {
        const cleanupAudio = (audio: HTMLAudioElement | null) => {
            if (!audio) return;
            
            try {
                // Remove any event listeners to prevent memory leaks
                audio.onended = null;
                audio.onerror = null;
                
                // Ensure audio is fully stopped
                audio.pause();
                audio.currentTime = 0;
                audio.loop = false;
                
                // Release media resources
                if (audio.src) {
                    const emptyBlob = new Blob([], { type: 'audio/mp3' });
                    audio.src = URL.createObjectURL(emptyBlob);
                    URL.revokeObjectURL(audio.src);
                }
            } catch (error) {
                console.error("Error cleaning up audio:", error);
            }
        };

        // Clean up both audio instances
        cleanupAudio(audioRef.current);
        cleanupAudio((window as Window).__pomodoroAudio);
        
        // Reset audio references
        audioRef.current = null;
        (window as Window).__pomodoroAudio = null;
        
        // Update state
        setIsPlayingSound(false);
    }, []);

    // Record completed pomodoro session
    const recordPomodoroSession = useCallback((duration: number) => {
        const now = new Date().toISOString();
        const newSession: StudySession = {
            date: now,
            duration: duration // Duration in seconds
        };
        
        setStudySessions(prevSessions => {
            const updatedSessions = [...prevSessions, newSession];
            try {
                localStorage.setItem('study-sessions', JSON.stringify(updatedSessions));
            } catch (error) {
                console.error("Failed to save study session:", error);
            }
            return updatedSessions;
        });
        
        // Convert duration to minutes and update user XP
        const minutes = Math.floor(duration / 60);
        if (minutes > 0) {
            // Pass true as the second parameter to indicate this is a completed Pomodoro session
            // This will trigger XP updates and achievement checks
            updateMinutesStudied(minutes, true);
            
            // Log to confirm the session was recorded (for debugging)
            console.log(`Recorded completed pomodoro session: ${minutes} minutes`);
        }
    }, [updateMinutesStudied]);

    // Handle timer completion
    const handleTimerComplete = useCallback(() => {
        // Play sound that will continue until user takes action
        playSound();

        // Set states for showing the completion dialog
        setIsTimerCompleted(true);
        
        // Show timer in navbar when completed
        setIsTimerVisibleInNavbar(true);

        // Determine next timer type
        let nextType: TimerType;

        if (timerType === 'pomodoro') {
            // Record completed pomodoro session when it's a pomodoro (not a break)
            // Fix: pass the initialTime instead of userSettings.pomodoro to avoid double counting
            recordPomodoroSession(initialTime);
            
            const newCount = completedPomodoros + 1;

            // After completing set number of pomodoros, take a long break
            if (newCount % userSettings.pomodorosUntilLongBreak === 0) {
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
    }, [completedPomodoros, timerType, playSound, userSettings, recordPomodoroSession, initialTime]);

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
                    nextDuration = userSettings.pomodoro;
                    // Reset the task in pomodoro counter when starting a new pomodoro session
                    resetTasksInPomodoro();
                    break;
                case 'shortBreak':
                    nextDuration = userSettings.shortBreak;
                    break;
                case 'longBreak':
                    nextDuration = userSettings.longBreak;
                    break;
            }

            // Set the timer and begin
            setTimer(nextDuration);
            setInitialTime(nextDuration);
            completionProcessed.current = false; // Reset flag for the new timer phase

            // Handle navigation first before changing timer state
            // If this is starting a break, navigate to the Pomodoro page
            if ((nextType === 'shortBreak' || nextType === 'longBreak') && location.pathname !== '/pomodoro') {
                // Store current path for later return
                setPreviousPagePath(location.pathname);
                
                // Perform navigation immediately
                navigate('/pomodoro');
                
                // Small delay to ensure navigation completes before state updates
                setTimeout(() => {
                    setIsRunning(true);
                    setNextTimerType(null);
                }, 50);
                
                return; // Exit early as we're handling state updates after navigation
            }
            // If we're starting a new pomodoro after a break and we have a previous page to return to
            else if (nextType === 'pomodoro' && location.pathname === '/pomodoro' && previousPagePath) {
                // Navigate back to the previous page
                navigate(previousPagePath);
                
                // Small delay to ensure navigation completes before state updates
                setTimeout(() => {
                    setIsRunning(true);
                    setNextTimerType(null);
                }, 50);
                
                return; // Exit early as we're handling state updates after navigation
            }
            
            // For cases where no navigation is needed
            setIsRunning(true);
            setNextTimerType(null);
        }
    }, [nextTimerType, stopSound, userSettings, navigate, location.pathname, setPreviousPagePath, resetTasksInPomodoro]);

    // Timer tick effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRunning && timer > 0) {
            // Reset flag when timer starts running (or resumes)
            completionProcessed.current = false;

            interval = setInterval(() => {
                setTimer(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(interval!);
                        // Check flag *before* calling handleTimerComplete
                        if (!completionProcessed.current) {
                            completionProcessed.current = true; // Set flag immediately
                            handleTimerComplete();
                        }
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
        if (type === timerType) return; // Don't do anything if it's the same type

        // Change the timer type
        setTimerType(type);

        // Always set the appropriate initial time for the selected timer type
        let newInitialTime;
        switch (type) {
            case 'pomodoro':
                newInitialTime = userSettings.pomodoro;
                // Reset the task in pomodoro counter when switching to a new pomodoro session
                resetTasksInPomodoro();
                break;
            case 'shortBreak':
                newInitialTime = userSettings.shortBreak;
                break;
            case 'longBreak':
                newInitialTime = userSettings.longBreak;
                break;
        }

        // Always update the initialTime to show the correct max value
        setInitialTime(newInitialTime);

        // Only reset the current time if not running
        if (!isRunning) {
            setTimer(newInitialTime);
            completionProcessed.current = false; // Reset flag if timer is reset
        }
    };

    // Toggle timer running state
    const toggleTimer = () => {
        const newIsRunning = !isRunning;
        setIsRunning(newIsRunning);
        
        // Show timer in navbar when running
        if (newIsRunning) {
            setIsTimerVisibleInNavbar(true);
            
            // If we're starting a new pomodoro session, reset the task counter
            if (timerType === 'pomodoro' && timer === initialTime) {
                resetTasksInPomodoro();
            }
        }
    };

    // Reset the current timer
    const resetTimer = () => {
        setIsRunning(false);
        completionProcessed.current = false; // Reset flag on manual reset
        switch (timerType) {
            case 'pomodoro':
                setTimer(userSettings.pomodoro);
                setInitialTime(userSettings.pomodoro);
                // Reset the task in pomodoro counter when manually resetting
                resetTasksInPomodoro();
                break;
            case 'shortBreak':
                setTimer(userSettings.shortBreak);
                setInitialTime(userSettings.shortBreak);
                break;
            case 'longBreak':
                setTimer(userSettings.longBreak);
                setInitialTime(userSettings.longBreak);
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
        audioRef,
        userSettings,
        updateUserSettings,
        isSettingsDialogOpen,
        setIsSettingsDialogOpen,
        setTimer,
        setInitialTime,
        // Streak tracking
        studyStreak,
        studySessions,
        isStreakDialogOpen,
        setIsStreakDialogOpen,
        totalStudyTimeToday,
        formatDuration,
        getFormattedDate,
        // Global state preservation
        previousPagePath,
        setPreviousPagePath,
        // Timer visibility in navbar
        isTimerVisibleInNavbar,
        setIsTimerVisibleInNavbar
    };

    return (
        <PomodoroContext.Provider value={value}>
            {children}
            {/* Include audio element with better cross-browser support */}
            <audio 
                ref={audioRef}
                src={NOTIFICATION_SOUND_URL}
                preload="auto"
                playsInline
            />

            {/* Timer completion dialog - now shows on any page */}
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

// Keep context export
export { PomodoroContext };
