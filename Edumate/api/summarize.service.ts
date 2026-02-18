import client from "./client";

export const SummaryAPI = {
  uploadPdf: async (formData: FormData) => {
    console.log("API uploadPdf called", formData);

    return client.post("/api/summarize/pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getSummaries: async () => {
    console.log("API getSummaries called");
    return client.get("/api/summarize/summaries");
  },

  getSummary: async (id: string) => {
    console.log("API getSummary called", id);
    return client.get(`/api/summarize/summaries/${id}`);
  },

  getQuiz: async (summaryId: string) => {
    console.log("API getQuiz called", summaryId);
    return client.get(`/api/summarize/quiz/${summaryId}`);
  },

  submitQuiz: async (summaryId: string, score: number) => {
    console.log("API submitQuiz called", summaryId, score);

    // FIX: Send as x-www-form-urlencoded string to match FastAPI's Form(...)
    return client.post(
      `/api/summarize/quiz/submit/${summaryId}`,
      `score=${score}`, // Body must be "key=value" string
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  }





}

