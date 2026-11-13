import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';

export const BlinkIndicator: React.FC = () => {
  const { gazeFeatures, isEyeClosed, lastBlinkEvent, controlMode, preferences } = useGazeHome();

  const ear = gazeFeatures?.avgEar ?? null;
  const earPct = ear !== null ? Math.max(0, Math.min(100, ((ear - 0.1) / 0.25) * 100)) : 0;

  return (
    <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEyeClosed ? (
            <EyeOff className="h-4 w-4 text-violet-700" />
          ) : (
            <Eye className="h-4 w-4 text-cyan-700" />
          )}
          <span className="text-sm font-semibold text-slate-900">Blink & Eye Openness</span>
        </div>
        <span className="font-mono text-xs tabular-nums text-slate-600">
          {ear !== null ? `EAR ${ear.toFixed(3)}` : controlMode === 'demo-simulation' ? 'Demo Mode' : 'No data'}
        </span>
      </div>

      <div className="mt-3">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              isEyeClosed ? 'bg-violet-600' : 'bg-cyan-600'
            }`}
            style={{ width: `${earPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>Threshold {preferences.blinkEarThreshold.toFixed(2)}</span>
          <span>{isEyeClosed ? 'Eyes closed' : ear !== null ? 'Eyes open' : 'Idle'}</span>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
        {lastBlinkEvent ? (
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-800">
              Last gesture: {lastBlinkEvent.type.toUpperCase()} BLINK
            </span>
            <span className="font-mono tabular-nums text-slate-500">
              {lastBlinkEvent.durationMs} ms
            </span>
          </div>
        ) : (
          <span>No blink gesture triggered yet.</span>
        )}
      </div>
    </div>
  );
};
