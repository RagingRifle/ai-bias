import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export default function LoginPage() {
  const [id, setId] = useState("")
  const [role, setRole] = useState<"student" | "faculty">("student")
  const [error, setError] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = () => {
    if (!id.trim()) {
      setError(role === "student" ? "Please enter your ID." : "Please enter the passcode.")
      return
    }

    if (role === "faculty") {
      const passcode = import.meta.env.VITE_FACULTY_PASSCODE || "research2026"
      if (id.trim() !== passcode) {
        setError("Invalid Faculty Passcode.")
        return
      }
    }

    setError("")
    login(id.trim(), role)

    navigate(role === "student" ? "/student" : "/faculty")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1220] text-slate-200 px-6">
      <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-3xl p-10 shadow-xl space-y-8">

        {/* Title */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            ThinkBeforeAI
          </h1>
          <p className="text-sm text-slate-400">
            Experimental AI Learning Environment
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <p className="text-xs uppercase text-slate-400 tracking-wider">
            Select Role
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setRole("student")}
              className={`flex-1 py-3 rounded-xl border transition ${
                role === "student"
                  ? "bg-indigo-600 border-indigo-500"
                  : "bg-[#0B1220] border-[#1F2937] hover:border-indigo-500"
              }`}
            >
              Student
            </button>

            <button
              onClick={() => setRole("faculty")}
              className={`flex-1 py-3 rounded-xl border transition ${
                role === "faculty"
                  ? "bg-indigo-600 border-indigo-500"
                  : "bg-[#0B1220] border-[#1F2937] hover:border-indigo-500"
              }`}
            >
              Faculty
            </button>
          </div>
        </div>

        {/* ID Input */}
        <div className="space-y-2">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder={role === "student" ? "Enter Student ID" : "Enter Faculty Passcode"}
            type={role === "student" ? "text" : "password"}
            className="w-full bg-[#0B1220] border border-[#1F2937] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl transition font-medium"
        >
          Enter Platform
        </button>

        {/* Subtle Research Notice */}
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          This platform studies decision-making behavior in AI-assisted learning.
        </p>
      </div>
    </div>
  )
}