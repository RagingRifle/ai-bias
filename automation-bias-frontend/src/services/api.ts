import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
})

export const generateAI = async (question: string) => {
  const response = await api.post("/generate", { question })
  return response.data
}

export const submitDecision = async (
  studentId: string,
  questionId: string,
  studentChoice: "Correct" | "Wrong",
  responseTime: number
) => {
  const response = await api.post("/submit", {
    studentId,
    questionId,
    studentChoice,
    responseTime,
  })
  return response.data
}

export const getLeaderboard = async () => {
  const response = await api.get("/leaderboard")
  return response.data
}