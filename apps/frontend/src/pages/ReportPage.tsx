import { useParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { PageContainer } from '../components/layout/PageContainer'
import { HealthBanner } from '../components/report/HealthBanner'
import { ChartsRow } from '../components/report/ChartsRow'
import { IssuesSection } from '../components/report/IssuesSection'
import { NavigationLinks } from '../components/report/NavigationLinks'
import { useReport } from '../hooks/useReport'

export function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const { data: report, isLoading, isError, error } = useReport(id ?? '')

  if (isLoading) {
    return (
      <AppShell>
        <PageContainer>
          <div data-testid="report-loading" className="py-20 text-center text-slate-400">
            Loading report…
          </div>
        </PageContainer>
      </AppShell>
    )
  }

  if (isError || !report) {
    return (
      <AppShell>
        <PageContainer>
          <div data-testid="report-error" className="py-20 text-center">
            <p className="text-lg font-semibold text-slate-700">Report not found</p>
            <p className="mt-1 text-sm text-slate-400">
              {error?.message ?? 'This report does not exist or has been removed.'}
            </p>
          </div>
        </PageContainer>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageContainer>
        <HealthBanner report={report} />
        <ChartsRow risks={report.risks} />
        <IssuesSection risks={report.risks} />
        <NavigationLinks risks={report.risks} insights={report.insights} />
      </PageContainer>
    </AppShell>
  )
}
