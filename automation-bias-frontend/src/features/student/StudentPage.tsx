import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { generateAI, submitDecision } from "../../services/api"
import { useAuth } from "../../context/AuthContext"

type Mode = "learning" | "research"

interface Message {
  id: string
  role: "user" | "ai"
  content: string
  socratic?: string[]
  checkpoint?: boolean
  showSocratic?: boolean
  questionId?: string
}

export default function StudentPage() {
  const { studentId, role, logout } = useAuth()
const navigate = useNavigate()

useEffect(() => {
  if (!studentId || role !== "student") {
    navigate("/")
  }
}, [studentId, role])
 

  const [mode, setMode] = useState<Mode>("learning")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [inputLocked, setInputLocked] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [socraticStartTime, setSocraticStartTime] = useState<number | null>(null)
  const [initialDecision, setInitialDecision] = useState<"Correct" | "Wrong" | null>(null)
  const [confidence, setConfidence] = useState<number>(3)
  const [totalScore, setTotalScore] = useState<number | null>(null)

  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 🔥 SEND MESSAGE (CONNECTED TO BACKEND)
  const sendMessage = async () => {
    if (!input.trim() || inputLocked) return

    const questionText = input

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: questionText,
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")

    try {
      const data = await generateAI(questionText)

      const aiId = crypto.randomUUID()

      const aiMessage: Message = {
        id: aiId,
        role: "ai",
        content: "",
        socratic: data.socratic,
        checkpoint: mode === "research",
        showSocratic: false,
        questionId: data.questionId,
      }

      setMessages(prev => [...prev, aiMessage])

      const fullText: string = data.answer || "Sorry, I could not process an answer."
      let index = 0

      const interval = setInterval(() => {
        index++

        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiId
              ? { ...msg, content: fullText.slice(0, index) }
              : msg
          )
        )

        if (index >= fullText.length) {
          clearInterval(interval)

          setTimeout(() => {
            if (mode === "research") {
              setInputLocked(true)
              setStartTime(performance.now())
              // In research mode, do NOT show socratic yet. Wait for initial decision.
            } else {
              // In learning mode, show socratic immediately
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiId
                    ? { ...msg, showSocratic: true }
                    : msg
                )
              )
            }
          }, 500)
        }
      }, 15)

    } catch (error) {
      console.error("Error generating AI response:", error)
    }
  }

  // 🔥 HANDLE DECISION (PHASE 1 or PHASE 2)
  const handleDecision = async (choice: "correct" | "wrong") => {
    if (!startTime) return

    // Phase 1: Initial Decision before Socratic
    if (initialDecision === null) {
      setInitialDecision(choice === "correct" ? "Correct" : "Wrong")
      setSocraticStartTime(performance.now())

      // Reveal Socratic questions now
      setMessages(prev =>
        prev.map(msg =>
          msg.role === "ai" && !msg.showSocratic
            ? { ...msg, showSocratic: true }
            : msg
        )
      )
      return;
    }

    // Phase 2: Final Decision after Socratic reflection
    const totalResponseTime = performance.now() - startTime
    const socraticTime = socraticStartTime ? performance.now() - socraticStartTime : 0;

    const lastAI = [...messages]
      .reverse()
      .find(msg => msg.role === "ai" && msg.questionId)

    if (!lastAI?.questionId || !studentId) return

    try {
      const result = await submitDecision(
        studentId,
        lastAI.questionId,
        initialDecision,
        choice === "correct" ? "Correct" : "Wrong",
        Math.floor(socraticTime),
        Math.floor(totalResponseTime),
        confidence
      )

      setTotalScore(result.totalScore)

    } catch (error) {
      console.error("Error submitting decision:", error)
    }

    setInputLocked(false)
    setStartTime(null)
    setSocraticStartTime(null)
    setInitialDecision(null)
    setConfidence(3)
  }

  return (
    <div className="flex h-screen bg-[#0B1220] text-slate-200">

      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0"
        } bg-[#111827] border-r border-[#1F2937] overflow-hidden`}
      >
        <div className="p-6 space-y-6">
          <h1 className="text-xl font-semibold tracking-tight">
            ThinkBeforeAI
          </h1>

          <div className="space-y-2">
            <p className="text-xs uppercase text-slate-400 tracking-wider">
              Mode
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("learning")}
                className={`px-3 py-1 rounded-lg text-sm ${
                  mode === "learning"
                    ? "bg-indigo-600"
                    : "bg-[#1F2937]"
                }`}
              >
                Learning
              </button>
              <button
                onClick={() => setMode("research")}
                className={`px-3 py-1 rounded-lg text-sm ${
                  mode === "research"
                    ? "bg-indigo-600"
                    : "bg-[#1F2937]"
                }`}
              >
                Research
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sm text-slate-400"
          >
            {sidebarOpen ? "Hide" : "Show"}
          </button>
          <div className="flex items-center gap-6 text-sm text-slate-400">
  <span className="capitalize">{mode} mode</span>

  {totalScore !== null && (
    <span className="text-indigo-400 font-medium">
      Score: {totalScore}
    </span>
  )}
  <button
  onClick={() => navigate("/leaderboard")}
  className="text-xs text-slate-400 hover:text-indigo-400 transition"
