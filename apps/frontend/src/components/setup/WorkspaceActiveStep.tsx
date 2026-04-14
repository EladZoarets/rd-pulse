import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight } from 'lucide-react'

export function WorkspaceActiveStep() {
  return (
    <div
      data-testid="workspace-active"
      className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center shadow-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
          <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Workspace connected!</h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Your connector is live. Reports will appear as they are generated.
          </p>
        </div>
        <Link
          to="/reports"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          View Reports
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
