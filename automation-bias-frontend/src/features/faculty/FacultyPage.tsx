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

  // To display exactly what the server currently thinks the settings are
  const [activeSettings, setActiveSettings] = useState<typeof settings | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const analyticsRes = await api.get("/analytics")
      const leaderboardRes = await api.get("/leaderboard")
      const settingsRes = await api.get("/faculty-settings")

      setAnalytics(analyticsRes.data)
      setLeaderboard(leaderboardRes.data)
      setSettings(settingsRes.data)
      setActiveSettings(settingsRes.data)
    } catch (err) {
      console.error("Faculty fetch error:", err)
    }
  }

  const updateSettings = async () => {
    try {
      await api.post("/faculty-settings", settings)
      await fetchData()
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
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

      {activeSettings && (
        <div className="bg-[#111827] p-6 rounded-2xl border border-indigo-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-xl font-semibold text-indigo-100">Currently Active Server Settings</h2>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1F2937]">
              <p className="text-sm text-slate-400">Session ID</p>
              <p className="font-mono text-emerald-400 mt-1">{activeSettings.sessionId}</p>
            </div>
            <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1F2937]">
              <p className="text-sm text-slate-400">Venom Frequency</p>
              <p className="font-mono text-emerald-400 mt-1">{activeSettings.venomFrequency}%</p>
            </div>
            <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1F2937]">
              <p className="text-sm text-slate-400">Venom Severity</p>
              <p className="font-mono text-emerald-400 mt-1">{activeSettings.venomSeverity}%</p>
            </div>
            <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1F2937]">
              <p className="text-sm text-slate-400">Reward</p>
              <p className="font-mono text-emerald-400 mt-1">{activeSettings.reward}</p>
            </div>
            <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1F2937]">
              <p className="text-sm text-slate-400">Penalty</p>
              <p className="font-mono text-emerald-400 mt-1">{activeSettings.penalty}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-4">
        <h2 className="text-xl font-semibold">Change Settings</h2>

        <div className="grid grid-cols-5 gap-4">
          <InputField
            label="Session ID"
            value={settings.sessionId}
            onChange={(v: string) => setSettings({ ...settings, sessionId: v })}
          />
          <InputField
            label="Venom Frequency (1-100)"
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

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={updateSettings}
            className="bg-indigo-600 px-6 py-2 rounded-xl hover:bg-indigo-500 transition font-medium"
          >
            Update Settings
          </button>
          
          {isSaved && (
             <span className="text-emerald-400 text-sm font-medium animate-pulse">✓ Settings saved and active on server</span>
          )}
        </div>
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