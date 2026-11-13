import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Play, CheckCircle2 } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { BlinkIndicator } from '../components/BlinkIndicator';
import { WebcamPreview } from '../components/WebcamPreview';

export const GestureRecognition: React.FC = () => {
  const {
    controlMode,
    startWebcamTracking,
    earHistory,
    lastBlinkEvent,
    gazeFeatures,
    preferences,
    updatePreferences,
    stats,
  } = useGazeHome();

  const [testCounter, setTestCounter] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E0F0] bg-white p-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blink Gesture Recognition & Calibration</h1>
          <p className="mt-1 text-sm text-slate-600">
            Detects single, double, and long blinks from MediaPipe Eye Aspect Ratio (EAR) while filtering out normal involuntary blinking.
          </p>
        </div>

        {controlMode !== 'webcam-gaze' && (
          <button
            type="button"
            onClick={() => startWebcamTracking()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 shrink-0"
          >
            <Play className="h-4 w-4" />
            Start Webcam for Live Blink Test
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Live EAR Waveform & Indicator */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Live Eye Aspect Ratio (EAR) Waveform
                </h2>
                <p className="text-xs text-slate-500">
                  Dips below the threshold ({preferences.blinkEarThreshold.toFixed(2)}) register eye closure.
                </p>
              </div>
              <span className="font-mono text-xs tabular-nums text-slate-600">
                L: {gazeFeatures ? gazeFeatures.leftEar.toFixed(3) : '—'} · R:{' '}
                {gazeFeatures ? gazeFeatures.rightEar.toFixed(3) : '—'}
              </span>
            </div>

            {earHistory.length === 0 ? (
              <div className="mt-4 flex h-52 items-center justify-center rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                Start webcam tracking to inspect your real-time Eye Aspect Ratio signal and calibrate blink thresholds.
              </div>
            ) : (
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="t" hide />
                    <YAxis domain={[0.05, 0.42]} tick={{ fontSize: 11, fill: '#475569' }} width={38} />
                    <Tooltip />
                    <ReferenceLine
                      y={preferences.blinkEarThreshold}
                      stroke="#6D28D9"
                      strokeDasharray="4 4"
                      label={{ value: 'Blink Threshold', position: 'insideTopRight', fontSize: 11, fill: '#6D28D9' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#0891B2"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Interactive Gesture Test Pad */}
          <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Gesture Test Zone</h2>
                <p className="text-xs text-slate-500">
                  Look at the pad below and perform a double blink to test confirmation without affecting home appliances.
                </p>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-violet-700">
                Total blinks logged: {stats.totalBlinkGestures}
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <button
                type="button"
                data-gaze-target="action:gesture-test"
                data-gaze-label="Gesture Test Target"
                onClick={() => setTestCounter((c) => c + 1)}
                className="flex min-h-[72px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/70 px-5 py-4 text-sm font-semibold text-violet-900 hover:bg-violet-100 sm:w-auto"
              >
                <CheckCircle2 className="h-5 w-5 text-violet-700" />
                Gaze + Double Blink Test Target (Hits: {testCounter})
              </button>

              <div className="text-right text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  Last detected: {lastBlinkEvent ? `${lastBlinkEvent.type.toUpperCase()} BLINK` : 'None'}
                </p>
                <p className="font-mono tabular-nums text-slate-500">
                  {lastBlinkEvent ? `Duration: ${lastBlinkEvent.durationMs} ms` : 'Perform a blink'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Threshold Calibration & Gesture Mappings */}
        <div className="space-y-4 lg:col-span-5">
          <WebcamPreview compact showLandmarks />
          <BlinkIndicator />

          <div className="rounded-xl border border-[#E2E0F0] bg-white p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Threshold & Action Mapping</h2>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <label htmlFor="ear-thresh">Blink EAR Threshold</label>
                <span className="font-mono tabular-nums">{preferences.blinkEarThreshold.toFixed(2)}</span>
              </div>
              <input
                id="ear-thresh"
                type="range"
                min={0.14}
                max={0.28}
                step={0.01}
                value={preferences.blinkEarThreshold}
                onChange={(e) => updatePreferences({ blinkEarThreshold: Number(e.target.value) })}
                className="mt-1.5 h-2 w-full accent-violet-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <label htmlFor="long-ms">Long Blink Minimum Duration</label>
                <span className="font-mono tabular-nums">{preferences.longBlinkMinMs} ms</span>
              </div>
              <input
                id="long-ms"
                type="range"
                min={450}
                max={1200}
                step={50}
                value={preferences.longBlinkMinMs}
                onChange={(e) => updatePreferences({ longBlinkMinMs: Number(e.target.value) })}
                className="mt-1.5 h-2 w-full accent-cyan-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <label htmlFor="dbl-ms">Double Blink Window</label>
                <span className="font-mono tabular-nums">{preferences.doubleBlinkWindowMs} ms</span>
              </div>
              <input
                id="dbl-ms"
                type="range"
                min={250}
                max={700}
                step={25}
                value={preferences.doubleBlinkWindowMs}
                onChange={(e) => updatePreferences({ doubleBlinkWindowMs: Number(e.target.value) })}
                className="mt-1.5 h-2 w-full accent-violet-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
              <div>
                <label className="font-semibold text-slate-700" htmlFor="dbl-action">
                  Double Blink Action
                </label>
                <select
                  id="dbl-action"
                  value={preferences.doubleBlinkAction}
                  onChange={(e) =>
                    updatePreferences({
                      doubleBlinkAction: e.target.value as 'confirm' | 'toggle' | 'none',
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800"
                >
                  <option value="confirm">Confirm Selection</option>
                  <option value="toggle">Toggle Target</option>
                  <option value="none">Disabled</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700" htmlFor="long-action">
                  Long Blink Action
                </label>
                <select
                  id="long-action"
                  value={preferences.longBlinkAction}
                  onChange={(e) =>
                    updatePreferences({
                      longBlinkAction: e.target.value as 'cancel' | 'pause' | 'none',
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800"
                >
                  <option value="cancel">Cancel / Back</option>
                  <option value="pause">Pause Gaze Control</option>
                  <option value="none">Disabled</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Single blinks are ignored for appliance commands by default so natural involuntary blinking never causes accidental toggles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
