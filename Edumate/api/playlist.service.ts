import { create } from "zustand";
import client from "./client";

export const PlaylistAPI = {
  getPlayLists: async () => {
    console.log("API getPlayLists called");
    return client.get("/api/playlists");
  },

  createPlaylist: async (title: string, description: string) => {
    console.log("API createPlaylist called with title:", title);
    return client.post("/api/playlists", { title, description });
  },

  // In api/playlist.service.ts

  uploadItem: async (playlistId: string, formData: FormData) => {
    console.log("API uploadItem called for playlist:", playlistId);

    // Since formData is already built in the component, we just pass it through.
    // Note: 'multipart/form-data' header is crucial for file uploads.
    return client.post(`/api/playlists/${playlistId}/upload-item`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  addItem: async (playlistId: string, itemData: {
    name: string;
    summary_id: string;
    quiz_id: string;
    pdf_url: string;
    audio_path: string;
  }) => {
    console.log(`Adding item to playlist ${playlistId}`, itemData);
    return client.post(`/api/playlists/${playlistId}/items`, itemData);
  }

}
