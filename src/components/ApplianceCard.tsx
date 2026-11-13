import React from 'react';
import {
  Lightbulb,
  Fan,
  Wind,
  Tv,
  Lock,
  Unlock,
  Blinds,
  Minus,
  Plus,
} from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { LIGHT_COLORS, nextAcMode, TV_CHANNELS } from '../services/applianceSimulationService';
import { ApplianceState } from '../types';
import { DwellIndicator } from './DwellIndicator';

interface ApplianceCardProps {
  appliance: ApplianceState;
  showDetailedControls?: boolean;
}

export const ApplianceCard: React.FC<ApplianceCardProps> = ({
  appliance,
  showDetailedControls = true,
}) => {
  const { toggleAppliance, updateAppliance, hoveredTargetId, dwellProgress, controlMode } =
    useGazeHome();

  const targetId = `appliance:${appliance.id}`;
  const isHovered = hoveredTargetId === targetId;

  const isActive = appliance.type === 'door' ? !appliance.isLocked : appliance.isOn;

  const renderIcon = () => {
    const cls = `h-6 w-6 ${isActive ? 'text-violet-700' : 'text-slate-500'}`;
    switch (appliance.type) {
      case 'light':
        return <Lightbulb className={cls} />;
      case 'fan':
        return <Fan className={cls} />;
      case 'ac':
        return <Wind className={cls} />;
      case 'tv':
        return <Tv className={cls} />;
      case 'door':
        return appliance.isLocked ? (
          <Lock className="h-6 w-6 text-slate-700" />
        ) : (
          <Unlock className="h-6 w-6 text-emerald-700" />
        );
      case 'curtains':
        return <Blinds className={cls} />;
    }
  };

  const statusText = () => {
    if (appliance.type === 'door') return appliance.isLocked ? 'Locked' : 'Unlocked';
    if (appliance.type === 'curtains') {
      return `${appliance.curtainPosition ?? (appliance.isOn ? 100 : 0)}% Open`;
    }
    if (!appliance.isOn) return 'Off';
    if (appliance.type === 'light') return `On · ${appliance.brightness ?? 80}%`;
    if (appliance.type === 'fan') return `On · Speed ${appliance.speed ?? 3}`;
    if (appliance.type === 'ac') {
      return `${appliance.temperature ?? 22}°C · ${(appliance.acMode ?? 'cool').toUpperCase()}`;
    }
    if (appliance.type === 'tv') return `On · Ch ${appliance.channel ?? 1}`;
    return 'On';
  };

  return (
    <div
      className={`rounded-xl border bg-white p-4 transition-all ${
        isHovered
          ? 'border-violet-600 ring-4 ring-violet-200'
          : isActive
          ? 'border-violet-200'
          : 'border-[#E2E0F0]'
      }`}
    >
      {/* Primary Large Gaze-Selectable Toggle Area */}
      <button
        type="button"
        data-gaze-target={targetId}
        data-gaze-label={appliance.name}
        onClick={() => toggleAppliance(appliance.id, 'manual')}
        className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              isActive ? 'bg-violet-50' : 'bg-slate-100'
            }`}
          >
            {renderIcon()}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{appliance.name}</h3>
            <p className="font-mono text-xs tabular-nums text-slate-600">{statusText()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isHovered && (
            <DwellIndicator
              progress={dwellProgress}
              size={36}
              strokeWidth={3.5}
              isDemo={controlMode === 'demo-simulation'}
            />
          )}
          <span
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
              appliance.type === 'door'
                ? appliance.isLocked
                  ? 'bg-slate-900 text-white'
                  : 'bg-emerald-600 text-white'
                : isActive
                ? 'bg-violet-700 text-white'
                : 'bg-slate-200 text-slate-800'
            }`}
          >
            {appliance.type === 'door'
              ? appliance.isLocked
                ? 'Unlock'
                : 'Lock'
              : appliance.type === 'curtains'
              ? appliance.isOn
                ? 'Close'
                : 'Open'
              : isActive
              ? 'Turn Off'
              : 'Turn On'}
          </span>
        </div>
      </button>

      {/* Secondary Granular Controls */}
      {showDetailedControls && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {appliance.type === 'light' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-600">Brightness</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={appliance.brightness ?? 80}
                  aria-label={`${appliance.name} brightness`}
                  onChange={(e) =>
                    updateAppliance(
                      appliance.id,
                      { brightness: Number(e.target.value), isOn: true },
                      `Brightness set to ${e.target.value}%`
                    )
                  }
                  className="h-2 w-32 accent-violet-700"
                />
                <span className="w-9 text-right font-mono tabular-nums text-slate-700">
                  {appliance.brightness ?? 80}%
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Color</span>
                <div className="flex items-center gap-1.5">
                  {LIGHT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.name}
                      aria-label={`Set ${appliance.name} color to ${c.name}`}
                      onClick={() =>
                        updateAppliance(
                          appliance.id,
                          { color: c.hex, isOn: true },
                          `Color changed to ${c.name}`
                        )
                      }
                      style={{ backgroundColor: c.hex }}
                      className={`h-6 w-6 rounded-full border transition-transform ${
                        appliance.color === c.hex
                          ? 'scale-110 border-slate-900 ring-2 ring-violet-300'
                          : 'border-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {appliance.type === 'fan' && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600">Speed Level</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() =>
                      updateAppliance(
                        appliance.id,
                        { speed: lvl, isOn: true },
                        `Speed changed to level ${lvl}`
                      )
                    }
                    className={`h-8 w-8 rounded-md font-mono text-xs font-semibold tabular-nums transition-colors ${
                      appliance.speed === lvl && appliance.isOn
                        ? 'bg-cyan-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {appliance.type === 'ac' && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Decrease AC temperature"
                  onClick={() => {
                    const nextTemp = Math.max(16, (appliance.temperature ?? 22) - 1);
                    updateAppliance(
                      appliance.id,
                      { temperature: nextTemp, isOn: true },
                      `Temperature changed to ${nextTemp}°C`
                    );
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-12 text-center font-mono text-sm font-semibold tabular-nums text-slate-900">
                  {appliance.temperature ?? 22}°C
                </span>
                <button
                  type="button"
                  aria-label="Increase AC temperature"
                  onClick={() => {
                    const nextTemp = Math.min(30, (appliance.temperature ?? 22) + 1);
                    updateAppliance(
                      appliance.id,
                      { temperature: nextTemp, isOn: true },
                      `Temperature changed to ${nextTemp}°C`
                    );
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = nextAcMode(appliance.acMode);
                  updateAppliance(
                    appliance.id,
                    { acMode: next, isOn: true },
                    `Cooling mode set to ${next.toUpperCase()}`
                  );
                }}
                className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold uppercase text-slate-700 hover:bg-slate-200"
              >
                Mode: {appliance.acMode ?? 'cool'}
              </button>
            </div>
          )}

          {appliance.type === 'tv' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">Channel</span>
                <select
                  aria-label="Select TV channel"
                  value={appliance.channel ?? 1}
                  onChange={(e) => {
                    const ch = Number(e.target.value);
                    const chName = TV_CHANNELS.find((c) => c.number === ch)?.name ?? `Channel ${ch}`;
                    updateAppliance(
                      appliance.id,
                      { channel: ch, isOn: true },
                      `Switched to ${chName}`
                    );
                  }}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                >
                  {TV_CHANNELS.map((c) => (
                    <option key={c.number} value={c.number}>
                      Ch {c.number}: {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={appliance.volume ?? 40}
                  aria-label="TV volume"
                  onChange={(e) =>
                    updateAppliance(
                      appliance.id,
                      { volume: Number(e.target.value), isOn: true },
                      `Volume set to ${e.target.value}%`
                    )
                  }
                  className="h-2 w-32 accent-violet-700"
                />
                <span className="w-9 text-right font-mono tabular-nums text-slate-700">
                  {appliance.volume ?? 40}%
                </span>
              </div>
            </div>
          )}

          {appliance.type === 'curtains' && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">Position</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={appliance.curtainPosition ?? 50}
                aria-label="Curtain position"
                onChange={(e) => {
                  const pos = Number(e.target.value);
                  updateAppliance(
                    appliance.id,
                    { curtainPosition: pos, isOn: pos > 0 },
                    `Curtains set to ${pos}% open`
                  );
                }}
                className="h-2 w-32 accent-violet-700"
              />
              <span className="w-10 text-right font-mono tabular-nums text-slate-700">
                {appliance.curtainPosition ?? 50}%
              </span>
            </div>
          )}

          {appliance.type === 'door' && (
            <p className="text-xs text-slate-500">
              {appliance.isLocked
                ? 'Security lock engaged. Confirmation required before unlocking.'
                : 'Door is currently unlocked. Gaze or click to lock.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
