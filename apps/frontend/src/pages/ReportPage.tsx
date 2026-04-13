import { useParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { PageContainer } from '../components/layout/PageContainer'
import { ReportHeader } from '../components/report/ReportHeader'
import { TopRisksSection } from '../components/report/TopRisksSection'
import { JiraRisksSection } from '../components/report/JiraRisksSection'
import { TeamSignalsSection } from '../components/report/TeamSignalsSection'
import { GitHubSignalsSection } from '../components/report/GitHubSignalsSection'
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
        <ReportHeader report={report} />
        <TopRisksSection risks={report.risks} />
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <JiraRisksSection risks={report.risks} />
          <TeamSignalsSection risks={report.risks} />
        </div>
        <GitHubSignalsSection risks={report.risks} />
        <NavigationLinks risks={report.risks} insights={report.insights} />
      </PageContainer>
    </AppShell>
  )
}
