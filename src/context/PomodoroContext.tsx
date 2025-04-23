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

// Active study session tracking interface
interface ActiveStudySession {
  startTime: number; // Timestamp when session started
  accumulatedTime: number; // Previously accumulated time in seconds
  timerType: TimerType;
  lastUpdateTime: number; // Last time the session was updated
}

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

    // Load active session from localStorage
    const loadActiveSession = (): ActiveStudySession | null => {
        try {
            const activeSession = localStorage.getItem('active-study-session');
            if (activeSession) {
                return JSON.parse(activeSession);
            }
        } catch (error) {
            console.error("Failed to load active study session:", error);
        }
        return null;
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
    
    // Active study session state
    const [activeStudySession, setActiveStudySession] = useState<ActiveStudySession | null>(loadActiveSession);
    
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
    const intervalRef = useRef<NodeJS.Timeout | null>(null); // Ref to store interval ID
    const startTimeRef = useRef<number | null>(null); // Ref to store the timestamp when the timer started/resumed
    const pauseTimeRef = useRef<number>(userSettings.pomodoro); // Ref to store remaining time when paused
    
    // Ref to store the last time we saved study progress
    const lastSavedProgressRef = useRef<number>(Date.now());

    // Log study session data to history
    const logStudyTimeToHistory = useCallback((duration: number) => {
        if (duration <= 0 || timerType !== 'pomodoro') return;
        
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
            // Don't pass the isPomodoroSession flag since this is incremental tracking
            updateMinutesStudied(minutes, false);
            
            // Log to confirm the session was recorded (for debugging)
            console.log(`Recorded incremental study session: ${minutes} minutes`);
        }
    }, [timerType, updateMinutesStudied]);

    // Restore active session from localStorage on mount
    useEffect(() => {
        if (activeStudySession && activeStudySession.timerType === 'pomodoro') {
            // Only restore pomodoro sessions, not breaks
            if (Date.now() - activeStudySession.lastUpdateTime < 24 * 60 * 60 * 1000) { // Within 24 hours
                // Calculate the elapsed time since last update
                const elapsedSinceLastUpdate = Math.floor((Date.now() - activeStudySession.lastUpdateTime) / 1000);
                
                // Only log the accumulated time, don't try to resume the timer
                if (activeStudySession.accumulatedTime > 0) {
                    // Log the accumulated time to study history
                    logStudyTimeToHistory(activeStudySession.accumulatedTime);
                    console.log(`Restored and logged ${formatDuration(activeStudySession.accumulatedTime)} from previous session`);
                    
                    // Clear the active session since we've logged it
                    setActiveStudySession(null);
                    localStorage.removeItem('active-study-session');
                }
            } else {
                // Session is too old, discard it
                setActiveStudySession(null);
                localStorage.removeItem('active-study-session');
            }
        }
    }, [activeStudySession, logStudyTimeToHistory]);

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

    // Save active study session to localStorage when it changes
    useEffect(() => {
        if (activeStudySession) {
            try {
                localStorage.setItem('active-study-session', JSON.stringify(activeStudySession));
            } catch (error) {
                console.error("Failed to save active study session:", error);
            }
        } else {
            localStorage.removeItem('active-study-session');
        }
    }, [activeStudySession]);

    // Periodically log accumulated study time while timer is running
    useEffect(() => {
        if (isRunning && timerType === 'pomodoro') {
            const updateInterval = setInterval(() => {
                // Record accumulated time every 30 seconds
                const now = Date.now();
                if (now - lastSavedProgressRef.current >= 30000 && startTimeRef.current) {
                    const elapsedSinceLastSave = Math.floor((now - lastSavedProgressRef.current) / 1000);
                    
                    // Update active study session
                    setActiveStudySession(prev => {
                        if (!prev) {
                            return {
                                startTime: startTimeRef.current || now,
                                accumulatedTime: elapsedSinceLastSave,
                                timerType: timerType,
                                lastUpdateTime: now
                            };
                        }
                        
                        return {
                            ...prev,
                            accumulatedTime: prev.accumulatedTime + elapsedSinceLastSave,
                            lastUpdateTime: now
                        };
                    });
                    
                    // Update the ref to current time
                    lastSavedProgressRef.current = now;
                }
            }, 10000); // Check every 10 seconds
            
            return () => {
                clearInterval(updateInterval);
            };
        }
    }, [isRunning, timerType]);

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
            
            // If the tab becomes invisible/visible, and we're in a pomodoro timer, update the active session
            if (isRunning && timerType === 'pomodoro' && wasVisible.current !== isVisible) {
                const now = Date.now();
                
                if (!isVisible) {
                    // Tab is becoming hidden - update last saved progress time
                    lastSavedProgressRef.current = now;
                } else {
                    // Tab is becoming visible again
                    if (startTimeRef.current) {
                        // Update active study session with accumulated time while away
                        setActiveStudySession(prev => {
                            if (!prev) {
                                return {
                                    startTime: startTimeRef.current || now,
                                    accumulatedTime: 0, // Will be updated on next interval
                                    timerType: timerType,
                                    lastUpdateTime: now
                                };
                            }
                            
                            return {
                                ...prev,
                                lastUpdateTime: now
                            };
                        });
                    }
                    
                    // Reset the last saved progress time
                    lastSavedProgressRef.current = now;
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
    }, [isPlayingSound, isMuted, isRunning, timerType]);

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
    }, [isMuted, timerType, toast, isPlayingSound]);

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
        
        // Clear any active study session
        setActiveStudySession(null);
    }, [updateMinutesStudied]);

    // Handle timer completion
    const handleTimerComplete = useCallback(() => {
        // Log any accumulated study time from active session
        if (timerType === 'pomodoro' && activeStudySession) {
            // Include the full pomodoro time in the record
            recordPomodoroSession(initialTime);
        }
        
        // Play sound that will continue until user takes action
        playSound();

        // Set states for showing the completion dialog
        setIsTimerCompleted(true);
        
        // Show timer in navbar when completed
        setIsTimerVisibleInNavbar(true);

        // Determine next timer type
        let nextType: TimerType;

        if (timerType === 'pomodoro') {
            // Update completed pomodoros count
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
    }, [completedPomodoros, timerType, playSound, userSettings, recordPomodoroSession, initialTime, activeStudySession]);

    // Handle timer type change
    const handleTimerTypeChange = useCallback((type: TimerType) => {
        // Stop the timer if it's running
        if (isRunning) {
            setIsRunning(false);
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // If switching from pomodoro and we have active session data, save it
        if (timerType === 'pomodoro' && type !== 'pomodoro' && activeStudySession) {
            // Calculate elapsed time and log it
            const now = Date.now();
            const elapsedTime = activeStudySession.accumulatedTime;
            
            if (elapsedTime > 0) {
                logStudyTimeToHistory(elapsedTime);
            }
            
            // Clear the active session
            setActiveStudySession(null);
        }

        // Change the timer type
        setTimerType(type);

        // Always set the appropriate initial time for the selected timer type
        let newInitialTime;
        switch (type) {
            case 'pomodoro':
                newInitialTime = userSettings.pomodoro;
                resetTasksInPomodoro(); // Reset tasks when switching to pomodoro
                break;
            case 'shortBreak':
                newInitialTime = userSettings.shortBreak;
                break;
            case 'longBreak':
                newInitialTime = userSettings.longBreak;
                break;
        }

        // Reset the timer to the new initial time
        setTimer(newInitialTime);
        setInitialTime(newInitialTime);
        pauseTimeRef.current = newInitialTime; // Update pause ref
        completionProcessed.current = false; // Reset completion flag
        startTimeRef.current = null; // Reset start time
        setIsTimerCompleted(false); // Ensure completion dialog is closed
        stopSound(); // Stop any completion sound

        // Reset progress tracking time if starting pomodoro
        if (type === 'pomodoro') {
            lastSavedProgressRef.current = Date.now();
        }
    }, [isRunning, userSettings, stopSound, resetTasksInPomodoro, timerType, activeStudySession, logStudyTimeToHistory]);

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
            pauseTimeRef.current = nextDuration; // Set pause time for the new phase
            completionProcessed.current = false; // Reset flag for the new timer phase
            startTimeRef.current = null; // Ensure start time is reset before potentially setting isRunning

            // Reset progress tracking time if starting pomodoro
            if (nextType === 'pomodoro') {
                lastSavedProgressRef.current = Date.now();
            }

            // Handle navigation first before changing timer state
            // If this is starting a break, navigate to the Pomodoro page
            const startTimer = () => {
                startTimeRef.current = Date.now(); // Set start time *just before* running
                setIsRunning(true);
                setNextTimerType(null);
            };

            if ((nextType === 'shortBreak' || nextType === 'longBreak') && location.pathname !== '/pomodoro') {
                setPreviousPagePath(location.pathname);
                navigate('/pomodoro');
                setTimeout(startTimer, 50); // Start timer after navigation
                return;
            }
            else if (nextType === 'pomodoro' && location.pathname === '/pomodoro' && previousPagePath) {
                navigate(previousPagePath);
                setTimeout(startTimer, 50); // Start timer after navigation
                return;
            }

            // Start immediately if no navigation
            startTimer();
        }
    }, [nextTimerType, stopSound, userSettings, navigate, location.pathname, setPreviousPagePath, resetTasksInPomodoro]);

    // Timer tick effect - uses Date.now() for accuracy
    useEffect(() => {
        if (isRunning) {
            // If startTimeRef is not set, initialize it (handles resuming)
            if (startTimeRef.current === null) {
                startTimeRef.current = Date.now();
                
                // Initialize or update the active study session for pomodoros
                if (timerType === 'pomodoro') {
                    setActiveStudySession(prev => {
                        if (!prev) {
                            return {
                                startTime: Date.now(),
                                accumulatedTime: 0,
                                timerType: timerType,
                                lastUpdateTime: Date.now()
                            };
                        }
                        
                        // If we already have an active session, update it
                        return {
                            ...prev,
                            lastUpdateTime: Date.now()
                        };
                    });
                    
                    // Reset progress tracking time
                    lastSavedProgressRef.current = Date.now();
                }
            }

            // Clear any existing interval before starting a new one
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(() => {
                if (!startTimeRef.current) return; // Should not happen if isRunning is true, but safety check

                const elapsed = Date.now() - startTimeRef.current; // Elapsed time since start/resume
                // Calculate remaining based on initial pause time (stored in pauseTimeRef) and total elapsed
                const remainingTime = pauseTimeRef.current - Math.floor(elapsed / 1000);

                if (remainingTime <= 0) {
                    setTimer(0);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    startTimeRef.current = null; // Reset start time

                    if (!completionProcessed.current) {
                        completionProcessed.current = true;
                        handleTimerComplete();
                    }
                } else {
                    // Use functional update to avoid direct dependency on 'timer' state if possible,
                    // but direct set is okay here as calculation is based on refs and Date.now()
                    setTimer(remainingTime);
                }
            }, 250); // Check more frequently for better responsiveness

        } else {
            // Timer is being paused - log accumulated time for pomodoros
            if (timerType === 'pomodoro' && startTimeRef.current !== null) {
                const now = Date.now();
                const elapsedSincePause = Math.floor((now - (startTimeRef.current || now)) / 1000);
                
                // Update active study session with the time accumulated until pause
                setActiveStudySession(prev => {
                    if (!prev) {
                        return {
                            startTime: startTimeRef.current || now,
                            accumulatedTime: elapsedSincePause,
                            timerType: timerType,
                            lastUpdateTime: now
                        };
                    }
                    
                    return {
                        ...prev,
                        accumulatedTime: prev.accumulatedTime + elapsedSincePause,
                        lastUpdateTime: now
                    };
                });
                
                // Update the progress tracking time
                lastSavedProgressRef.current = now;
            }
            
            // Clear interval when paused or stopped
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            // DO NOT reset startTimeRef here when pausing, it's needed for resuming accurately.
            // pauseTimeRef is updated in toggleTimer.
        }

        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, handleTimerComplete, timerType]); // Removed 'timer' from dependencies since we don't use it directly

    // Toggle timer running state
    const toggleTimer = () => {
        const newIsRunning = !isRunning;

        if (newIsRunning) {
            // Starting the timer
            setIsTimerVisibleInNavbar(true);
            // Set start time and ensure pauseTimeRef has the current timer value
            startTimeRef.current = Date.now();
            pauseTimeRef.current = timer; // Store the time we are starting *from*

            if (timerType === 'pomodoro') {
                if (timer === initialTime) {
                    resetTasksInPomodoro();
                }
                
                // Initialize or reset active session tracking
                lastSavedProgressRef.current = Date.now();
                
                // Initialize the active study session if starting from beginning
                if (timer === initialTime) {
                    setActiveStudySession({
                        startTime: Date.now(),
                        accumulatedTime: 0,
                        timerType: 'pomodoro',
                        lastUpdateTime: Date.now()
                    });
                }
            }
        } else {
            // Pausing the timer - handled in the timer tick effect
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            pauseTimeRef.current = timer; // Store remaining time when pausing
        }

        setIsRunning(newIsRunning);
    };

    // Reset the current timer
    const resetTimer = () => {
        // If this is a pomodoro timer and we have accumulated time, log it before resetting
        if (timerType === 'pomodoro' && activeStudySession && activeStudySession.accumulatedTime > 0) {
            logStudyTimeToHistory(activeStudySession.accumulatedTime);
            
            // Clear active session since we've logged it
            setActiveStudySession(null);
        }
        
        setIsRunning(false); // Stop the timer
        completionProcessed.current = false; // Reset flag on manual reset
        startTimeRef.current = null; // Reset start time ref
        if (intervalRef.current) { // Clear any active interval
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        let newInitialTime;
        switch (timerType) {
            case 'pomodoro':
                newInitialTime = userSettings.pomodoro;
                resetTasksInPomodoro();
                break;
            case 'shortBreak':
                newInitialTime = userSettings.shortBreak;
                break;
            case 'longBreak':
                newInitialTime = userSettings.longBreak;
                break;
        }
        setTimer(newInitialTime);
        setInitialTime(newInitialTime);
        pauseTimeRef.current = newInitialTime; // Reset pause time ref
        
        // Reset progress tracking time if it's a pomodoro
        if (timerType === 'pomodoro') {
            lastSavedProgressRef.current = Date.now();
        }
    };

    // Before unloading the page, save any active pomodoro session
    useEffect(() => {
        const handleBeforeUnload = () => {
            // If we have an active pomodoro session that's running, save it
            if (isRunning && timerType === 'pomodoro' && startTimeRef.current) {
                const now = Date.now();
                const elapsedSinceLastUpdate = Math.floor((now - (lastSavedProgressRef.current || now)) / 1000);
                
                // Update the active session in localStorage directly (since state update won't complete before unload)
                if (activeStudySession) {
                    const updatedSession = {
                        ...activeStudySession,
                        accumulatedTime: activeStudySession.accumulatedTime + elapsedSinceLastUpdate,
                        lastUpdateTime: now
                    };
                    
                    localStorage.setItem('active-study-session', JSON.stringify(updatedSession));
                } else {
                    const newSession = {
                        startTime: startTimeRef.current,
                        accumulatedTime: elapsedSinceLastUpdate,
                        timerType: 'pomodoro',
                        lastUpdateTime: now
                    };
                    
                    localStorage.setItem('active-study-session', JSON.stringify(newSession));
                }
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isRunning, timerType, activeStudySession]);

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
        handleTimerTypeChange, // Ensure it's included here
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
