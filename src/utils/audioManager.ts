/**
 * Robust Audio Manager for Pomodoro Timer
 * Handles browser autoplay policies and audio context management
 */

export class AudioManager {
    private static instance: AudioManager;
    private audioContext: AudioContext | null = null;
    private unlocked = false;
    private userInteractionOccurred = false;

    private constructor() {
        this.initializeAudioContext();
        this.setupUserInteractionListeners();
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }    private initializeAudioContext(): void {
        try {
            // Create AudioContext only when needed
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            // Handle suspended audio context
            if (this.audioContext.state === 'suspended') {
                // Don't try to resume immediately, wait for user interaction
                console.log('AudioContext created in suspended state, waiting for user interaction');
            }
        } catch (error) {
            console.warn('AudioContext not supported:', error);
        }
    }

    private setupUserInteractionListeners(): void {
        const unlockAudio = async () => {
            if (this.unlocked || !this.audioContext) return;

            try {
                // Resume AudioContext if suspended
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }

                // Create and play a silent audio to unlock
                const buffer = this.audioContext.createBuffer(1, 1, 22050);
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioContext.destination);
                source.start(0);

                this.unlocked = true;
                this.userInteractionOccurred = true;
                console.log('Audio context unlocked successfully');

                // Remove listeners after unlocking
                this.removeUserInteractionListeners();
            } catch (error) {
                console.warn('Failed to unlock audio context:', error);
            }
        };

        // Add multiple interaction listeners
        ['click', 'touchstart', 'keydown', 'mousedown'].forEach(event => {
            document.addEventListener(event, unlockAudio, { once: true, passive: true });
        });
    }

    private removeUserInteractionListeners(): void {
        // This is automatically handled by { once: true } option
    }

    public async createAudioElement(src: string): Promise<HTMLAudioElement> {
        const audio = new Audio();
        
        // Set up audio element
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        
        // Wait for user interaction if needed
        if (!this.userInteractionOccurred) {
            console.warn('Audio requires user interaction. Please click anywhere to enable audio.');
        }

        return new Promise((resolve, reject) => {
            const handleCanPlay = () => {
                audio.removeEventListener('canplaythrough', handleCanPlay);
                audio.removeEventListener('error', handleError);
                resolve(audio);
            };

            const handleError = (error: Event) => {
                audio.removeEventListener('canplaythrough', handleCanPlay);
                audio.removeEventListener('error', handleError);
                reject(new Error(`Failed to load audio: ${src}`));
            };

            audio.addEventListener('canplaythrough', handleCanPlay);
            audio.addEventListener('error', handleError);

            // Set source last to start loading
            audio.src = src;
        });
    }

    public async playAudio(audio: HTMLAudioElement): Promise<void> {
        try {
            // Ensure audio context is resumed
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Check if user interaction occurred
            if (!this.userInteractionOccurred) {
                throw new Error('User interaction required for audio playback');
            }

            await audio.play();
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    throw new Error('Audio playback blocked by browser. Please interact with the page first.');
                } else if (error.name === 'NotSupportedError') {
                    throw new Error('Audio format not supported by browser.');
                } else {
                    throw error;
                }
            }
            throw error;
        }
    }

    public stopAudio(audio: HTMLAudioElement): void {
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch (error) {
            console.warn('Error stopping audio:', error);
        }
    }

    public isUnlocked(): boolean {
        return this.unlocked && this.userInteractionOccurred;
    }

    public getUserInteractionStatus(): boolean {
        return this.userInteractionOccurred;
    }

    public cleanup(): void {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.unlocked = false;
        this.userInteractionOccurred = false;
    }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();
