import React, { useEffect, useState } from 'react';
import { MousePointerClick, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { SmartRoom } from '../components/SmartRoom';
import { ApplianceCard } from '../components/ApplianceCard';
import { ROOMS } from '../services/applianceSimulationService';

export const DemoMode: React.FC = () => {
  const {
    controlMode,
    enableDemoMode,
    disableDemoMode,
    setDemoGazePosition,
    triggerDemoBlink,
    gazePoint,
    gazeRegion,
    hoveredTargetLabel,
    dwellProgress,
    activeRoom,
    setActiveRoom,
    appliances,
  } = useGazeHome();

  const [cursorFollow, setCursorFollow] = useState(true);
  const roomAppliances = appliances.filter((a) => a.roomId === activeRoom);

  // Keyboard arrow keys & blink simulation shortcuts (1=single, 2=double, 3=long)
  useEffect(() => {
    if (controlMode !== 'demo-simulation') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 0.04;
      const cur = gazePoint ?? { x: 0.5, y: 0.5 };
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCursorFollow(false);
        setDemoGazePosition(cur.x - step, cur.y, 'demo-keyboard');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCursorFollow(false);
        setDemoGazePosition(cur.x + step, cur.y, 'demo-keyboard');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursorFollow(false);
        setDemoGazePosition(cur.x, cur.y - step, 'demo-keyboard');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursorFollow(false);
        setDemoGazePosition(cur.x, cur.y + step, 'demo-keyboard');
      } else if (e.key === '1') {
        triggerDemoBlink('single');
      } else if (e.key === '2') {
        triggerDemoBlink('double');
      } else if (e.key === '3') {
        triggerDemoBlink('long');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controlMode, gazePoint, setDemoGazePosition, triggerDemoBlink]);

  // Cursor movement tracking when cursorFollow is enabled in Demo Mode
  useEffect(() => {
    if (controlMode !== 'demo-simulation' || !cursorFollow) return;
    const handleMove = (e: MouseEvent) => {
      setDemoGazePosition(
        e.clientX / Math.max(1, window.innerWidth),
        e.clientY / Math.max(1, window.innerHeight),
        'demo-cursor'
      );
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [controlMode, cursorFollow, setDemoGazePosition]);

  const moveBy = (dx: number, dy: number) => {
    setCursorFollow(false);
    const cur = gazePoint ?? { x: 0.5, y: 0.5 };
    setDemoGazePosition(cur.x + dx, cur.y + dy, 'demo-keyboard');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border-2 border-cyan-300 bg-cyan-50/70 p-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-800 px-2 py-0.5 text-xs font-bold text-white">
              DEMO SIMULATION
            </span>
            <span className="text-xs font-medium text-cyan-900">
              Hardware-free evaluation mode (isolated from webcam data)
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Demo Gaze Simulator</h1>
          <p className="mt-1 text-sm text-slate-700">
            Test dwell selection, blink confirmation, and smart home animations using your cursor or arrow keys when a webcam is unavailable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {controlMode !== 'demo-simulation' ? (
            <button
              type="button"
              onClick={enableDemoMode}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600"
            >
              <MousePointerClick className="h-4 w-4" />
              Activate Demo Simulation
            </button>
          ) : (
            <button
              type="button"
              onClick={disableDemoMode}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Stop Demo Simulation
            </button>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-[#E2E0F0] bg-white p-5 lg:col-span-5">
          <h2 className="text-sm font-bold text-slate-900">Simulated Gaze Input</h2>
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={cursorFollow}
                onChange={(e) => setCursorFollow(e.target.checked)}
                className="h-4 w-4 accent-cyan-700"
              />
              Follow mouse pointer as simulated gaze
            </label>
            <span className="font-mono text-xs tabular-nums text-slate-500">
              {gazeRegion ?? 'Inactive'}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            {/* Arrow Pad */}
            <div className="grid grid-cols-3 gap-1.5">
              <div />
              <button
                type="button"
                aria-label="Move simulated gaze up"
                onClick={() => moveBy(0, -0.06)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <div />
              <button
                type="button"
                aria-label="Move simulated gaze left"
                onClick={() => moveBy(-0.06, 0)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Center simulated gaze"
                onClick={() => {
                  setCursorFollow(false);
                  setDemoGazePosition(0.5, 0.5, 'demo-keyboard');
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold hover:bg-slate-100"
              >
                CTR
              </button>
              <button
                type="button"
                aria-label="Move simulated gaze right"
                onClick={() => moveBy(0.06, 0)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <div />
              <button
                type="button"
                aria-label="Move simulated gaze down"
                onClick={() => moveBy(0, 0.06)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <div />
            </div>

            <div className="flex-1 text-xs text-slate-600 space-y-1">
              <p>
                Hovered target:{' '}
                <strong className="text-slate-900">{hoveredTargetLabel ?? 'None'}</strong>
              </p>
              <p className="font-mono tabular-nums">
                Dwell: {Math.round(dwellProgress * 100)}%
              </p>
              <p className="text-[11px] text-slate-500">
                Arrow keys nudge gaze · Keys 1/2/3 trigger blinks
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-5 lg:col-span-7">
          <h2 className="text-sm font-bold text-slate-900">Simulate Blink Gestures</h2>
          <p className="mt-1 text-xs text-slate-500">
            Hover any appliance target below and trigger a simulated double blink to confirm immediately, or hold gaze for dwell activation.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => triggerDemoBlink('single')}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              <Eye className="h-4 w-4 text-slate-600" />
              Single Blink (1)
            </button>
            <button
              type="button"
              onClick={() => triggerDemoBlink('double')}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-600"
            >
              <Eye className="h-4 w-4" />
              Double Blink · Confirm (2)
            </button>
            <button
              type="button"
              onClick={() => triggerDemoBlink('long')}
              className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 hover:bg-rose-100"
            >
              <Eye className="h-4 w-4" />
              Long Blink · Cancel (3)
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            {ROOMS.map((r) => (
              <button
                key={r.id}
                type="button"
                data-gaze-target={`room:${r.id}`}
                data-gaze-label={r.name}
                onClick={() => setActiveRoom(r.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  activeRoom === r.id
                    ? 'bg-[#111834] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Full Interactive Smart Room Inside Demo Mode */}
      <SmartRoom roomId={activeRoom} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roomAppliances.map((app) => (
          <ApplianceCard key={app.id} appliance={app} showDetailedControls={false} />
        ))}
      </div>
    </div>
  );
};
