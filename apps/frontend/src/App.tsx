import { Routes, Route, Navigate } from 'react-router-dom'

function SetupPlaceholder() {
  return <div data-testid="page-setup">Setup Page (coming soon)</div>
}

function ReportsPlaceholder() {
  return <div data-testid="page-reports">Reports Page (coming soon)</div>
}

function ReportPlaceholder() {
  return <div data-testid="page-report">Report Page (coming soon)</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPlaceholder />} />
      <Route path="/reports" element={<ReportsPlaceholder />} />
      <Route path="/report/:id" element={<ReportPlaceholder />} />
      <Route path="/" element={<Navigate to="/setup" replace />} />
    </Routes>
  )
}
