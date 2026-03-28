import { BrowserRouter, Routes, Route } from 'react-router'
import { AppLayout } from './components/AppLayout'
import RaceListPage from './pages/RaceListPage'
import RaceDetailPage from './pages/RaceDetailPage'
import CyclistDetailPage from './pages/CyclistDetailPage'
import SeasonListPage from './pages/SeasonListPage'
import SeasonDetailPage from './pages/SeasonDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<RaceListPage />} />
          <Route path="/race/:id" element={<RaceDetailPage />} />
          <Route path="/race/:raceId/cyclist/:cyclistId" element={<CyclistDetailPage />} />
          <Route path="/seasons" element={<SeasonListPage />} />
          <Route path="/seasons/:id" element={<SeasonDetailPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
