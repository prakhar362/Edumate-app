import client from "./client";

export const SummaryAPI={
  uploadPdf :async  (formData: FormData) =>{
    console.log("API uploadPdf called", formData);
    return client.post("/api/summarize/pdf", formData);
  },

 getSummaries:async () =>{
  console.log("API getSummaries called");
  return client.get("/api/summarize/summaries");
 },

getSummary:async (id: string) =>{
  console.log("API getSummary called", id);
  return client.get(`/api/summarize/summaries/${id}`);
},

getQuiz:async (id: string) =>{
  console.log("API getQuiz called", id);
  return client.get(`/api/summarize/quiz/${id}`);
},
submitQuiz:async (id: string, answers: any) =>{
  console.log("API submitQuiz called", id, answers);
  return client.post(`/api/summarize/quiz/submit/${id}`, answers);
}

}

