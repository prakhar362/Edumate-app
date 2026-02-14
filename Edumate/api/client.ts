import axios from "axios";
import * as SecureStore from "expo-secure-store";

const client = axios.create({
  baseURL: "https://edumate-app-d10b.onrender.com",
  timeout: 150000,
});

client.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("SecureStore error:", err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default client;
