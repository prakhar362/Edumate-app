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

    return client.post(
      `/api/summarize/quiz/submit/${summaryId}`,
      score,
      {
        transformRequest: [(data) => JSON.stringify(data)],
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }





}

