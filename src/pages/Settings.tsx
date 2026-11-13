import React, { useEffect } from 'react';
import { Volume2, Download, Trash2, RotateCcw, ShieldCheck } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { speechService } from '../services/speechService';

export const Settings: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    cameras,
    refreshCameras,
    controlMode,
    enableDemoMode,
    disableDemoMode,
    resetCalibration,
    clearHistory,
    exportAllData,
    calibrationProfile,
  } = useGazeHome();

  useEffect(() => {
    refreshCameras();
  }, [refreshCameras]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E2E0F0] bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings, Accessibility & Privacy</h1>
        <p className="mt-1 text-sm text-slate-600">
          Customize dwell timing, tracking sensitivity, voice feedback, visual contrast, camera source, and local browser storage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tracking & Calibration Settings */}
        <section className="rounded-xl border border-[#E2E0F0] bg-white p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900">Camera & Gaze Calibration</h2>

          <div>
            <label htmlFor="camera-select" className="text-xs font-semibold text-slate-700">
              Preferred Webcam Device
            </label>
            <div className="mt-1.5 flex gap-2">
              <select
                id="camera-select"
                value={preferences.preferredCameraId}
                onChange={(e) => updatePreferences({ preferredCameraId: e.target.value })}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="">System Default Camera</option>
                {cameras.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={refreshCameras}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <label htmlFor="set-dwell">Dwell Duration</label>
              <span className="font-mono tabular-nums">
                {(preferences.dwellDurationMs / 1000).toFixed(1)}s
              </span>
            </div>
            <input
              id="set-dwell"
              type="range"
              min={800}
              max={3000}
              step={100}
              value={preferences.dwellDurationMs}
              onChange={(e) => updatePreferences({ dwellDurationMs: Number(e.target.value) })}
              className="mt-1.5 h-2 w-full accent-violet-700"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <label htmlFor="set-sens">Gaze Sensitivity</label>
              <span className="font-mono tabular-nums">{preferences.sensitivity.toFixed(2)}x</span>
            </div>
            <input
              id="set-sens"
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={preferences.sensitivity}
              onChange={(e) => updatePreferences({ sensitivity: Number(e.target.value) })}
              className="mt-1.5 h-2 w-full accent-cyan-700"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <label htmlFor="set-blink">Blink EAR Threshold</label>
              <span className="font-mono tabular-nums">
                {preferences.blinkEarThreshold.toFixed(2)}
              </span>
            </div>
            <input
              id="set-blink"
              type="range"
              min={0.14}
              max={0.28}
              step={0.01}
              value={preferences.blinkEarThreshold}
              onChange={(e) => updatePreferences({ blinkEarThreshold: Number(e.target.value) })}
              className="mt-1.5 h-2 w-full accent-violet-700"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Demo Simulation Mode</p>
              <p className="text-xs text-slate-500">Test all features without a webcam.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                controlMode === 'demo-simulation' ? disableDemoMode() : enableDemoMode()
              }
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold ${
                controlMode === 'demo-simulation'
                  ? 'bg-cyan-700 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
              }`}
            >
              {controlMode === 'demo-simulation' ? 'Disable Demo' : 'Enable Demo'}
            </button>
          </div>
        </section>

        {/* Accessibility & Voice Feedback */}
        <section className="rounded-xl border border-[#E2E0F0] bg-white p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900">Accessibility & Voice Feedback</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Voice Feedback</p>
              <p className="text-xs text-slate-500">
                {speechService.isSupported()
                  ? 'Speaks appliance actions using browser SpeechSynthesis.'
                  : 'SpeechSynthesis API is not available in this browser.'}
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Enable voice feedback"
              checked={preferences.voiceEnabled}
              onChange={(e) => updatePreferences({ voiceEnabled: e.target.checked })}
              className="h-5 w-5 accent-violet-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <label htmlFor="voice-vol">Voice Volume</label>
                <span className="font-mono tabular-nums">
                  {Math.round(preferences.voiceVolume * 100)}%
                </span>
              </div>
              <input
                id="voice-vol"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={preferences.voiceVolume}
                onChange={(e) => updatePreferences({ voiceVolume: Number(e.target.value) })}
                className="mt-1.5 h-2 w-full accent-violet-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <label htmlFor="voice-rate">Speech Rate</label>
                <span className="font-mono tabular-nums">{preferences.voiceRate.toFixed(1)}x</span>
              </div>
              <input
                id="voice-rate"
                type="range"
                min={0.6}
                max={1.6}
                step={0.1}
                value={preferences.voiceRate}
                onChange={(e) => updatePreferences({ voiceRate: Number(e.target.value) })}
                className="mt-1.5 h-2 w-full accent-cyan-700"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              speechService.speak('Voice feedback is active and ready.', {
                enabled: true,
                volume: preferences.voiceVolume,
                rate: preferences.voiceRate,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            <Volume2 className="h-4 w-4 text-violet-700" />
            Test Voice Output
          </button>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">High Contrast Mode</p>
              <p className="text-xs text-slate-500">Strengthens borders and foreground contrast.</p>
            </div>
            <input
              type="checkbox"
              aria-label="Enable high contrast mode"
              checked={preferences.highContrast}
              onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
              className="h-5 w-5 accent-violet-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Interface Font Size</p>
              <p className="text-xs text-slate-500">Enlarges UI labels for easier reading.</p>
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {(['normal', 'large', 'xl'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => updatePreferences({ fontSize: sz })}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
                    preferences.fontSize === sz
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Confirm Smart Door Unlock</p>
              <p className="text-xs text-slate-500">
                Requires confirmation before unlocking any locked door.
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Confirm smart door unlock"
              checked={preferences.confirmDoorUnlock}
              onChange={(e) => updatePreferences({ confirmDoorUnlock: e.target.checked })}
              className="h-5 w-5 accent-violet-700"
            />
          </div>
        </section>
      </div>

      {/* Privacy & Local Data Management */}
      <section className="rounded-xl border border-[#E2E0F0] bg-white p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                On-Device Privacy & Local Data Control
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-600">
                All webcam frames are processed strictly inside your browser memory using MediaPipe WASM and TensorFlow.js. Zero video footage, eye images, or personal telemetry ever leaves your device. Only calibration weights, appliance states, and interaction history are stored in LocalStorage.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={exportAllData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export Local Data
            </button>
            <button
              type="button"
              disabled={!calibrationProfile}
              onClick={resetCalibration}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Calibration
            </button>
            <button
              type="button"
              onClick={clearHistory}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear History
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
