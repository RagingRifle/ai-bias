import { useEffect, useState } from "react"
import axios from "axios"

interface Analytics {
  totalInteractions: number
  errorInjectionRate: number
  overTrustRate: number
  underTrustRate: number
  decisionAccuracy: number
  averageResponseTime: number
  lateRate: number
  biasIndex: number
}

export default function FacultyPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [leaderboard, setLeaderboard] = useState<Record<string, number>>({})
  const [settings, setSettings] = useState({
    sessionId: "Default",
    venomFrequency: 0,
    venomSeverity: 0,
    reward: 0,
    penalty: 0
  })

  const api = axios.create({
    baseURL: "http://localhost:5000"
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const analyticsRes = await api.get("/analytics")
      const leaderboardRes = await api.get("/leaderboard")

      setAnalytics(analyticsRes.data)
      setLeaderboard(leaderboardRes.data)
    } catch (err) {
      console.error("Faculty fetch error:", err)
    }
  }

  const updateSettings = async () => {
    try {
      await api.post("/faculty-settings", settings)
      fetchData()
    } catch (err) {
      console.error("Settings update failed:", err)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-200 p-10 space-y-10">

      <h1 className="text-3xl font-semibold">Faculty Dashboard</h1>

      {analytics && (
        <div className="grid grid-cols-4 gap-6">

          <Metric title="Total Interactions" value={analytics.totalInteractions} />
          <Metric title="Error Injection Rate" value={(analytics.errorInjectionRate * 100).toFixed(1) + "%"} />
          <Metric title="Overtrust Rate" value={(analytics.overTrustRate * 100).toFixed(1) + "%"} />
          <Metric title="Undertrust Rate" value={(analytics.underTrustRate * 100).toFixed(1) + "%"} />
          <Metric title="Decision Accuracy" value={(analytics.decisionAccuracy * 100).toFixed(1) + "%"} />
          <Metric title="Avg Response Time (ms)" value={analytics.averageResponseTime} />
          <Metric title="Late Rate" value={(analytics.lateRate * 100).toFixed(1) + "%"} />
          <Metric title="Bias Index" value={analytics.biasIndex.toFixed(3)} />

        </div>
      )}

      <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-4">
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <div className="space-y-2">
          {Object.entries(leaderboard).map(([student, score]) => (
            <div
              key={student}
              className="flex justify-between bg-[#0B1220] px-4 py-3 rounded-lg"
            >
              <span>{student}</span>
              <span className="text-indigo-400">{score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-4">
        <h2 className="text-xl font-semibold">Faculty Settings</h2>

        <div className="grid grid-cols-5 gap-4">
          <InputField
            label="Session ID"
            value={settings.sessionId}
            onChange={(v: string) => setSettings({ ...settings, sessionId: v })}
          />
          <InputField
            label="Venom Frequency (0-1)"
            value={settings.venomFrequency}
            onChange={(v: string) => setSettings({ ...settings, venomFrequency: Number(v) })}
          />
          <InputField
            label="Venom Severity (1-100)"
            value={settings.venomSeverity}
            onChange={(v: string) => setSettings({ ...settings, venomSeverity: Number(v) })}
          />
          <InputField
            label="Reward"
            value={settings.reward}
            onChange={(v: string) => setSettings({ ...settings, reward: Number(v) })}
          />
          <InputField
            label="Penalty"
            value={settings.penalty}
            onChange={(v: string) => setSettings({ ...settings, penalty: Number(v) })}
          />
        </div>

        <button
          onClick={updateSettings}
          className="bg-indigo-600 px-6 py-2 rounded-xl hover:bg-indigo-500 transition"
        >
          Update Settings
        </button>
      </div>

    </div>
  )
}

function Metric({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937]">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-2xl font-semibold text-indigo-400 mt-2">{value}</p>
    </div>
  )
}

function InputField({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-slate-400">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0B1220] border border-[#1F2937] px-4 py-2 rounded-lg"
      />
    </div>
  )
}