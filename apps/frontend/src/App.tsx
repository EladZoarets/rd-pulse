import { Routes, Route, Navigate } from 'react-router-dom'
import { ReportPage } from './pages/ReportPage'
import { ReportsPage } from './pages/ReportsPage'
import { SetupPage } from './pages/SetupPage'

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/report/:id" element={<ReportPage />} />
      <Route path="/" element={<Navigate to="/setup" replace />} />
    </Routes>
  )
}
