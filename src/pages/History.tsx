import React, { useState } from 'react';
import { Download, Search, Trash2 } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { InteractionMethod } from '../types';

export const History: React.FC = () => {
  const { history, clearHistory, exportAllData } = useGazeHome();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | InteractionMethod>('all');

  const filtered = history.filter((entry) => {
    const matchesMethod = methodFilter === 'all' || entry.method === methodFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      entry.applianceName.toLowerCase().includes(q) ||
      entry.action.toLowerCase().includes(q) ||
      entry.roomId.toLowerCase().includes(q);
    return matchesMethod && matchesSearch;
  });

  const exportCsv = () => {
    const header = 'Timestamp,Room,Appliance,Action,Method,GazeRegion\n';
    const rows = filtered
      .map((e) =>
        [
          new Date(e.timestamp).toISOString(),
          e.roomId,
          `"${e.applianceName.replace(/"/g, '""')}"`,
          `"${e.action.replace(/"/g, '""')}"`,
          e.method,
          e.gazeRegion ?? '',
        ].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gazehome-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E0F0] bg-white p-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interaction History</h1>
          <p className="mt-1 text-sm text-slate-600">
            Local audit trail of every appliance command triggered by eye-gaze dwell, blink gestures, manual controls, or demo simulation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E0F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={exportAllData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E0F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={clearHistory}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear History
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#E2E0F0] bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search appliance, room, or action…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-violet-600 focus:outline-none"
          />
        </div>

        <select
          aria-label="Filter by control method"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as 'all' | InteractionMethod)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="all">All Control Methods</option>
          <option value="gaze-dwell">Gaze Dwell</option>
          <option value="double-blink">Double Blink</option>
          <option value="long-blink">Long Blink</option>
          <option value="manual">Manual Fallback</option>
          <option value="demo-cursor">Demo Cursor</option>
          <option value="demo-keyboard">Demo Keyboard</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-700">No interaction records found</p>
            <p className="mt-1 text-xs text-slate-500">
              Interact with appliances in the Smart Home Simulator or Demo Mode to populate your local log.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">Timestamp</th>
                  <th className="py-2.5 pr-4 font-medium">Room</th>
                  <th className="py-2.5 pr-4 font-medium">Appliance</th>
                  <th className="py-2.5 pr-4 font-medium">Action</th>
                  <th className="py-2.5 pr-4 font-medium">Method</th>
                  <th className="py-2.5 font-medium">Gaze Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 pr-4 font-mono text-xs tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 capitalize text-xs text-slate-700">
                      {entry.roomId.replace('-', ' ')}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">
                      {entry.applianceName}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-700">{entry.action}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-violet-700">
                      {entry.method}
                    </td>
                    <td className="py-2.5 font-mono text-xs text-slate-500">
                      {entry.gazeRegion ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
