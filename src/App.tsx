import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GazeHomeProvider } from './context/GazeHomeContext';
import { Layout } from './components/Layout';
import { GazeCursor } from './components/GazeCursor';
import { DoorConfirmModal } from './components/DoorConfirmModal';
import { Dashboard } from './pages/Dashboard';
import { EyeTracking } from './pages/EyeTracking';
import { Calibration } from './pages/Calibration';
import { SmartHome } from './pages/SmartHome';
import { Rooms } from './pages/Rooms';
import { Appliances } from './pages/Appliances';
import { GestureRecognition } from './pages/GestureRecognition';
import { MachineLearningLab } from './pages/MachineLearningLab';
import { DemoMode } from './pages/DemoMode';
import { History } from './pages/History';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { About } from './pages/About';

export default function App() {
  return (
    <GazeHomeProvider>
      <BrowserRouter>
        <GazeCursor />
        <DoorConfirmModal />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/eye-tracking" element={<EyeTracking />} />
            <Route path="/calibration" element={<Calibration />} />
            <Route path="/simulator" element={<SmartHome />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/appliances" element={<Appliances />} />
            <Route path="/gestures" element={<GestureRecognition />} />
            <Route path="/ml-lab" element={<MachineLearningLab />} />
            <Route path="/demo" element={<DemoMode />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GazeHomeProvider>
  );
}