>
  Leaderboard
</button>
  <button
    onClick={logout}
    className="text-xs text-slate-400 hover:text-indigo-400 transition"
  >
    Logout
  </button>
</div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto px-6 py-10">
          <div className="max-w-3xl mx-auto space-y-8">

            {messages.map(msg => (
              <div key={msg.id}>

                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 px-4 py-3 rounded-2xl max-w-lg">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      className={`bg-[#111827] border px-6 py-5 rounded-2xl shadow-lg transition-all duration-500 ${
                        !msg.showSocratic
                          ? "border-indigo-500/40 shadow-indigo-500/10"
                          : "border-[#1F2937]"
                      }`}
                    >
                      <p className="leading-relaxed">
                        {msg.content}
                        {!msg.showSocratic && (
                          <span className="ml-1 inline-block w-[6px] h-[16px] bg-indigo-400 animate-pulse" />
                        )}
                      </p>

                      {msg.socratic && msg.showSocratic && (
                        <div className="mt-4 border-t border-[#1F2937] pt-4 space-y-2 animate-reveal">
                          <p className="text-xs uppercase text-slate-400 tracking-wider">
                            Reflect
                          </p>
                          {msg.socratic.map((q, i) => (
                            <p key={i} className="text-sm text-slate-300">
                              • {q}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {mode === "research" && msg.checkpoint && inputLocked && (
                      <div className="bg-[#111827] border border-indigo-600/40 px-6 py-4 rounded-xl flex flex-col items-center gap-4">
                        {initialDecision === null ? (
                          <>
                            <p className="text-sm text-slate-300 mb-2">Based on the explanation above, what is your initial assessment?</p>
                            <div className="flex gap-4">
                              <button
                                onClick={() => handleDecision("correct")}
                                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition"
                              >
                                AI is Correct
                              </button>
                              <button
                                onClick={() => handleDecision("wrong")}
                                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 transition"
                              >
                                AI is Wrong
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full flex flex-col items-center space-y-4">
                            <p className="text-sm text-slate-300">Read the reflection questions above. Has your assessment changed?</p>
                            
                            <div className="w-full max-w-sm space-y-2">
                              <label className="text-xs text-slate-400 flex justify-between">
                                <span>Unsure (1)</span>
                                <span>Confidence: {confidence}/5</span>
                                <span>Certain (5)</span>
                              </label>
                              <input 
                                type="range" min="1" max="5" 
                                value={confidence} 
                                onChange={(e) => setConfidence(Number(e.target.value))}
                                className="w-full accent-indigo-500" 
                              />
                            </div>

                            <div className="flex gap-4 pt-2">
                              <button
                                onClick={() => handleDecision("correct")}
                                className={`px-5 py-2 rounded-lg transition ${initialDecision === "Correct" ? "bg-emerald-600 font-bold ring-2 ring-emerald-400" : "bg-[#1F2937] hover:bg-emerald-600/50"}`}
                              >
                                Final: AI is Correct
                              </button>
                              <button
                                onClick={() => handleDecision("wrong")}
                                className={`px-5 py-2 rounded-lg transition ${initialDecision === "Wrong" ? "bg-amber-500 font-bold ring-2 ring-amber-300" : "bg-[#1F2937] hover:bg-amber-500/50"}`}
                              >
                                Final: AI is Wrong
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-[#1F2937] px-6 py-6 bg-[#0B1220]">
          <div className="max-w-3xl mx-auto flex gap-4">
            <input
              disabled={inputLocked}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask something..."
              className="flex-1 bg-[#111827] border border-[#1F2937] rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              onClick={sendMessage}
              disabled={inputLocked}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition"
            >
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}