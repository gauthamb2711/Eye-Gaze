import React from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { BrainCircuit, Crosshair, RotateCcw } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { GAZE_REGIONS } from '../services/mlTrainingService';

export const MachineLearningLab: React.FC = () => {
  const {
    calibrationProfile,
    mlMetrics,
    trainMlClassifier,
    resetCalibration,
    mlPredictedRegion,
    gazeRegion,
    predictionHistory,
  } = useGazeHome();

  const sampleCount = calibrationProfile?.samples.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E0F0] bg-white p-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Machine Learning Gaze Lab</h1>
          <p className="mt-1 text-sm text-slate-600">
            Train a genuine TensorFlow.js neural network on your collected eye-landmark calibration samples to classify gaze across 9 screen regions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {calibrationProfile && (
            <button
              type="button"
              onClick={resetCalibration}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Calibration
            </button>
          )}
          <button
            type="button"
            disabled={sampleCount < 18 || mlMetrics.trainingInProgress}
            onClick={() => trainMlClassifier()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BrainCircuit className="h-4 w-4" />
            {mlMetrics.trainingInProgress
              ? 'Training Model…'
              : mlMetrics.trained
              ? 'Retrain TF.js Classifier'
              : 'Train TF.js Classifier'}
          </button>
        </div>
      </div>

      {sampleCount < 18 && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">No Calibration Training Data Available</p>
            <p className="text-xs text-amber-900">
              Complete Eye Calibration first so the ML model can train on your genuine iris and head-pose samples.
            </p>
          </div>
          <Link
            to="/calibration"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-800 shrink-0"
          >
            <Crosshair className="h-3.5 w-3.5" />
            Run Calibration
          </Link>
        </div>
      )}

      {/* Honest Model Telemetry Strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs text-slate-500">Collected Samples</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {sampleCount}
          </p>
          <p className="text-xs text-slate-500">
            {calibrationProfile ? `${calibrationProfile.pointCount}-point grid` : 'Uncalibrated'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs text-slate-500">Classifier Status</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {mlMetrics.trainingInProgress
              ? 'Training…'
              : mlMetrics.trained
              ? 'Trained (TF.js)'
              : 'Not Trained'}
          </p>
          <p className="font-mono text-xs tabular-nums text-slate-500">
            {mlMetrics.trained ? `${mlMetrics.trainCount} train / ${mlMetrics.valCount} val` : 'Requires calibration'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs text-slate-500">Regression RMSE</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-violet-700">
            {calibrationProfile ? `~${calibrationProfile.validationErrorPx}px` : '—'}
          </p>
          <p className="font-mono text-xs tabular-nums text-slate-500">
            {calibrationProfile ? `R² = ${calibrationProfile.r2Score}` : 'No regression fit'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-4">
          <p className="text-xs text-slate-500">Validation Accuracy</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-cyan-700">
            {mlMetrics.valAccuracy !== null ? `${mlMetrics.valAccuracy}%` : '—'}
          </p>
          <p className="font-mono text-xs tabular-nums text-slate-500">
            {mlMetrics.finalLoss !== null ? `Loss ${mlMetrics.finalLoss}` : '80/20 held-out split'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Training Loss Chart */}
        <div className="rounded-xl border border-[#E2E0F0] bg-white p-5 lg:col-span-6">
          <h2 className="text-base font-bold text-slate-900">Training & Validation Loss Curve</h2>
          <p className="text-xs text-slate-500">
            40-epoch TensorFlow.js MLP optimization across your real iris feature vectors.
          </p>
          {mlMetrics.lossHistory.length === 0 ? (
            <div className="mt-4 flex h-56 items-center justify-center rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              {mlMetrics.error ?? 'Train the classifier after completing calibration to inspect real epoch loss.'}
            </div>
          ) : (
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mlMetrics.lossHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} width={40} />
                  <Tooltip />
                  <Line type="monotone" dataKey="loss" name="Train Loss" stroke="#6D28D9" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="valLoss" name="Val Loss" stroke="#0891B2" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 9-Region Live Classifier Grid */}
        <div className="rounded-xl border border-[#E2E0F0] bg-white p-5 lg:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">9-Region Gaze Classifier Output</h2>
              <p className="text-xs text-slate-500">
                Highlights the active screen sector predicted by TF.js or geometric mapping.
              </p>
            </div>
            {mlPredictedRegion && (
              <span className="font-mono text-xs font-semibold tabular-nums text-violet-700">
                {mlPredictedRegion.confidence}% conf
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {GAZE_REGIONS.map((reg) => {
              const isMlActive = mlPredictedRegion?.region === reg;
              const isRegActive = gazeRegion === reg;
              return (
                <div
                  key={reg}
                  className={`flex min-h-[64px] flex-col items-center justify-center rounded-xl border p-2 text-center transition-colors ${
                    isMlActive
                      ? 'border-violet-700 bg-violet-700 text-white'
                      : isRegActive
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-950'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] font-bold tracking-tight">{reg}</span>
                  {isMlActive && (
                    <span className="mt-0.5 font-mono text-[10px]">TF.js Match</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Gaze Prediction History */}
      <section className="rounded-xl border border-[#E2E0F0] bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">Live Gaze Prediction History</h2>
        {predictionHistory.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Start webcam tracking to record live regression coordinates and 9-region classifier predictions.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="py-2 pr-4 font-medium">Timestamp</th>
                  <th className="py-2 pr-4 font-medium">Coords (X, Y)</th>
                  <th className="py-2 pr-4 font-medium">Regression Region</th>
                  <th className="py-2 pr-4 font-medium">TF.js Classifier</th>
                  <th className="py-2 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {predictionHistory.slice(0, 10).map((p, idx) => (
                  <tr key={`${p.timestamp}-${idx}`} className="text-slate-700">
                    <td className="py-2 pr-4 text-slate-500">
                      {new Date(p.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 pr-4">
                      ({p.x}, {p.y})
                    </td>
                    <td className="py-2 pr-4 font-sans font-medium">{p.region}</td>
                    <td className="py-2 pr-4 font-sans">{p.mlRegion ?? 'Untrained'}</td>
                    <td className="py-2">{p.mlConfidence !== null ? `${p.mlConfidence}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
