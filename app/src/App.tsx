import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { Shell } from '@/components/layout/Shell'
import { PipelineView } from '@/pages/PipelineView'
import { InflectionPointsView } from '@/pages/InflectionPointsView'
import { HealthView } from '@/pages/HealthView'
import { AccountWorkspace } from '@/pages/AccountWorkspace'
import { PlayExecution } from '@/pages/PlayExecution'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Shell />}>
            <Route index element={<Navigate to="/pipeline" replace />} />
            <Route path="pipeline" element={<PipelineView />} />
            <Route path="inflection-points" element={<InflectionPointsView />} />
            <Route path="health" element={<HealthView />} />
            <Route path="accounts/:id" element={<AccountWorkspace />} />
            <Route path="accounts/:id/plays/:runId" element={<PlayExecution />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
