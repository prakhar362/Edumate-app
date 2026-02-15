import client from "./client";

export const authAPI = {
  login: async (email: string, password: string) => {
  console.log("API login called", email);
  return client.post("/api/auth/login", { email, password });
},

  register: async (name:string, email:string, password: string) => {
    console.log("API register called", {email,name,password});
    return client.post("/api/auth/register", {name,email,password});
  },

  me: (token: string) =>
  client.get("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }),


  googleLogin: (idToken: string) =>
    client.post("/api/auth/google", {id_token: idToken}),
};
