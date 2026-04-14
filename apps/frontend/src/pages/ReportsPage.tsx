import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { PageContainer } from '../components/layout/PageContainer'
import { ReportCard } from '../components/reports/ReportCard'
import { useReports } from '../hooks/useReports'

export function ReportsPage() {
  const [searchParams] = useSearchParams()
  const workspaceId =
    searchParams.get('workspaceId') ??
    localStorage.getItem('workspaceId') ??
    ''

  // Keep localStorage in sync with the URL param so subsequent navigations work
  if (searchParams.get('workspaceId') && workspaceId) {
    localStorage.setItem('workspaceId', workspaceId)
  }

  const { data, isLoading, isError, error } = useReports(workspaceId)

  return (
    <AppShell>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Daily R&D pulse reports for your workspace.</p>
        </div>

        {isLoading && (
          <div data-testid="reports-loading" className="py-20 text-center text-slate-400">
            Loading reports…
          </div>
        )}

        {isError && (
          <div data-testid="reports-error" className="py-20 text-center">
            <p className="text-lg font-semibold text-slate-700">Failed to load reports</p>
            <p className="mt-1 text-sm text-slate-400">{error?.message}</p>
          </div>
        )}

        {data && data.reports.length === 0 && (
          <div data-testid="reports-empty" className="py-20 text-center text-slate-400">
            No reports yet. Run the connector to generate your first report.
          </div>
        )}

        {data && data.reports.length > 0 && (
          <ul data-testid="reports-list" className="space-y-3">
            {data.reports.map((report) => (
              <li key={report.id}>
                <ReportCard report={report} />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </AppShell>
  )
}
