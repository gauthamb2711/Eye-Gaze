import React from 'react';
import { useGazeHome } from '../context/GazeHomeContext';
import { DwellIndicator } from './DwellIndicator';

export const GazeCursor: React.FC = () => {
  const {
    controlMode,
    trackingStatus,
    gazePoint,
    hoveredTargetId,
    hoveredTargetLabel,
    dwellProgress,
    inCooldown,
    faceQuality,
  } = useGazeHome();

  const isWebcamActive = controlMode === 'webcam-gaze' && trackingStatus === 'active';
  const isDemoActive = controlMode === 'demo-simulation';

  if ((!isWebcamActive && !isDemoActive) || !gazePoint) {
    return null;
  }

  const unreliable = isWebcamActive && (faceQuality === 'lost' || faceQuality === 'multiple-faces');
  if (unreliable) return null;

  const leftPct = `${(gazePoint.x * 100).toFixed(2)}%`;
  const topPct = `${(gazePoint.y * 100).toFixed(2)}%`;

  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
      style={{
        left: leftPct,
        top: topPct,
        transition: isDemoActive ? 'left 45ms linear, top 45ms linear' : 'left 65ms linear, top 65ms linear',
      }}
      aria-hidden="true"
    >
      <div className="relative flex items-center justify-center">
        <DwellIndicator
          progress={hoveredTargetId ? dwellProgress : 0}
          size={hoveredTargetId ? 54 : 38}
          strokeWidth={4}
          isDemo={isDemoActive}
        />
        <div
          className={`absolute h-3 w-3 rounded-full border-2 border-white shadow-sm ${
            inCooldown
              ? 'bg-emerald-500'
              : isDemoActive
              ? 'bg-cyan-600'
              : 'bg-violet-700'
          }`}
        />
      </div>
      {(hoveredTargetLabel || isDemoActive) && (
        <div className="mt-1 whitespace-nowrap rounded-md bg-slate-950/90 px-2 py-0.5 text-center text-[11px] font-medium text-white shadow-sm">
          {hoveredTargetId && hoveredTargetLabel
            ? `${hoveredTargetLabel} · ${Math.round(dwellProgress * 100)}%`
            : 'DEMO GAZE'}
        </div>
      )}
    </div>
  );
};
