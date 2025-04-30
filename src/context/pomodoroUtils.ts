// Default timer settings
export const DEFAULT_SETTINGS = {
    pomodoro: 25 * 60, // 25 minutes in seconds
    shortBreak: 5 * 60, // 5 minutes in seconds
    longBreak: 15 * 60, // 15 minutes in seconds
    pomodorosUntilLongBreak: 4
};

// Audio notification path
export const NOTIFICATION_SOUND_URL = '/notification.mp3';

// Background sound options
export const BACKGROUND_SOUNDS = [
    { id: 'none', name: 'None', path: '' },
    { id: 'ambient', name: 'Ambient Noise', path: '/AmbientNoise10min.MP3' },
    { id: 'rain', name: 'Rain', path: '/Rain10min.mp3' },
    { id: 'whitenoise', name: 'White Noise', path: '/whitenoise10min.MP3' },
    { id: 'ticking', name: 'Ticking Clock', path: '/Tickingclock10min.MP3' },
] as const; // Use "as const" for stricter typing

export type BackgroundSoundId = typeof BACKGROUND_SOUNDS[number]['id'];


// Session history interface
export interface StudySession {
    date: string; // ISO string format
    duration: number; // Duration in seconds
}

// Timer types
export type TimerType = 'pomodoro' | 'shortBreak' | 'longBreak';

// Format time as MM:SS
export const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Format duration as "X hr Y mins" or "Y mins"
export const formatDuration = (durationInSeconds: number): string => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours} hr${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min${minutes > 1 ? 's' : ''}` : ''}`;
    }
    return `${minutes} min${minutes > 1 ? 's' : ''}`;
};

// Get formatted date for display
export const getFormattedDate = (dateStr: string): string => {
    const sessionDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if the date is today
    if (sessionDate.toDateString() === today.toDateString()) {
        return "Today";
    }
    
    // Check if the date is yesterday
    if (sessionDate.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }
    
    // Format as "Apr 7" for other dates
    return sessionDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};