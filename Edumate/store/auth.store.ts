import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authAPI } from "@/api/auth.service";

type AuthState = {
  user: any;
  token: string | null;
  loading: boolean;
  hydrated: boolean;  
  googleLogin: (idToken: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  hydrated: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await authAPI.login(email, password);
      console.log("Login response:", res.data); // Debugging line
      const { access_token, user } = res.data;

      await SecureStore.setItemAsync("token", access_token);

      set({ user, token: access_token, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    set({ user: null, token: null });
  },

  signup: async (name, email, password) => {  
    set({ loading: true });
    try {
      const res=await authAPI.register(name, email, password);  
      console.log("Signup response:", res.data);
      const { access_token, user } = res.data;
      await SecureStore.setItemAsync("token", access_token);
      
      set({ user, token: access_token, loading: false });
    }

    catch (err) {
      set({ loading: false });
      throw err;
    }
  },


  googleLogin: async (idToken) => {
  set({ loading: true });

  try {
    const res = await authAPI.googleLogin(idToken);
    const { access_token, user } = res.data;

    await SecureStore.setItemAsync("token", access_token);

    set({
      user,
      token: access_token,
      loading: false,
    });
  } catch (err) {
    set({ loading: false });
    throw err;
  }
},


hydrate: async () => {
  const token = await SecureStore.getItemAsync("token");

  if (!token) {
    set({ hydrated: true });
    return;
  }

  try {
    const res = await authAPI.me();
    set({
      token,
      user: res.data,
      hydrated: true,
    });
  } catch (e) {
    await SecureStore.deleteItemAsync("token");
    set({ token: null, user: null, hydrated: true });
  }
},
}));
