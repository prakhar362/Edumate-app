import client from "./client";

export const authAPI = {
  login: async (email: string, password: string) => {
    console.log("API login called", email);
    return client.post("/api/auth/login", { email, password });
  },

  register: async (name: string, email: string, password: string) => {
    console.log("API register called", { email, name, password });
    return client.post("/api/auth/register", { name, email, password });
  },

  me: (token: string) =>
    client.get("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  editProfile: async (name: string, email: string, password: string, picture: string) => {
    const formData = new FormData();

    if (name) formData.append("name", name);
    if (email) formData.append("email", email);
    if (password) formData.append("password", password);
    if (picture) formData.append("picture", picture);

    return client.put("/api/auth/edit-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },


  googleLogin: (idToken: string) =>
    client.post("/api/auth/google", { id_token: idToken }),

  forgotPassword: async (email: string) => {
    console.log("API forgotPassword called", email);
    return client.post("/api/auth/forgot-password", { email });
  },

  verifyOTP: async (email: string, otp: string) => {
    console.log("API verifyOTP called", email);
    return client.post("/api/auth/verify-otp", { email, otp });
  },

  resetPassword: async (email: string, newPassword: string) => {
    console.log("API resetPassword called", email);
    return client.post("/api/auth/reset-password", {
      email,
      new_password: newPassword,
    });
  },
};