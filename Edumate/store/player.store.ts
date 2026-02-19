// store/player.store.ts
import { create } from 'zustand';
import { Audio } from 'expo-av';

interface Track {
    id: string;
    title: string;
    subtitle?: string;
    audioUrl: string;
}

interface PlayerState {
    sound: Audio.Sound | null;
    isPlaying: boolean;
    currentTrack: Track | null;
    position: number;
    duration: number;

    loadTrack: (track: Track) => Promise<void>;
    togglePlayPause: () => Promise<void>;
    seekBy: (seconds: number) => Promise<void>;
    seekTo: (millis: number) => Promise<void>; // <-- Added this
    unload: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    sound: null,
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 1,

    loadTrack: async (track) => {
        const { sound: oldSound } = get();
        if (oldSound) await oldSound.unloadAsync();

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
                        if (status.didJustFinish) set({ isPlaying: false, position: 0 });
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
        isPlaying ? await sound.pauseAsync() : await sound.playAsync();
    },

    seekBy: async (seconds) => {
        const { sound, position, duration } = get();
        if (!sound) return;
        const newPosition = position + (seconds * 1000);
        await sound.setPositionAsync(Math.max(0, Math.min(newPosition, duration)));
    },

    seekTo: async (millis) => {
        const { sound } = get();
        if (sound) await sound.setPositionAsync(millis);
    },

    unload: async () => {
        const { sound } = get();
        if (sound) await sound.unloadAsync();
        set({ sound: null, currentTrack: null, isPlaying: false, position: 0 });
    },
}));