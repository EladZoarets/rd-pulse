import { Link, useLocation } from 'react-router-dom'
import { Activity } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  const location = useLocation()
  const isReport = location.pathname.startsWith('/report/')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link to="/setup" className="flex items-center gap-2 font-bold text-slate-900">
            <Activity className="h-5 w-5 text-blue-600" />
            RD Pulse
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {isReport && (
              <Link to="/reports" className="text-slate-500 hover:text-slate-900">
                ← All Reports
              </Link>
            )}
            <Link to="/setup" className="text-slate-500 hover:text-slate-900">
              Setup
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
