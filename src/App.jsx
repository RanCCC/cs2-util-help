import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import DetailPage from './pages/DetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map/:mapId" element={<MapPage />} />
      <Route
        path="/map/:mapId/lineup/:lineupId/:startingPointId"
        element={<DetailPage />}
      />
    </Routes>
  );
}
