// Sound configuration for Pomodoro timer

export const NOTIFICATION_SOUND = '/sounds/notification.mp3';

export const BACKGROUND_SOUNDS = [
  { id: 'none', name: 'None', path: '' },
  { id: 'ambient', name: 'Ambient Noise', path: '/sounds/AmbientNoise10min.MP3' },
  { id: 'rain', name: 'Rain', path: '/sounds/Rain10min.mp3' },
  { id: 'whitenoise', name: 'White Noise', path: '/sounds/whitenoise10min.MP3' },
  { id: 'ticking', name: 'Ticking Clock', path: '/sounds/Tickingclock10min.MP3' },
] as const;

export type BackgroundSoundId = typeof BACKGROUND_SOUNDS[number]['id'];

// localStorage keys
export const STORAGE_KEYS = {
  NOTIFICATION_VOLUME: 'pomodoro-notification-volume',
  BACKGROUND_VOLUME: 'pomodoro-background-volume',
  BACKGROUND_SOUND: 'pomodoro-background-sound',
} as const;

// Default volumes (0-1)
export const DEFAULT_NOTIFICATION_VOLUME = 0.7;
export const DEFAULT_BACKGROUND_VOLUME = 0.3;
export const DEFAULT_BACKGROUND_SOUND: BackgroundSoundId = 'none';
