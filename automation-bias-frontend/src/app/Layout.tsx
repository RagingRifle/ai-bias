import { Outlet } from "react-router-dom"

export default function Layout() {
  return (
    <div className="min-h-screen bg-slateDeep text-slate-200">
      <Outlet />
    </div>
  )
}