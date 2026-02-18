import { create } from 'zustand';
import { Audio } from 'expo-av';

interface Track {
    id: string;
    title: string;
    subtitle?: string;
    audioUrl: string;
    img?: string; // Optional image URL
}

interface PlayerState {
    sound: Audio.Sound | null;
    isPlaying: boolean;
    currentTrack: Track | null;
    position: number;
    duration: number;

    // Actions
    loadTrack: (track: Track) => Promise<void>;
    togglePlayPause: () => Promise<void>;
    seekBy: (seconds: number) => Promise<void>;
    unload: () => Promise<void>;
    setPosition: (millis: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    sound: null,
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 1, // Avoid divide by zero

    loadTrack: async (track) => {
        const { sound: oldSound } = get();
        if (oldSound) {
            await oldSound.unloadAsync();
        }

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: track.audioUrl },
                { shouldPlay: true },
                (status) => {
                    if (status.isLoaded) {
                        set({
                            position: status.positionMillis,
                            duration: status.durationMillis || 1,
                            isPlaying: status.isPlaying,
                        });
                        // Auto-cleanup if finished
                        if (status.didJustFinish) {
                            set({ isPlaying: false, position: 0 });
                        }
                    }
                }
            );

            set({ sound: newSound, currentTrack: track, isPlaying: true });
        } catch (error) {
            console.error("Error loading track", error);
        }
    },

    togglePlayPause: async () => {
        const { sound, isPlaying } = get();
        if (!sound) return;

        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.playAsync();
        }
    },

    seekBy: async (seconds) => {
        const { sound, position, duration } = get();
        if (!sound) return;

        const newPosition = position + (seconds * 1000);
        const finalPosition = Math.max(0, Math.min(newPosition, duration));
        await sound.setPositionAsync(finalPosition);
    },

    unload: async () => {
        const { sound } = get();
        if (sound) await sound.unloadAsync();
        set({ sound: null, currentTrack: null, isPlaying: false });
    },

    setPosition: (millis) => set({ position: millis }),
}));