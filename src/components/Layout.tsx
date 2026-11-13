import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Eye,
  Crosshair,
  Home,
  DoorOpen,
  Sliders,
  Sparkles,
  BrainCircuit,
  MousePointerClick,
  History,
  BarChart3,
  Settings,
  Info,
  Play,
  Pause,
  Square,
  Menu,
  X,
} from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';

const NAV_GROUPS = [
  {
    label: 'Smart Home',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/simulator', label: 'Smart Home Simulator', icon: Home },
      { to: '/rooms', label: 'Room Management', icon: DoorOpen },
      { to: '/appliances', label: 'Appliance Control', icon: Sliders },
    ],
  },
  {
    label: 'Computer Vision & ML',
    items: [
      { to: '/eye-tracking', label: 'Live Eye Tracking', icon: Eye },
      { to: '/calibration', label: 'Eye Calibration', icon: Crosshair },
      { to: '/gestures', label: 'Blink Gestures', icon: Sparkles },
      { to: '/ml-lab', label: 'Machine Learning Lab', icon: BrainCircuit },
      { to: '/demo', label: 'Demo Simulation', icon: MousePointerClick },
    ],
  },
  {
    label: 'Insights & System',
    items: [
      { to: '/history', label: 'Interaction History', icon: History },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/settings', label: 'Settings & Privacy', icon: Settings },
      { to: '/about', label: 'About Project', icon: Info },
    ],
  },
];

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Smart Home Dashboard',
  '/simulator': 'Smart Home Simulator',
  '/rooms': 'Room Management',
  '/appliances': 'Appliance Control',
  '/eye-tracking': 'Live Eye Tracking',
  '/calibration': 'Eye Calibration',
  '/gestures': 'Blink Gesture Recognition',
  '/ml-lab': 'Machine Learning Lab',
  '/demo': 'Demo Simulation',
  '/history': 'Interaction History',
  '/analytics': 'Analytics',
  '/settings': 'Settings & Privacy',
  '/about': 'About Project',
};

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const {
    controlMode,
    trackingStatus,
    startWebcamTracking,
    pauseWebcamTracking,
    resumeWebcamTracking,
    stopWebcamTracking,
    disableDemoMode,
    calibrationProfile,
  } = useGazeHome();

  const currentTitle = ROUTE_TITLES[location.pathname] ?? 'GazeHome';

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-[#111834] text-slate-100">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
          GazeHome
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Primary Navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[11px] font-semibold tracking-wide text-slate-400">
              {group.label}
            </p>
            <ul className="mt-1.5 space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? 'bg-violet-600 text-white'
                            : 'text-slate-300 hover:bg-white/8 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 text-xs text-slate-300">
        <div className="flex items-center justify-between">
          <span>Calibration</span>
          <span className="font-mono text-cyan-300">
            {calibrationProfile ? calibrationProfile.qualityLabel : 'Uncalibrated'}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span>Control Mode</span>
          <span className="font-mono text-slate-100">
            {controlMode === 'webcam-gaze'
              ? trackingStatus === 'active'
                ? 'Webcam Active'
                : 'Webcam Paused'
              : controlMode === 'demo-simulation'
              ? 'Demo Mode'
              : 'Manual'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F5F4FA] text-[#0F172A]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[260px] shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{renderSidebarContent()}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-[270px] max-w-[85vw]">{renderSidebarContent()}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Clean 3-Zone Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[#E2E0F0] bg-white/95 px-4 py-3 backdrop-blur-xs lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-[#E2E0F0] p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="hidden sm:inline">GazeHome</span>
                <span className="hidden sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="truncate font-semibold text-slate-900">{currentTitle}</span>
              </div>
            </div>
          </div>

          {/* Emergency & Quick Gaze Control Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {controlMode === 'demo-simulation' && (
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-cyan-50 border border-cyan-200 px-2.5 py-1 text-xs font-semibold text-cyan-800 whitespace-nowrap">
                  DEMO SIMULATION
                </span>
                <button
                  type="button"
                  onClick={disableDemoMode}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                >
                  <Square className="h-3.5 w-3.5" />
                  Exit Demo
                </button>
              </div>
            )}

            {controlMode === 'webcam-gaze' && (
              <div className="flex items-center gap-2">
                {trackingStatus === 'active' ? (
                  <button
                    type="button"
                    onClick={pauseWebcamTracking}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pause Gaze
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumeWebcamTracking}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-600 whitespace-nowrap"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Resume Gaze
                  </button>
                )}
                <button
                  type="button"
                  onClick={stopWebcamTracking}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 whitespace-nowrap"
                >
                  <Square className="h-3.5 w-3.5" />
                  Stop Tracking
                </button>
              </div>
            )}

            {controlMode === 'off' && (
              <button
                type="button"
                onClick={() => startWebcamTracking()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-600 whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5" />
                Enable Gaze Control
              </button>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
