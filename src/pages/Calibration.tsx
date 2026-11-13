import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Crosshair, RotateCcw, Play } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { calibrationService, getCalibrationPoints } from '../services/calibrationService';
import { CalibrationSample } from '../types';
import { CalibrationPoint } from '../components/CalibrationPoint';
import { WebcamPreview } from '../components/WebcamPreview';

const SAMPLES_PER_POINT = 18;
const SETTLE_DELAY_MS = 450;

export const Calibration: React.FC = () => {
  const {
    controlMode,
    trackingStatus,
    startWebcamTracking,
    latestFeaturesRef,
    faceQuality,
    preferences,
    updatePreferences,
    calibrationProfile,
    saveCalibrationProfile,
    resetCalibration,
  } = useGazeHome();

  const [step, setStep] = useState<'intro' | 'running' | 'complete' | 'error'>('intro');
  const [pointIndex, setPointIndex] = useState(0);
  const [pointProgress, setPointProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const collectedRef = useRef<CalibrationSample[]>([]);
  const pointCount = preferences.calibrationPoints;
  const points = React.useMemo(() => getCalibrationPoints(pointCount), [pointCount]);

  useEffect(() => {
    if (step !== 'running') return;

    let cancelled = false;
    let currentPtSamples = 0;
    const targetPoint = points[pointIndex];
    if (!targetPoint) return;

    const settleTimer = window.setTimeout(() => {
      const sampleInterval = window.setInterval(() => {
        if (cancelled) return;
        const features = latestFeaturesRef.current;
        if (
          controlMode === 'webcam-gaze' &&
          trackingStatus === 'active' &&
          features &&
          (faceQuality === 'good' || faceQuality === 'fair')
        ) {
          collectedRef.current.push(calibrationService.createSample(targetPoint, features));
          currentPtSamples++;
          setPointProgress(currentPtSamples / SAMPLES_PER_POINT);

          if (currentPtSamples >= SAMPLES_PER_POINT) {
            window.clearInterval(sampleInterval);
            if (pointIndex + 1 < points.length) {
              setPointIndex((i) => i + 1);
              setPointProgress(0);
            } else {
              // Train genuine Ridge Regression calibration model
              const result = calibrationService.trainCalibrationModel(
                collectedRef.current,
                pointCount
              );
              if (result.success && result.profile) {
                saveCalibrationProfile(result.profile);
                setStep('complete');
              } else {
                setErrorMsg(result.error ?? 'Calibration failed.');
                setStep('error');
              }
            }
          }
        }
      }, 65);

      return () => window.clearInterval(sampleInterval);
    }, SETTLE_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(settleTimer);
    };
  }, [
    step,
    pointIndex,
    points,
    latestFeaturesRef,
    controlMode,
    trackingStatus,
    faceQuality,
    pointCount,
    saveCalibrationProfile,
  ]);

  const beginCalibration = async () => {
    setErrorMsg(null);
    if (controlMode !== 'webcam-gaze' || trackingStatus !== 'active') {
      const ok = await startWebcamTracking();
      if (!ok) {
        setErrorMsg('Webcam must be active to collect eye calibration landmarks.');
        setStep('error');
        return;
      }
    }
    collectedRef.current = [];
    setPointIndex(0);
    setPointProgress(0);
    setStep('running');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E0F0] bg-white p-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Eye-Gaze Calibration</h1>
          <p className="mt-1 text-sm text-slate-600">
            Map your unique iris and head-pose measurements to screen coordinates using ridge regression and 5-fold validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {calibrationProfile && (
            <button
              type="button"
              onClick={() => {
                resetCalibration();
                setStep('intro');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Profile
            </button>
          )}
          <button
            type="button"
            onClick={beginCalibration}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
          >
            <Crosshair className="h-4 w-4" />
            {step === 'running' ? 'Restart Calibration' : 'Start Calibration'}
          </button>
        </div>
      </div>

      {step === 'running' ? (
        /* Full Calibration Arena */
        <div className="relative h-[72vh] min-h-[480px] w-full overflow-hidden rounded-2xl border-2 border-violet-300 bg-white shadow-sm">
          <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex flex-col items-center text-center">
            <p className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
              Point {pointIndex + 1} of {points.length} · Keep your head still and look at the target dot
            </p>
            {(faceQuality === 'lost' || faceQuality === 'low-light') && (
              <p className="mt-2 rounded bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
                Waiting for clear face & iris landmarks…
              </p>
            )}
          </div>

          {points.map((pt, idx) => (
            <CalibrationPoint
              key={pt.index}
              x={pt.x}
              y={pt.y}
              label={pt.label}
              active={idx === pointIndex}
              completed={idx < pointIndex}
              progress={idx === pointIndex ? pointProgress : idx < pointIndex ? 1 : 0}
            />
          ))}

          <div className="absolute bottom-4 right-4 w-44 overflow-hidden rounded-xl shadow-md">
            <WebcamPreview compact showLandmarks />
          </div>

          <button
            type="button"
            onClick={() => setStep('intro')}
            className="absolute bottom-4 left-4 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel Calibration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            {step === 'complete' && calibrationProfile && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                  <div className="flex-1">
                    <h2 className="text-base font-bold">
                      Calibration Completed · {calibrationProfile.qualityLabel}
                    </h2>
                    <p className="mt-1 text-sm text-emerald-900">
                      Trained on {calibrationProfile.sampleCount} real iris samples across{' '}
                      {calibrationProfile.pointCount} targets. Cross-validation error:{' '}
                      <span className="font-mono font-semibold">
                        ~{calibrationProfile.validationErrorPx}px
                      </span>{' '}
                      (R² = {calibrationProfile.r2Score}).
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to="/simulator"
                        className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                      >
                        Go to Smart Home Simulator
                      </Link>
                      <Link
                        to="/ml-lab"
                        className="rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                      >
                        Train 9-Region ML Classifier
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'error' && errorMsg && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
                  <div>
                    <h2 className="text-base font-bold">Calibration Incomplete</h2>
                    <p className="mt-1 text-sm">{errorMsg}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Calibration Setup & Guidance */}
            <div className="rounded-xl border border-[#E2E0F0] bg-white p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Preparation Checklist</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>1. Sit 50–70 cm from your webcam with your face centered in the frame.</li>
                  <li>2. Ensure balanced front lighting and avoid strong glare or reflections on glasses.</li>
                  <li>3. Keep your head steady and move only your eyes toward each glowing point.</li>
                  <li>4. Keep your webcam stable throughout the calibration and control session.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Calibration Grid</label>
                  <div className="mt-2 flex gap-2">
                    {([5, 9] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => updatePreferences({ calibrationPoints: cnt })}
                        className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                          pointCount === cnt
                            ? 'border-violet-700 bg-violet-50 text-violet-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cnt} Points {cnt === 9 ? '(Recommended)' : '(Quick)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <label htmlFor="cal-sens">Gaze Sensitivity</label>
                    <span className="font-mono tabular-nums">{preferences.sensitivity.toFixed(2)}x</span>
                  </div>
                  <input
                    id="cal-sens"
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    value={preferences.sensitivity}
                    onChange={(e) => updatePreferences({ sensitivity: Number(e.target.value) })}
                    className="mt-3 h-2 w-full accent-violet-700"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={beginCalibration}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-600"
              >
                <Play className="h-4 w-4" />
                Begin {pointCount}-Point Eye Calibration
              </button>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <WebcamPreview showLandmarks />

            <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
              <h2 className="text-sm font-bold text-slate-900">Saved Calibration Profile</h2>
              {calibrationProfile ? (
                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Quality Rating</dt>
                    <dd className="font-semibold text-slate-900">{calibrationProfile.qualityLabel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Points / Samples</dt>
                    <dd className="font-mono tabular-nums text-slate-800">
                      {calibrationProfile.pointCount} pts · {calibrationProfile.sampleCount} samples
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Held-Out Error (RMSE)</dt>
                    <dd className="font-mono tabular-nums text-slate-800">
                      ~{calibrationProfile.validationErrorPx} px ({calibrationProfile.validationErrorNorm})
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Model Fit (R²)</dt>
                    <dd className="font-mono tabular-nums text-slate-800">{calibrationProfile.r2Score}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Created</dt>
                    <dd className="font-mono tabular-nums text-slate-600">
                      {new Date(calibrationProfile.createdAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  No calibration profile saved yet. Complete calibration for accurate gaze selection.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
