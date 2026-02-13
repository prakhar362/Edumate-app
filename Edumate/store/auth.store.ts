import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import api from "../api/client";

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { access_token } = res.data;

      await SecureStore.setItemAsync("token", access_token);

      set({ token: access_token });
      await useAuthStore.getState().fetchMe();
    } finally {
      set({ loading: false });
    }
  },

  googleLogin: async (idToken) => {
    set({ loading: true });
    try {
      const res = await api.post("/api/auth/google", {
        token: idToken,
      });

      const { access_token } = res.data;

      await SecureStore.setItemAsync("token", access_token);
      set({ token: access_token });
      await useAuthStore.getState().fetchMe();
    } finally {
      set({ loading: false });
    }
  },

  fetchMe: async () => {
    const res = await api.get("/api/auth/me");
    set({ user: res.data });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    set({ user: null, token: null });
  },
}));
