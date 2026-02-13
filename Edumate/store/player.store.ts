import { create } from "zustand";

type PlayerState = {
  currentSummaryId: string | null;
  isPlaying: boolean;

  play: (summaryId: string) => void;
  pause: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSummaryId: null,
  isPlaying: false,

  play: (id) => set({ currentSummaryId: id, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
}));
