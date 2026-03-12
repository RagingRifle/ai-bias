import { useEffect, useState } from "react"
import { getLeaderboard } from "../../services/api"

export default function PublicLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard()
        
        // Convert the object { "Student A": 10, "Student B": 5 } into a sorted array
        const sortedData = Object.entries(data)
          .map(([name, score]) => ({ name, score: score as number }))
          .sort((a, b) => b.score - a.score)
          
        setLeaderboard(sortedData)
      } catch (error) {
        console.error("Failed to fetch leaderboard", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-200 p-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Global Leaderboard
          </h1>
          <p className="text-slate-400">Can you spot the AI's mistakes before the others?</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1F2937] rounded-3xl overflow-hidden shadow-2xl">
            {leaderboard.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                No scores recorded yet. Be the first to play!
              </div>
            ) : (
              <div className="divide-y divide-[#1F2937]">
                {leaderboard.map((student, index) => (
                  <div 
                    key={student.name} 
                    className="flex justify-between items-center p-6 hover:bg-[#1F2937]/50 transition"
                  >
                    <div className="flex items-center gap-6">
                      <span className={`text-xl font-bold w-6 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                        #{index + 1}
                      </span>
                      <span className="text-lg font-medium">{student.name}</span>
                    </div>
                    <div className="bg-indigo-600/20 text-indigo-300 font-bold px-4 py-2 rounded-xl">
                      {student.score} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}