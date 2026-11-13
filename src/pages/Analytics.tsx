import React from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useGazeHome } from '../context/GazeHomeContext';

const CHART_COLORS = ['#6D28D9', '#0891B2', '#4F46E5', '#10B981', '#F59E0B', '#64748B'];

export const Analytics: React.FC = () => {
  const { history, stats, sessionDurationSec, calibrationProfile } = useGazeHome();

  const applianceData = React.useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach((h) => {
      map[h.applianceName] = (map[h.applianceName] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  const dailyData = React.useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach((h) => {
      const day = new Date(h.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .map(([date, interactions]) => ({ date, interactions }))
      .reverse();
  }, [history]);

  const methodData = React.useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach((h) => {
      map[h.method] = (map[h.method] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [history]);

  const regionData = React.useMemo(() => {
    return Object.entries(stats.gazeRegionCounts)
      .map(([region, seconds]) => ({ region, seconds }))
      .sort((a, b) => b.seconds - a.seconds);
  }, [stats.gazeRegionCounts]);

  const hasAnyData = history.length > 0 || regionData.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E2E0F0] bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Usage & Gaze Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Computed strictly from your real local interaction logs, gaze region dwelling time, and blink events stored in this browser.
        </p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs text-slate-500">Total Interactions</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {history.length}
          </p>
        </div>
        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs text-slate-500">Blink Gestures</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-violet-700">
            {stats.totalBlinkGestures}
          </p>
        </div>
        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs text-slate-500">Active Gaze Time</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-cyan-700">
            {stats.totalGazeSeconds}s
          </p>
          <p className="font-mono text-xs text-slate-400">Current session: {sessionDurationSec}s</p>
        </div>
        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs text-slate-500">Calibration Accuracy</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {calibrationProfile ? `~${calibrationProfile.validationErrorPx}px` : '—'}
          </p>
          <p className="text-xs text-slate-400">
            {calibrationProfile ? calibrationProfile.qualityLabel : 'Not calibrated'}
          </p>
        </div>
      </div>

      {!hasAnyData ? (
        <div className="rounded-2xl border border-[#E2E0F0] bg-white p-12 text-center">
          <h2 className="text-lg font-bold text-slate-900">No Analytics Recorded Yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            All analytics charts reflect genuine activity. Operate appliances in the Smart Home Simulator or Demo Simulation to generate real charts.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to="/simulator"
              className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
            >
              Open Simulator
            </Link>
            <Link
              to="/demo"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Open Demo Mode
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Appliance Usage */}
          <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
            <h2 className="text-base font-bold text-slate-900">Appliance Usage Frequency</h2>
            <div className="mt-4 h-64 w-full">
              {applianceData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No appliance events yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} width={28} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6D28D9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Daily Interaction Count */}
          <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
            <h2 className="text-base font-bold text-slate-900">Daily Interaction Activity</h2>
            <div className="mt-4 h-64 w-full">
              {dailyData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No daily interaction data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} width={28} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="interactions"
                      stroke="#0891B2"
                      fill="#CFFAFE"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gaze Region Distribution */}
          <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
            <h2 className="text-base font-bold text-slate-900">Gaze Region Distribution (Seconds)</h2>
            <div className="mt-4 h-64 w-full">
              {regionData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  Enable Webcam Gaze or Demo Mode to record gaze region distribution
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis
                      type="category"
                      dataKey="region"
                      width={105}
                      tick={{ fontSize: 10, fill: '#334155' }}
                    />
                    <Tooltip />
                    <Bar dataKey="seconds" fill="#0891B2" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Control Method Distribution */}
          <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
            <h2 className="text-base font-bold text-slate-900">Control Method Distribution</h2>
            <div className="mt-4 h-64 w-full">
              {methodData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No interactions logged yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={82}
                      label={(entry) => `${entry.name} (${entry.value})`}
                    >
                      {methodData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
