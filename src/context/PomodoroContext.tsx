import { useLocalStorage } from "@/hooks/use-local-storage"; // Import useLocalStorage
import { useToast } from "@/components/ui/use-toast";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { 
  BACKGROUND_SOUNDS,
  BackgroundSoundId,
  DEFAULT_SETTINGS, 
  NOTIFICATION_SOUND_URL, 
  StudySession, 
  TimerType, 
  formatDuration, 
  formatTime, 
  getFormattedDate 
} from "./pomodoroUtils";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";

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
    // Background Sound
    selectedSoundId: BackgroundSoundId;
    selectBackgroundSound: (soundId: BackgroundSoundId) => void;
    isBackgroundSoundPlaying: boolean; // Added to track background sound state
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

    // Refs for audio elements and timeouts
    const audioRef = useRef<HTMLAudioElement | null>(null); // For notification sound
    const backgroundAudioRef = useRef<HTMLAudioElement | null>(null); // For background sound
    const backgroundSoundTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout to stop background sound

    const { toast } = useToast();
    const completionProcessed = useRef(false); // Ref to prevent double completion processing
    const intervalRef = useRef<NodeJS.Timeout | null>(null); // Ref to store interval ID
    const startTimeRef = useRef<number | null>(null); // Ref to store the timestamp when the timer started/resumed
    const pauseTimeRef = useRef<number>(userSettings.pomodoro); // Ref to store remaining time when paused

    // State for background sound - Use localStorage
    const [selectedSoundId, setSelectedSoundId] = useLocalStorage<BackgroundSoundId>('pomodoro-background-sound', 'none');
    const [isBackgroundSoundPlaying, setIsBackgroundSoundPlaying] = useState(false);

    // Track the current page and store it if it's not the Pomodoro page
    useEffect(() => {
        if (location.pathname !== '/pomodoro') {
            setPreviousPagePath(location.pathname);
        }
    }, [location.pathname, setPreviousPagePath]);

    // Update document title based on timer state
    useEffect(() => {
        const originalTitle = "Pomodoro";
        
        if (isRunning) {
            const formattedTime = formatTime(timer);
            const prefix = timerType === 'pomodoro' ? '🎯 ' : '☕ ';
            document.title = `${prefix}${formattedTime} - Pomodoro`;
        } else if (isTimerCompleted) {
            document.title = `⏰ Timer Complete! - Pomodoro`;
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
                const diffTimeToday = Math.abs(today.getTime() - mostRecentDate.getTime());
                const diffDaysToday = Math.ceil(diffTimeToday / (1000 * 60 * 60 * 24));
                
                // If the most recent study day was not yesterday or today, break the streak
                if (diffDaysToday > 1) return 0;
            }
            
            // Count consecutive days
            for (let i = 0; i < uniqueDates.length - 1; i++) {
                const currentDate = new Date(uniqueDates[i]);
                const prevDate = new Date(uniqueDates[i + 1]);
                
                // Calculate the difference in days
                const diffTimeConsecutive = Math.abs(currentDate.getTime() - prevDate.getTime());
                const diffDaysConsecutive = Math.ceil(diffTimeConsecutive / (1000 * 60 * 60 * 24));
                
                // If the days are consecutive, increase the streak
                if (diffDaysConsecutive === 1) {
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

    // Stop background sound function
    const stopBackgroundSound = useCallback(() => {
        if (backgroundSoundTimeoutRef.current) {
            clearTimeout(backgroundSoundTimeoutRef.current);
            backgroundSoundTimeoutRef.current = null;
        }
        if (backgroundAudioRef.current) {
            backgroundAudioRef.current.pause();
            backgroundAudioRef.current.currentTime = 0;
            // Optional: Detach src to release resources sooner
            // backgroundAudioRef.current.src = ''; 
        }
        setIsBackgroundSoundPlaying(false);
    }, []);

    // Play background sound function
    const playBackgroundSound = useCallback((soundIdOverride?: BackgroundSoundId) => {
        const currentSoundId = soundIdOverride ?? selectedSoundId;

        // --- REVISED CONDITION ---
        // Only play during pomodoro and if not muted and a sound is selected.
        // The check for isRunning is removed as the callers handle this.
        if (timerType !== 'pomodoro' || isMuted || currentSoundId === 'none') { 
            stopBackgroundSound(); // Ensure it's stopped if conditions aren't met
            return;
        }
        // --- END REVISED CONDITION ---


        const sound = BACKGROUND_SOUNDS.find(s => s.id === currentSoundId);
        if (!sound || !sound.path) {
            stopBackgroundSound();
            return;
        }

        // Ensure previous sound is stopped before starting a new one or resuming
        stopBackgroundSound();

        try {
            if (!backgroundAudioRef.current) {
                backgroundAudioRef.current = new Audio();
            }
            
            backgroundAudioRef.current.src = sound.path;
            backgroundAudioRef.current.loop = true;
            backgroundAudioRef.current.play().then(() => {
                setIsBackgroundSoundPlaying(true);
                
                // Set timeout to stop the sound exactly when the timer should end
                // Use a ref to get the most current timer value if needed, or rely on closure
                const remainingDurationMs = timer * 1000; 
                if (remainingDurationMs > 0) {
                    backgroundSoundTimeoutRef.current = setTimeout(() => {
                        stopBackgroundSound();
                    }, remainingDurationMs);
                } else {
                    stopBackgroundSound(); // Stop immediately if timer is already 0?
                }
            }).catch(error => {
                console.error("Failed to play background sound:", error);
                stopBackgroundSound();
                toast({
                    title: "Background Sound Error",
                    description: "Could not play the selected background sound.",
                    variant: "destructive",
                });
            });
        } catch (error) {
            console.error("Error setting up background audio:", error);
            stopBackgroundSound();
        }

    }, [selectedSoundId, timerType, isMuted, timer, stopBackgroundSound, toast]); // Removed isRunning dependency

    // Select background sound function
    const selectBackgroundSound = useCallback((soundId: BackgroundSoundId) => {
        stopBackgroundSound(); // Stop current sound when changing selection
        setSelectedSoundId(soundId); // This now uses the setter from useLocalStorage
        // If the timer is currently running and it's a pomodoro, start the new sound
        if (isRunning && timerType === 'pomodoro' && soundId !== 'none') {
             playBackgroundSound(soundId); // Pass the new soundId directly
        }
    }, [stopBackgroundSound, isRunning, timerType, playBackgroundSound, setSelectedSoundId]); // Added setSelectedSoundId dependency


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
    }, [updateMinutesStudied]);

    // Handle timer completion
    const handleTimerComplete = useCallback(() => {
        // Play sound that will continue until user takes action
        playSound();
        stopBackgroundSound(); // Stop background sound when timer completes

        // Set states for showing the completion dialog
        setIsTimerCompleted(true);
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
    }, [completedPomodoros, timerType, playSound, userSettings, recordPomodoroSession, initialTime, stopBackgroundSound]);

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
        stopBackgroundSound(); // Stop background sound when changing type manually

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

    }, [isRunning, userSettings, stopSound, resetTasksInPomodoro, stopBackgroundSound]);

    // Handle starting the next timer phase
    const handleStartNextPhase = useCallback(() => {
        // Stop the alarm sound
        stopSound();
        stopBackgroundSound(); // Ensure background sound is stopped before starting next phase
        setIsTimerCompleted(false);

        if (nextTimerType) {
            const nextType = nextTimerType;
            setTimerType(nextType);

            // Set the appropriate time for the next phase
            let nextDuration: number;
            switch (nextType) {
                case 'pomodoro':
                    nextDuration = userSettings.pomodoro;
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

            // Handle navigation first before changing timer state
            // If this is starting a break, navigate to the Pomodoro page
            const startTimer = () => {
                startTimeRef.current = Date.now(); // Set start time *just before* running
                setIsRunning(true);
                setNextTimerType(null);
                // --- ADDED: Start background sound if starting a pomodoro ---
                if (nextType === 'pomodoro') {
                    playBackgroundSound(); // Will check internally if a sound is selected
                }
                // --- END ADDED ---
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
    }, [nextTimerType, stopSound, userSettings, navigate, location.pathname, setPreviousPagePath, resetTasksInPomodoro, stopBackgroundSound, playBackgroundSound]); // Added playBackgroundSound dependency back

    // Timer tick effect - uses Date.now() for accuracy
    useEffect(() => {
        if (isRunning) {
            // If startTimeRef is not set, initialize it (handles resuming)
            if (startTimeRef.current === null) {
                startTimeRef.current = Date.now();
                // Ensure pauseTimeRef holds the correct starting value for this run
                // pauseTimeRef.current = timer; // This is set correctly in toggleTimer/handleStartNextPhase
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
    }, [isRunning, handleTimerComplete, timer]); // Added 'timer' to dependencies to satisfy lint rule

    // Toggle timer running state
    const toggleTimer = () => {
        const newIsRunning = !isRunning;

        if (newIsRunning) {
            // Starting the timer
            setIsTimerVisibleInNavbar(true);
            // Set start time and ensure pauseTimeRef has the current timer value
            startTimeRef.current = Date.now();
            pauseTimeRef.current = timer; // Store the time we are starting *from*

            if (timerType === 'pomodoro' && timer === initialTime) {
                resetTasksInPomodoro();
            }
            // Start background sound if starting a pomodoro
            if (timerType === 'pomodoro') {
                playBackgroundSound(); // Will check internally if a sound is selected
            }
        } else {
            // Pausing the timer
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            pauseTimeRef.current = timer; // Store remaining time when pausing
            stopBackgroundSound(); // Stop background sound on pause
        }

        setIsRunning(newIsRunning);
    };

    // Reset the current timer
    const resetTimer = () => {
        setIsRunning(false); // Stop the timer
        completionProcessed.current = false; // Reset flag on manual reset
        startTimeRef.current = null; // Reset start time ref
        if (intervalRef.current) { // Clear any active interval
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        stopBackgroundSound(); // Stop background sound on reset

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
    };

    // Toggle mute state
    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        // If unmuting and a background sound should be playing (running pomodoro), start it
        if (!newMutedState && isRunning && timerType === 'pomodoro' && selectedSoundId !== 'none') {
            playBackgroundSound();
        } else {
            // If muting, stop the background sound
            stopBackgroundSound();
        }
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
        setIsTimerVisibleInNavbar,
        // Background Sound
        selectedSoundId,
        selectBackgroundSound,
        isBackgroundSoundPlaying // Pass state if needed by UI
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
