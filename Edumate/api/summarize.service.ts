import api from "./client";

export const uploadPdf = (formData: FormData) =>
  api.post("/api/summarize/pdf", formData);

export const getSummaries = () =>
  api.get("/api/summarize/summaries");

export const getSummary = (id: string) =>
  api.get(`/api/summarize/summaries/${id}`);

export const getQuiz = (id: string) =>
  api.get(`/api/summarize/quiz/${id}`);

export const submitQuiz = (id: string, answers: any) =>
  api.post(`/api/summarize/quiz/submit/${id}`, answers);
