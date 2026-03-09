import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RateSchedulePreview } from './pages/RateSchedulePreview';
import { RateScheduleConfig } from './pages/RateScheduleConfig';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<RateSchedulePreview />} />
        <Route path="/config" element={<RateScheduleConfig />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
