import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Crosshair,
  Eye,
  Home,
  MousePointerClick,
  Sliders,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useGazeHome } from '../context/GazeHomeContext';
import { ROOMS } from '../services/applianceSimulationService';
import { SmartRoom } from '../components/SmartRoom';

export const Dashboard: React.FC = () => {
  const {
    trackingStatus,
    controlMode,
    calibrationProfile,
    gazeRegion,
    activeRoom,
    appliances,
    history,
    stats,
    sessionDurationSec,
    startWebcamTracking,
    enableDemoMode,
  } = useGazeHome();

  const appliancesOnCount = appliances.filter((a) =>
    a.type === 'door' ? !a.isLocked : a.isOn
  ).length;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Real interaction counts per appliance type for quick chart
  const applianceUsageData = React.useMemo(() => {
    const counts: Record<string, number> = {
      Light: 0,
      Fan: 0,
      AC: 0,
      TV: 0,
      Door: 0,
      Curtains: 0,
    };
    history.forEach((h) => {
      const name = h.applianceName.toLowerCase();
      if (name.includes('light') || name.includes('pendant')) counts.Light++;
      else if (name.includes('fan')) counts.Fan++;
      else if (name.includes('ac')) counts.AC++;
      else if (name.includes('tv') || name.includes('display')) counts.TV++;
      else if (name.includes('door')) counts.Door++;
      else if (name.includes('curtain') || name.includes('blind')) counts.Curtains++;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [history]);

  const activeRoomName = ROOMS.find((r) => r.id === activeRoom)?.name ?? activeRoom;

  return (
    <div className="space-y-6">
      {/* Header Intro + Primary Action */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E0F0] bg-white p-6 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Eye-Gaze Smart Home Control Center
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Operate lighting, climate, media, curtains, and smart locks hands-free using local MediaPipe iris tracking, blink recognition, and dwell selection.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Camera: {controlMode === 'webcam-gaze' ? trackingStatus : 'Off'}</span>
            <span aria-hidden="true">·</span>
            <span>
              Calibration: {calibrationProfile ? `${calibrationProfile.qualityLabel} (${calibrationProfile.pointCount}-pt)` : 'Not calibrated'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Active room: {activeRoomName}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {controlMode === 'off' && (
            <button
              type="button"
              onClick={() => startWebcamTracking()}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Start Eye Tracking
            </button>
          )}
          <Link
            to="/calibration"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E0F0] bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <Crosshair className="h-4 w-4 text-violet-700" />
            {calibrationProfile ? 'Recalibrate' : 'Calibrate Eyes'}
          </Link>
          {controlMode !== 'demo-simulation' && (
            <button
              type="button"
              onClick={enableDemoMode}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-800 hover:bg-cyan-100 transition-colors"
            >
              <MousePointerClick className="h-4 w-4" />
              Try Demo Mode
            </button>
          )}
        </div>
      </section>

      {/* Key Operational Telemetry Grid */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Tracking & Mode</p>
          <p className="mt-1.5 text-lg font-bold text-slate-900">
            {controlMode === 'webcam-gaze'
              ? trackingStatus === 'active'
                ? 'Webcam Active'
                : 'Webcam Paused'
              : controlMode === 'demo-simulation'
              ? 'Demo Simulation'
              : 'Manual / Idle'}
          </p>
          <p className="mt-1 font-mono text-xs tabular-nums text-slate-500">
            Gaze: {gazeRegion ?? 'Unavailable'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Appliances Active</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-violet-700">
            {appliancesOnCount} / {appliances.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Across 3 rooms</p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Recorded Interactions</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {history.length}
          </p>
          <p className="mt-1 font-mono text-xs tabular-nums text-slate-500">
            Blink gestures: {stats.totalBlinkGestures}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Gaze Session Duration</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-cyan-700">
            {formatDuration(sessionDurationSec)}
          </p>
          <p className="mt-1 font-mono text-xs tabular-nums text-slate-500">
            Total tracked: {stats.totalGazeSeconds}s
          </p>
        </div>
      </section>

      {/* Main Simulator Spotlight + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Live Smart Home Preview · {activeRoomName}
            </h2>
            <Link
              to="/simulator"
              className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-800"
            >
              Open Full Simulator
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <SmartRoom roomId={activeRoom} />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-4">
          {/* Quick Navigation Cards */}
          <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">Quick Workflows</h2>
            <div className="mt-3 space-y-2">
              <Link
                to="/eye-tracking"
                className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5">
                  <Eye className="h-4 w-4 text-violet-700" />
                  Live Eye Tracking
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
              <Link
                to="/simulator"
                className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5">
                  <Home className="h-4 w-4 text-cyan-700" />
                  Smart Home Simulator
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
              <Link
                to="/gestures"
                className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-violet-700" />
                  Blink Gesture Lab
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
              <Link
                to="/appliances"
                className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5">
                  <Sliders className="h-4 w-4 text-cyan-700" />
                  Detailed Appliance Controls
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Real Interaction Chart */}
          <div className="flex-1 rounded-xl border border-[#E2E0F0] bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">Appliance Activity</h2>
            <p className="text-xs text-slate-500">Based on your recorded local sessions</p>
            {history.length === 0 ? (
              <div className="mt-6 rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-600">
                No appliance interactions recorded yet. Click or gaze at any appliance in the simulator to begin logging activity.
              </div>
            ) : (
              <div className="mt-3 h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applianceUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} width={26} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6D28D9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Actions Table */}
      <section className="rounded-xl border border-[#E2E0F0] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Actions</h2>
          <Link to="/history" className="text-xs font-semibold text-violet-700 hover:underline">
            View Full History
          </Link>
        </div>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No actions logged yet. Control appliances in the Smart Home Simulator or Demo Mode to see real activity here.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Appliance</th>
                  <th className="py-2 pr-4 font-medium">Room</th>
                  <th className="py-2 pr-4 font-medium">Action</th>
                  <th className="py-2 font-medium">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.slice(0, 6).map((entry) => (
                  <tr key={entry.id} className="text-slate-700">
                    <td className="py-2.5 pr-4 font-mono text-xs tabular-nums text-slate-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">
                      {entry.applianceName}
                    </td>
                    <td className="py-2.5 pr-4 capitalize text-xs">
                      {entry.roomId.replace('-', ' ')}
                    </td>
                    <td className="py-2.5 pr-4 text-xs">{entry.action}</td>
                    <td className="py-2.5 font-mono text-xs text-violet-700">{entry.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
