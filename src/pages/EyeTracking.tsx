import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Square, Crosshair, Sparkles, AlertCircle } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { WebcamPreview } from '../components/WebcamPreview';
import { BlinkIndicator } from '../components/BlinkIndicator';

export const EyeTracking: React.FC = () => {
  const {
    controlMode,
    trackingStatus,
    trackingError,
    modelReady,
    modelLoading,
    faceQuality,
    faceCount,
    trackingConfidence,
    averageLuma,
    gazeFeatures,
    gazePoint,
    gazeRegion,
    isCalibratedGaze,
    hoveredTargetLabel,
    dwellProgress,
    preferences,
    updatePreferences,
    startWebcamTracking,
    pauseWebcamTracking,
    resumeWebcamTracking,
    stopWebcamTracking,
    enableDemoMode,
  } = useGazeHome();

  const qualityLabel = () => {
    if (controlMode !== 'webcam-gaze') return 'Camera inactive';
    if (faceQuality === 'good') return 'Good · Face & iris locked';
    if (faceQuality === 'fair') return 'Fair · Center your face';
    if (faceQuality === 'low-light') return 'Low light · Improve illumination';
    if (faceQuality === 'multiple-faces') return `Multiple faces (${faceCount}) detected`;
    return 'Face not detected';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E0F0] bg-white p-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Eye-Gaze Control Panel</h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor real-time MediaPipe facial and iris landmarks, gaze estimation coordinates, dwell progress, and tracking quality.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {controlMode !== 'webcam-gaze' ? (
            <button
              type="button"
              onClick={() => startWebcamTracking()}
              disabled={modelLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {modelLoading ? 'Loading Model…' : 'Enable Gaze Control'}
            </button>
          ) : (
            <>
              {trackingStatus === 'active' ? (
                <button
                  type="button"
                  onClick={pauseWebcamTracking}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Pause className="h-4 w-4" />
                  Pause Gaze
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeWebcamTracking}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600"
                >
                  <Play className="h-4 w-4" />
                  Resume Gaze
                </button>
              )}
              <button
                type="button"
                onClick={stopWebcamTracking}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                <Square className="h-4 w-4" />
                Stop Tracking
              </button>
            </>
          )}

          <Link
            to="/calibration"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E0F0] bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Crosshair className="h-4 w-4 text-violet-700" />
            Recalibrate
          </Link>
        </div>
      </div>

      {trackingError && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-semibold">Webcam Tracking Unavailable</p>
              <p className="text-xs text-amber-900">{trackingError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={enableDemoMode}
            className="shrink-0 rounded-lg bg-amber-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-800"
          >
            Switch to Demo Mode
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Live Camera Feed + Landmark Overlay */}
        <div className="space-y-4 lg:col-span-6">
          <WebcamPreview showLandmarks />
          <BlinkIndicator />
        </div>

        {/* Real-Time Telemetry & Tuning */}
        <div className="space-y-4 lg:col-span-6">
          <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
            <h2 className="text-base font-bold text-slate-900">Real-Time CV Telemetry</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Face & Model Status</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {modelReady ? 'Landmarker Ready' : modelLoading ? 'Loading WASM…' : 'Standby'}
                </dd>
                <dd className="text-xs text-slate-500">{qualityLabel()}</dd>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Tracking Confidence</dt>
                <dd className="mt-1 font-mono text-lg font-bold tabular-nums text-violet-700">
                  {controlMode === 'webcam-gaze' ? `${trackingConfidence}%` : '—'}
                </dd>
                <dd className="font-mono text-xs tabular-nums text-slate-500">
                  Scene luma: {averageLuma}/255
                </dd>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Estimated Gaze Position</dt>
                <dd className="mt-1 font-mono text-sm font-bold tabular-nums text-slate-900">
                  {gazePoint
                    ? `(${(gazePoint.x * 100).toFixed(1)}%, ${(gazePoint.y * 100).toFixed(1)}%)`
                    : 'No gaze output'}
                </dd>
                <dd className="text-xs text-slate-500">
                  {gazeRegion ?? '—'}{' '}
                  {gazePoint && controlMode === 'webcam-gaze' && !isCalibratedGaze
                    ? '· Uncalibrated'
                    : ''}
                </dd>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Active Dwell Target</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {hoveredTargetLabel ?? 'None selected'}
                </dd>
                <dd className="font-mono text-xs tabular-nums text-cyan-700">
                  Dwell progress: {Math.round(dwellProgress * 100)}%
                </dd>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Iris Vector (X / Y)</dt>
                <dd className="mt-1 font-mono text-xs font-semibold tabular-nums text-slate-900">
                  {gazeFeatures
                    ? `${gazeFeatures.irisOffsetX.toFixed(4)} / ${gazeFeatures.irisOffsetY.toFixed(4)}`
                    : '—'}
                </dd>
                <dd className="text-xs text-slate-500">
                  {gazeFeatures?.irisDetected ? '478 iris landmarks' : 'Waiting for landmarks'}
                </dd>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Control Mode</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {controlMode === 'webcam-gaze'
                    ? 'Webcam Eye Gaze'
                    : controlMode === 'demo-simulation'
                    ? 'Demo Simulation'
                    : 'Manual'}
                </dd>
                <dd className="text-xs text-slate-500">Local browser inference</dd>
              </div>
            </dl>
          </div>

          {/* Live Sensitivity & Dwell Controls */}
          <div className="rounded-xl border border-[#E2E0F0] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Gaze Interaction Tuning</h2>
              <Link
                to="/gestures"
                className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Test Blink Gestures
              </Link>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <label htmlFor="dwell-slider">Dwell Activation Time</label>
                <span className="font-mono tabular-nums">
                  {(preferences.dwellDurationMs / 1000).toFixed(1)}s
                </span>
              </div>
              <input
                id="dwell-slider"
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
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <label htmlFor="sens-slider">Tracking Sensitivity</label>
                <span className="font-mono tabular-nums">{preferences.sensitivity.toFixed(2)}x</span>
              </div>
              <input
                id="sens-slider"
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
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <label htmlFor="smooth-slider">Gaze Smoothing (Lower = Smoother)</label>
                <span className="font-mono tabular-nums">{preferences.smoothingAlpha.toFixed(2)}</span>
              </div>
              <input
                id="smooth-slider"
                type="range"
                min={0.1}
                max={0.6}
                step={0.02}
                value={preferences.smoothingAlpha}
                onChange={(e) => updatePreferences({ smoothingAlpha: Number(e.target.value) })}
                className="mt-1.5 h-2 w-full accent-violet-700"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
