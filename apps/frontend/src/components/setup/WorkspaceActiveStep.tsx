import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export function WorkspaceActiveStep() {
  return (
    <div data-testid="workspace-active" className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h2 className="text-xl font-semibold text-slate-900">Workspace connected!</h2>
        <p className="text-sm text-slate-500">
          Your connector is live. Reports will appear as they are generated.
        </p>
      </div>
      <Link
        to="/reports"
        className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        View Reports →
      </Link>
    </div>
  )
}
