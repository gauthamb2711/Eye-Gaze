import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf, Moon, PowerOff } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { ROOMS } from '../services/applianceSimulationService';

export const Rooms: React.FC = () => {
  const { appliances, activeRoom, setActiveRoom, applyRoomPreset } = useGazeHome();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E2E0F0] bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Room Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Inspect appliance states per room, apply quick accessibility presets, or switch the active room for gaze control.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ROOMS.map((room) => {
          const items = appliances.filter((a) => a.roomId === room.id);
          const activeCount = items.filter((a) =>
            a.type === 'door' ? !a.isLocked : a.isOn
          ).length;
          const isCurrent = activeRoom === room.id;

          return (
            <div
              key={room.id}
              className={`flex flex-col justify-between rounded-2xl border bg-white p-6 transition-all ${
                isCurrent ? 'border-violet-600 ring-2 ring-violet-100' : 'border-[#E2E0F0]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{room.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">{room.description}</p>
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums text-violet-700 whitespace-nowrap">
                    {activeCount}/{items.length} active
                  </span>
                </div>

                <ul className="mt-4 divide-y divide-slate-100 text-sm">
                  {items.map((item) => {
                    const on = item.type === 'door' ? !item.isLocked : item.isOn;
                    return (
                      <li key={item.id} className="flex items-center justify-between py-2">
                        <span className="text-slate-700">{item.name}</span>
                        <span
                          className={`font-mono text-xs font-semibold ${
                            on ? 'text-violet-700' : 'text-slate-400'
                          }`}
                        >
                          {item.type === 'door'
                            ? item.isLocked
                              ? 'LOCKED'
                              : 'UNLOCKED'
                            : item.type === 'curtains'
                            ? `${item.curtainPosition ?? 0}%`
                            : item.isOn
                            ? 'ON'
                            : 'OFF'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyRoomPreset(room.id, 'all-off')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <PowerOff className="h-3.5 w-3.5" />
                    All Off
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRoomPreset(room.id, 'eco')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    <Leaf className="h-3.5 w-3.5" />
                    Eco
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRoomPreset(room.id, 'night-lock')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                  >
                    <Moon className="h-3.5 w-3.5" />
                    Night
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveRoom(room.id);
                    navigate('/simulator');
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111834] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Open {room.name} in Simulator
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
