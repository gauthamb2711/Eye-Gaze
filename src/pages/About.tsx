import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Cpu, ShieldCheck, Home, Sparkles, Crosshair } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E2E0F0] bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">
          About GazeHome · Eye-Gaze Controlled Smart Home System
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          GazeHome is a browser-native accessibility and human-computer interaction platform that enables hands-free smart home control using a standard laptop or desktop webcam. All computer vision, machine learning calibration, blink gesture recognition, and smart home simulation run locally in the browser without external hardware, cloud APIs, or servers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
          <Eye className="h-6 w-6 text-violet-700" />
          <h2 className="mt-3 text-base font-bold text-slate-900">1. Facial & Iris Landmarks</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Uses MediaPipe Face Landmarker (478 landmarks including iris centers) running via local WebAssembly to track eye socket boundaries, iris offsets, and head pose in real time.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
          <Crosshair className="h-6 w-6 text-cyan-700" />
          <h2 className="mt-3 text-base font-bold text-slate-900">2. Calibration & Regression</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            A 5- or 9-point calibration workflow collects real gaze feature vectors and fits a regularized polynomial Ridge Regression model validated with 5-fold cross-validation.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
          <Cpu className="h-6 w-6 text-violet-700" />
          <h2 className="mt-3 text-base font-bold text-slate-900">3. TensorFlow.js Classifier</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            In the Machine Learning Lab, a TensorFlow.js multi-layer perceptron trains directly on your calibration samples to classify gaze into 9 screen zones with real held-out evaluation.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
          <Sparkles className="h-6 w-6 text-cyan-700" />
          <h2 className="mt-3 text-base font-bold text-slate-900">4. EAR Blink Recognition</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Calculates left and right Eye Aspect Ratio (EAR) to distinguish natural single blinks from intentional double-blink confirmations and long-blink cancel/pause gestures.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
          <Home className="h-6 w-6 text-violet-700" />
          <h2 className="mt-3 text-base font-bold text-slate-900">5. Software Home Simulator</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Interactive SVG/CSS Living Room, Bedroom, and Kitchen interiors dynamically respond to appliance states: lighting cones, spinning fan blades, AC readouts, TV channels, curtains, and door locks.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0F0] bg-white p-5">
          <ShieldCheck className="h-6 w-6 text-emerald-700" />
          <h2 className="mt-3 text-base font-bold text-slate-900">6. Local-Only Privacy</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Video frames are never recorded or uploaded. Preferences, calibration weights, and interaction history are stored strictly in browser LocalStorage, with a full Demo Mode fallback.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-[#E2E0F0] bg-white p-5">
        <Link
          to="/calibration"
          className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
        >
          Calibrate Your Eyes
        </Link>
        <Link
          to="/simulator"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Launch Smart Home Simulator
        </Link>
        <Link
          to="/demo"
          className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-800 hover:bg-cyan-100"
        >
          Open Demo Simulation
        </Link>
      </div>
    </div>
  );
};
