import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';
import { TV_CHANNELS } from '../services/applianceSimulationService';
import { ApplianceState, RoomId } from '../types';
import { DwellIndicator } from './DwellIndicator';

interface SmartRoomProps {
  roomId: RoomId;
}

export const SmartRoom: React.FC<SmartRoomProps> = ({ roomId }) => {
  const { appliances, toggleAppliance, hoveredTargetId, dwellProgress, controlMode } =
    useGazeHome();

  const roomAppliances = appliances.filter((a) => a.roomId === roomId);
  const byType = (t: ApplianceState['type']) => roomAppliances.find((a) => a.type === t);

  const light = byType('light');
  const fan = byType('fan');
  const ac = byType('ac');
  const tv = byType('tv');
  const door = byType('door');
  const curtains = byType('curtains');

  const lightOn = Boolean(light?.isOn);
  const lightBrightness = (light?.brightness ?? 80) / 100;
  const lightColor = light?.color ?? '#FDE68A';
  const curtainOpenPct = curtains ? (curtains.curtainPosition ?? (curtains.isOn ? 100 : 0)) / 100 : 0.6;
  const fanOn = Boolean(fan?.isOn);
  const fanSpeed = fan?.speed ?? 3;
  const fanDurationSec = Math.max(0.28, 1.9 - fanSpeed * 0.31);
  const acOn = Boolean(ac?.isOn);
  const tvOn = Boolean(tv?.isOn);
  const doorLocked = door?.isLocked ?? true;

  // Room ambient darkness overlay opacity: 0 when bright, up to 0.52 when lights & curtains are closed
  const ambientLightLevel = Math.min(
    1,
    (lightOn ? 0.65 * lightBrightness : 0) + curtainOpenPct * 0.45
  );
  const darknessOpacity = Number((0.52 * (1 - ambientLightLevel)).toFixed(2));

  const isTargetHovered = (app?: ApplianceState) =>
    Boolean(app && hoveredTargetId === `appliance:${app.id}`);

  const currentChannel =
    TV_CHANNELS.find((c) => c.number === (tv?.channel ?? 1)) ?? TV_CHANNELS[0];

  const renderHotspotRing = (app: ApplianceState | undefined, xPct: number, yPct: number) => {
    if (!app) return null;
    const hovered = isTargetHovered(app);
    return (
      <button
        key={`hotspot-${app.id}`}
        type="button"
        data-gaze-target={`appliance:${app.id}`}
        data-gaze-label={app.name}
        onClick={() => toggleAppliance(app.id, 'manual')}
        aria-label={`${app.name}: ${
          app.type === 'door'
            ? app.isLocked
              ? 'Locked'
              : 'Unlocked'
            : app.isOn
            ? 'On'
            : 'Off'
        }. Click or gaze to toggle.`}
        style={{ left: `${xPct}%`, top: `${yPct}%` }}
        className={`group absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full p-1 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
          hovered ? 'scale-110' : 'hover:scale-105'
        }`}
      >
        <div
          className={`relative flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors ${
            hovered
              ? 'border-violet-500 bg-white/95 ring-4 ring-violet-400/40'
              : 'border-slate-900/15 bg-white/85 backdrop-blur-xs group-hover:bg-white'
          }`}
        >
          {hovered && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <DwellIndicator
                progress={dwellProgress}
                size={44}
                strokeWidth={3.5}
                isDemo={controlMode === 'demo-simulation'}
              />
            </div>
          )}
          <span
            className={`text-[10px] font-bold tracking-tight ${
              app.type === 'door'
                ? app.isLocked
                  ? 'text-slate-700'
                  : 'text-emerald-700'
                : app.isOn
                ? 'text-violet-700'
                : 'text-slate-500'
            }`}
          >
            {app.type === 'door'
              ? app.isLocked
                ? 'LOCK'
                : 'OPEN'
              : app.type === 'curtains'
              ? `${Math.round(curtainOpenPct * 100)}%`
              : app.isOn
              ? 'ON'
              : 'OFF'}
          </span>
        </div>
        <span className="mt-1 block whitespace-nowrap rounded bg-slate-950/85 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-95">
          {app.name}
        </span>
      </button>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E2E0F0] bg-[#161E3A] shadow-sm">
      {/* Main Architectural Room Scene */}
      <div className="relative aspect-[16/9] w-full select-none overflow-hidden">
        <svg
          viewBox="0 0 800 450"
          className="h-full w-full"
          role="img"
          aria-label={`Interactive ${roomId.replace('-', ' ')} smart home simulator`}
        >
          <defs>
            <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={
                  roomId === 'living-room'
                    ? '#F3F1FA'
                    : roomId === 'bedroom'
                    ? '#ECE9F7'
                    : '#F2F6FA'
                }
              />
              <stop
                offset="100%"
                stopColor={
                  roomId === 'living-room'
                    ? '#E4E1F2'
                    : roomId === 'bedroom'
                    ? '#DFDBF0'
                    : '#E3EAF2'
                }
              />
            </linearGradient>

            <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={roomId === 'kitchen' ? '#CBD5E1' : '#D6C7B2'}
              />
              <stop
                offset="100%"
                stopColor={roomId === 'kitchen' ? '#94A3B8' : '#B8A286'}
              />
            </linearGradient>

            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>

            <radialGradient id="ceilingGlow" cx="50%" cy="15%" r="65%">
              <stop offset="0%" stopColor={lightColor} stopOpacity={lightOn ? 0.58 * lightBrightness : 0} />
              <stop offset="60%" stopColor={lightColor} stopOpacity={lightOn ? 0.18 * lightBrightness : 0} />
              <stop offset="100%" stopColor={lightColor} stopOpacity="0" />
            </radialGradient>

            <linearGradient id="sunBeam" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF9C3" stopOpacity={0.42 * curtainOpenPct} />
              <stop offset="100%" stopColor="#FEF9C3" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Back Wall & Side Perspective Walls */}
          <rect x="0" y="0" width="800" height="315" fill="url(#wallGrad)" />
          <polygon points="0,0 75,35 75,315 0,360" fill="#DCD8EC" opacity="0.65" />
          <polygon points="800,0 725,35 725,315 800,360" fill="#D5D0E8" opacity="0.7" />
          {/* Ceiling plane */}
          <polygon points="0,0 800,0 725,35 75,35" fill="#EBE8F7" />

          {/* Floor plane */}
          <polygon points="75,315 725,315 800,450 0,450" fill="url(#floorGrad)" />
          {/* Baseboard */}
          <rect x="75" y="305" width="650" height="10" fill="#FFFFFF" opacity="0.85" />
          {/* Floor plank/tile perspective lines */}
          <g stroke="#0F172A" strokeOpacity="0.08" strokeWidth="1">
            <line x1="205" y1="315" x2="145" y2="450" />
            <line x1="335" y1="315" x2="310" y2="450" />
            <line x1="465" y1="315" x2="490" y2="450" />
            <line x1="595" y1="315" x2="655" y2="450" />
            <line x1="40" y1="375" x2="760" y2="375" />
          </g>

          {/* WINDOW + SMART CURTAINS (Left Wall Area: x 105..255, y 88..228) */}
          <g>
            <rect x="105" y="88" width="150" height="140" rx="4" fill="#1E293B" />
            <rect x="112" y="95" width="136" height="126" fill="url(#skyGrad)" />
            {/* Window hills & clouds */}
            <circle cx="215" cy="122" r="14" fill="#FEF08A" opacity="0.9" />
            <path d="M112 200 Q150 175 185 196 T248 188 L248 221 L112 221 Z" fill="#6EE7B7" opacity="0.55" />
            {/* Window crossbars */}
            <line x1="180" y1="95" x2="180" y2="221" stroke="#F8FAFC" strokeWidth="3" />
            <line x1="112" y1="158" x2="248" y2="158" stroke="#F8FAFC" strokeWidth="3" />

            {/* Sunlight floor beam proportional to curtain openness */}
            {curtainOpenPct > 0.05 && (
              <polygon
                points="112,221 248,221 340,420 95,420"
                fill="url(#sunBeam)"
              />
            )}

            {/* Dynamic Sliding Curtains */}
            {(() => {
              const panelMaxW = 68;
              const panelW = Math.max(12, panelMaxW * (1 - curtainOpenPct * 0.85));
              return (
                <>
                  <rect
                    x="110"
                    y="90"
                    width={panelW}
                    height="136"
                    rx="2"
                    fill="#6D28D9"
                    opacity="0.92"
                    style={{ transition: 'width 350ms ease' }}
                  />
                  <rect
                    x={250 - panelW}
                    y="90"
                    width={panelW}
                    height="136"
                    rx="2"
                    fill="#6D28D9"
                    opacity="0.92"
                    style={{ transition: 'width 350ms ease, x 350ms ease' }}
                  />
                  {/* Curtain rod */}
                  <rect x="98" y="84" width="164" height="5" rx="2.5" fill="#334155" />
                </>
              );
            })()}
          </g>

          {/* WALL SMART AC UNIT (Top Right Wall: x 490..615, y 62..106) */}
          <g>
            <rect
              x="490"
              y="62"
              width="128"
              height="44"
              rx="8"
              fill="#FFFFFF"
              stroke={isTargetHovered(ac) ? '#6D28D9' : '#CBD5E1'}
              strokeWidth={isTargetHovered(ac) ? 3 : 1.5}
            />
            <rect x="498" y="92" width="112" height="5" rx="2" fill={acOn ? '#0891B2' : '#94A3B8'} />
            {/* Segmented Temperature Display */}
            <rect x="562" y="69" width="46" height="18" rx="3" fill="#0F172A" />
            <text
              x="585"
              y="81"
              textAnchor="middle"
              fill={acOn ? '#22D3EE' : '#64748B'}
              fontSize="10.5"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              {acOn ? `${ac?.temperature ?? 22}°C` : 'OFF'}
            </text>
            <text
              x="505"
              y="81"
              fill="#475569"
              fontSize="9"
              fontWeight="600"
            >
              {acOn ? (ac?.acMode ?? 'cool').toUpperCase() : 'IDLE'}
            </text>
            {/* Airflow curves when ON */}
            {acOn && (
              <g stroke="#22D3EE" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.65">
                <path d="M515 104 Q510 122 520 138">
                  <animate attributeName="opacity" values="0.2;0.85;0.2" dur="1.6s" repeatCount="indefinite" />
                </path>
                <path d="M548 104 Q543 125 553 144">
                  <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.6s" repeatCount="indefinite" />
                </path>
                <path d="M581 104 Q576 122 586 138">
                  <animate attributeName="opacity" values="0.2;0.85;0.2" dur="1.6s" repeatCount="indefinite" />
                </path>
              </g>
            )}
          </g>

          {/* SMART DOOR (Right Wall: x 642..715, y 128..315) */}
          <g>
            {/* Door frame */}
            <rect x="638" y="124" width="80" height="191" rx="3" fill="#334155" />
            {/* Door leaf */}
            <rect
              x="644"
              y="130"
              width={doorLocked ? 68 : 54}
              height="185"
              fill="#926239"
              stroke={isTargetHovered(door) ? '#6D28D9' : '#5C3D22'}
              strokeWidth={isTargetHovered(door) ? 3 : 1.5}
              style={{ transition: 'width 350ms ease' }}
            />
            {!doorLocked && (
              <rect x="698" y="130" width="14" height="185" fill="#0F172A" opacity="0.75" />
            )}
            {/* Door panels */}
            <rect x="653" y="144" width={doorLocked ? 50 : 38} height="64" rx="2" fill="#A67449" />
            <rect x="653" y="220" width={doorLocked ? 50 : 38} height="74" rx="2" fill="#A67449" />
            {/* Smart lock badge on door */}
            <rect x="650" y="205" width="18" height="22" rx="3" fill="#0F172A" />
            <circle cx="659" cy="213" r="3" fill={doorLocked ? '#EF4444' : '#10B981'} />
          </g>

          {/* ROOM-SPECIFIC FURNITURE & SMART TV */}
          {roomId === 'living-room' && (
            <g>
              {/* TV Media Console & Smart TV */}
              <rect x="305" y="258" width="185" height="52" rx="4" fill="#334155" />
              <rect x="330" y="272" width="62" height="26" rx="2" fill="#475569" />
              <rect x="404" y="272" width="62" height="26" rx="2" fill="#475569" />

              {/* TV Bezel */}
              <rect
                x="318"
                y="142"
                width="160"
                height="98"
                rx="6"
                fill="#0F172A"
                stroke={isTargetHovered(tv) ? '#6D28D9' : '#1E293B'}
                strokeWidth={isTargetHovered(tv) ? 3.5 : 2}
              />
              <rect x="392" y="240" width="12" height="18" fill="#1E293B" />
              <rect x="370" y="255" width="56" height="4" rx="2" fill="#1E293B" />

              {tvOn ? (
                <g>
                  <rect x="325" y="149" width="146" height="84" rx="2" fill="#1D4ED8" />
                  <circle cx="362" cy="182" r="22" fill="#06B6D4" opacity="0.7" />
                  <circle cx="422" cy="195" r="26" fill="#8B5CF6" opacity="0.75" />
                  <rect x="325" y="208" width="146" height="25" fill="#0F172A" opacity="0.78" />
                  <text x="333" y="220" fill="#FFFFFF" fontSize="8.5" fontWeight="700">
                    CH {currentChannel.number} · {currentChannel.name}
                  </text>
                  <text x="333" y="229" fill="#CBD5E1" fontSize="7.5">
                    Vol {tv?.volume ?? 40}%
                  </text>
                </g>
              ) : (
                <rect x="325" y="149" width="146" height="84" rx="2" fill="#020617" />
              )}

              {/* Modern Sofa */}
              <rect x="140" y="295" width="165" height="62" rx="12" fill="#5B508D" />
              <rect x="148" y="325" width="149" height="36" rx="8" fill="#6D5FA8" />
              <rect x="134" y="316" width="20" height="44" rx="6" fill="#4C4178" />
              <rect x="290" y="316" width="20" height="44" rx="6" fill="#4C4178" />
              {/* Coffee table */}
              <ellipse cx="420" cy="392" rx="76" ry="22" fill="#F8FAFC" opacity="0.92" />
              <rect x="385" y="408" width="8" height="24" fill="#64748B" />
              <rect x="447" y="408" width="8" height="24" fill="#64748B" />
            </g>
          )}

          {roomId === 'bedroom' && (
            <g>
              {/* Platform Bed */}
              <rect x="275" y="220" width="245" height="90" rx="8" fill="#475569" />
              <rect x="275" y="275" width="245" height="115" rx="10" fill="#6D5FA8" />
              <rect x="285" y="255" width="225" height="55" rx="8" fill="#F8FAFC" />
              {/* Pillows */}
              <rect x="300" y="242" width="84" height="34" rx="10" fill="#DDD6FE" />
              <rect x="410" y="242" width="84" height="34" rx="10" fill="#DDD6FE" />
              {/* Duvet */}
              <rect x="285" y="292" width="225" height="90" rx="8" fill="#4C4178" />
              {/* Suite Wall Display TV */}
              <rect
                x="338"
                y="128"
                width="120"
                height="70"
                rx="5"
                fill="#0F172A"
                stroke={isTargetHovered(tv) ? '#6D28D9' : '#1E293B'}
                strokeWidth="2"
              />
              {tvOn ? (
                <g>
                  <rect x="344" y="134" width="108" height="58" fill="#312E81" />
                  <text x="352" y="164" fill="#E0E7FF" fontSize="9" fontWeight="600">
                    CH {currentChannel.number} · {currentChannel.name}
                  </text>
                </g>
              ) : (
                <rect x="344" y="134" width="108" height="58" fill="#020617" />
              )}
              {/* Nightstand */}
              <rect x="536" y="280" width="54" height="52" rx="4" fill="#785A40" />
            </g>
          )}

          {roomId === 'kitchen' && (
            <g>
              {/* Upper Cabinets */}
              <rect x="295" y="96" width="180" height="68" rx="4" fill="#F8FAFC" stroke="#CBD5E1" />
              <line x1="355" y1="96" x2="355" y2="164" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="415" y1="96" x2="415" y2="164" stroke="#CBD5E1" strokeWidth="1.5" />
              {/* Lower Counter & Backsplash */}
              <rect x="280" y="164" width="220" height="54" fill="#E2E8F0" />
              <rect x="275" y="218" width="235" height="97" rx="3" fill="#334155" />
              <rect x="270" y="214" width="245" height="10" rx="2" fill="#F8FAFC" />
              {/* Kitchen Island */}
              <rect x="290" y="335" width="220" height="78" rx="6" fill="#475569" />
              <rect x="280" y="328" width="240" height="12" rx="3" fill="#F8FAFC" />
              {/* Stools */}
              <ellipse cx="340" cy="415" rx="20" ry="8" fill="#6D28D9" />
              <ellipse cx="460" cy="415" rx="20" ry="8" fill="#6D28D9" />
            </g>
          )}

          {/* CEILING SMART FAN (Top Left-Center Ceiling: cx=295, cy=48) */}
          <g transform="translate(295, 48)">
            <rect x="-4" y="-30" width="8" height="24" fill="#334155" />
            <g
              style={{
                transformOrigin: '0px 0px',
                animation: fanOn ? `fan-spin ${fanDurationSec}s linear infinite` : 'none',
              }}
            >
              <ellipse cx="-42" cy="0" rx="34" ry="8" fill={fanOn ? '#475569' : '#64748B'} />
              <ellipse cx="42" cy="0" rx="34" ry="8" fill={fanOn ? '#475569' : '#64748B'} />
              <ellipse cx="0" cy="-22" rx="8" ry="20" fill={fanOn ? '#475569' : '#64748B'} />
              <ellipse cx="0" cy="22" rx="8" ry="20" fill={fanOn ? '#475569' : '#64748B'} />
            </g>
            <circle
              cx="0"
              cy="0"
              r="11"
              fill={fanOn ? '#0891B2' : '#1E293B'}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          </g>

          {/* CEILING SMART LIGHT (Top Center: cx=415, cy=42) */}
          <g>
            <line x1="415" y1="0" x2="415" y2="34" stroke="#334155" strokeWidth="3" />
            <path d="M390 48 Q415 24 440 48 Z" fill="#1E293B" />
            <circle
              cx="415"
              cy="50"
              r="11"
              fill={lightOn ? lightColor : '#475569'}
              stroke={isTargetHovered(light) ? '#6D28D9' : '#1E293B'}
              strokeWidth="2"
            />
          </g>

          {/* ROOM LIGHTING CONE & NIGHT/DAY AMBIENT OVERLAY */}
          <rect x="0" y="0" width="800" height="450" fill="url(#ceilingGlow)" pointerEvents="none" />
          <rect
            x="0"
            y="0"
            width="800"
            height="450"
            fill="#090D1F"
            opacity={darknessOpacity}
            pointerEvents="none"
            style={{ transition: 'opacity 350ms ease' }}
          />
        </svg>

        {/* Interactive Gaze & Click Hotspots Positioned Precisely Over Appliances */}
        {renderHotspotRing(curtains, 22, 34)}
        {renderHotspotRing(fan, 37, 13)}
        {renderHotspotRing(light, 52, 13)}
        {renderHotspotRing(ac, 69, 18)}
        {tv && renderHotspotRing(tv, 49, roomId === 'bedroom' ? 36 : 42)}
        {renderHotspotRing(door, 85, 50)}

        {/* Top-left room summary strip */}
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 rounded-lg bg-slate-950/75 px-3 py-1.5 text-xs text-white backdrop-blur-xs">
          <span className="font-semibold capitalize">{roomId.replace('-', ' ')}</span>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <span className="font-mono tabular-nums text-cyan-300">
            {roomAppliances.filter((a) => (a.type === 'door' ? !a.isLocked : a.isOn)).length}/
            {roomAppliances.length} active
          </span>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <span className="inline-flex items-center gap-1 text-slate-200">
            {doorLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3 text-emerald-400" />}
            {doorLocked ? 'Secured' : 'Unlocked'}
          </span>
        </div>
      </div>
    </div>
  );
};
