import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App'

function renderWithProviders(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('App routing', () => {
  it('renders setup page at /setup', () => {
    renderWithProviders('/setup')
    expect(screen.getByTestId('setup-form')).toBeInTheDocument()
  })

  it('renders reports page at /reports', () => {
    renderWithProviders('/reports')
    expect(screen.getByTestId('page-reports')).toBeInTheDocument()
  })

  it('renders report page at /report/:id', () => {
    renderWithProviders('/report/abc-123')
    // ReportPage renders loading state while the async query is in flight
    expect(screen.getByTestId('report-loading')).toBeInTheDocument()
  })

  it('redirects / to /setup', () => {
    renderWithProviders('/')
    expect(screen.getByTestId('setup-form')).toBeInTheDocument()
  })
})
