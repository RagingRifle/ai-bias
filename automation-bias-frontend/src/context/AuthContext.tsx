import { createContext, useContext, useEffect, useState } from "react"

type Role = "student" | "faculty" | null

interface AuthContextType {
  studentId: string | null
  role: Role
  login: (id: string, role: Role) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [studentId, setStudentId] = useState<string | null>(null)
  const [role, setRole] = useState<Role>(null)

  useEffect(() => {
    const storedId = localStorage.getItem("studentId")
    const storedRole = localStorage.getItem("role") as Role

    if (storedId) setStudentId(storedId)
    if (storedRole) setRole(storedRole)
  }, [])

  const login = (id: string, role: Role) => {
    localStorage.setItem("studentId", id)
    localStorage.setItem("role", role || "")
    setStudentId(id)
    setRole(role)
  }

  const logout = () => {
    localStorage.removeItem("studentId")
    localStorage.removeItem("role")
    setStudentId(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ studentId, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}