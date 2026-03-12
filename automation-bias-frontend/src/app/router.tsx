import { createBrowserRouter } from "react-router-dom"
import Layout from "./Layout"
import LoginPage from "../features/auth/LoginPage"
import StudentPage from "../features/student/StudentPage"
import PublicLeaderboard from "../features/leaderboard/PublicLeaderboard"
import FacultyPage from "../features/faculty/FacultyPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
  { index: true, element: <LoginPage /> },
  { path: "student", element: <StudentPage /> },
  { path: "faculty", element: <FacultyPage /> },
  { path: "leaderboard", element: <PublicLeaderboard /> },
],
  },
])