import React from 'react';
import { ShieldAlert, Unlock, X } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { DwellIndicator } from './DwellIndicator';

export const DoorConfirmModal: React.FC = () => {
  const {
    pendingDoorUnlock,
    confirmPendingDoorUnlock,
    cancelPendingDoorUnlock,
    hoveredTargetId,
    dwellProgress,
    controlMode,
  } = useGazeHome();

  if (!pendingDoorUnlock) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="door-confirm-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E2E0F0] bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 id="door-confirm-title" className="text-lg font-bold text-slate-900">
              Confirm Unlocking {pendingDoorUnlock.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Safety confirmation is enabled for smart locks. Gaze at Confirm Unlock or use double-blink / click to proceed.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            data-gaze-target="door-confirm-unlock"
            data-gaze-label="Confirm Unlock"
            onClick={confirmPendingDoorUnlock}
            className={`flex min-h-[64px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-all ${
              hoveredTargetId === 'door-confirm-unlock' ? 'ring-4 ring-emerald-300' : ''
            }`}
          >
            {hoveredTargetId === 'door-confirm-unlock' && (
              <DwellIndicator
                progress={dwellProgress}
                size={28}
                strokeWidth={3}
                isDemo={controlMode === 'demo-simulation'}
              />
            )}
            <Unlock className="h-4 w-4" />
            Confirm Unlock
          </button>

          <button
            type="button"
            data-gaze-target="door-cancel-unlock"
            data-gaze-label="Cancel Unlock"
            onClick={cancelPendingDoorUnlock}
            className={`flex min-h-[64px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-all ${
              hoveredTargetId === 'door-cancel-unlock' ? 'ring-4 ring-violet-300' : ''
            }`}
          >
            {hoveredTargetId === 'door-cancel-unlock' && (
              <DwellIndicator
                progress={dwellProgress}
                size={28}
                strokeWidth={3}
                isDemo={controlMode === 'demo-simulation'}
              />
            )}
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
