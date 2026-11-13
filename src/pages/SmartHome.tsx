import React from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, Play, MousePointerClick } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { ROOMS } from '../services/applianceSimulationService';
import { SmartRoom } from '../components/SmartRoom';
import { ApplianceCard } from '../components/ApplianceCard';
import { DwellIndicator } from '../components/DwellIndicator';

export const SmartHome: React.FC = () => {
  const {
    activeRoom,
    setActiveRoom,
    appliances,
    controlMode,
    trackingStatus,
    hoveredTargetId,
    hoveredTargetLabel,
    dwellProgress,
    calibrationProfile,
    startWebcamTracking,
    enableDemoMode,
  } = useGazeHome();

  const roomAppliances = appliances.filter((a) => a.roomId === activeRoom);

  return (
    <div className="space-y-6">
      {/* Room Switcher & Gaze Status Strip */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E0F0] bg-white p-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Rooms">
          {ROOMS.map((room) => {
            const targetId = `room:${room.id}`;
            const isSelected = activeRoom === room.id;
            const isHovered = hoveredTargetId === targetId;
            return (
              <button
                key={room.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-gaze-target={targetId}
                data-gaze-label={room.name}
                onClick={() => setActiveRoom(room.id)}
                className={`inline-flex min-h-[46px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#111834] text-white'
                    : 'border border-[#E2E0F0] bg-slate-50 text-slate-700 hover:bg-slate-100'
                } ${isHovered ? 'ring-4 ring-violet-300' : ''}`}
              >
                {isHovered && (
                  <DwellIndicator
                    progress={dwellProgress}
                    size={22}
                    strokeWidth={3}
                    isDemo={controlMode === 'demo-simulation'}
                  />
                )}
                {room.name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {controlMode === 'off' ? (
            <>
              <button
                type="button"
                onClick={() => startWebcamTracking()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-600"
              >
                <Play className="h-3.5 w-3.5" />
                Start Eye Control
              </button>
              <button
                type="button"
                onClick={enableDemoMode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 font-semibold text-cyan-800 hover:bg-cyan-100"
              >
                <MousePointerClick className="h-3.5 w-3.5" />
                Demo Gaze
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 font-mono text-slate-700">
              <span>
                {controlMode === 'demo-simulation'
                  ? 'DEMO SIMULATION'
                  : trackingStatus === 'active'
                  ? 'WEBCAM GAZE ACTIVE'
                  : 'WEBCAM PAUSED'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Target: {hoveredTargetLabel ? `${hoveredTargetLabel} (${Math.round(dwellProgress * 100)}%)` : 'Look at any appliance'}
              </span>
            </div>
          )}

          {controlMode === 'webcam-gaze' && !calibrationProfile && (
            <Link
              to="/calibration"
              className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 font-semibold text-amber-900 hover:bg-amber-200"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Calibrate Eyes
            </Link>
          )}
        </div>
      </div>

      {/* Main Architectural Interactive Simulator */}
      <SmartRoom roomId={activeRoom} />

      {/* Large Gaze-Target Appliance Grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Appliance Targets · {ROOMS.find((r) => r.id === activeRoom)?.name}
          </h2>
          <p className="text-xs text-slate-500">
            Look at any hotspot inside the room or any card below and hold gaze (or double-blink) to toggle.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roomAppliances.map((app) => (
            <ApplianceCard key={app.id} appliance={app} />
          ))}
        </div>
      </section>
    </div>
  );
};
