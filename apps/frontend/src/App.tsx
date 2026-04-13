import { Routes, Route, Navigate } from 'react-router-dom'
import { ReportPage } from './pages/ReportPage'
import { SetupPage } from './pages/SetupPage'

function ReportsPlaceholder() {
  return <div data-testid="page-reports">Reports Page (coming soon)</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/reports" element={<ReportsPlaceholder />} />
      <Route path="/report/:id" element={<ReportPage />} />
      <Route path="/" element={<Navigate to="/setup" replace />} />
    </Routes>
  )
}
