import React, { useState } from 'react';
import { useGazeHome } from '../context/GazeHomeContext';
import { ROOMS } from '../services/applianceSimulationService';
import { ApplianceCard } from '../components/ApplianceCard';
import { RoomId } from '../types';

export const Appliances: React.FC = () => {
  const { appliances } = useGazeHome();
  const [roomFilter, setRoomFilter] = useState<'all' | RoomId>('all');

  const filtered =
    roomFilter === 'all'
      ? appliances
      : appliances.filter((a) => a.roomId === roomFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E0F0] bg-white p-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appliance Control</h1>
          <p className="mt-1 text-sm text-slate-600">
            Fine-tune brightness, colors, fan speed, AC temperature, TV channels, door locks, and curtains. All toggle targets support eye-gaze dwell.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRoomFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              roomFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Rooms
          </button>
          {ROOMS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoomFilter(r.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                roomFilter === r.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((app) => (
          <ApplianceCard key={app.id} appliance={app} showDetailedControls />
        ))}
      </div>
    </div>
  );
};
