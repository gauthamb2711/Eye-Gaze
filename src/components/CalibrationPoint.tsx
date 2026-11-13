import React from 'react';

interface CalibrationPointProps {
  x: number; // 0..1
  y: number; // 0..1
  label: string;
  progress: number; // 0..1
  completed: boolean;
  active: boolean;
}

export const CalibrationPoint: React.FC<CalibrationPointProps> = ({
  x,
  y,
  label,
  progress,
  completed,
  active,
}) => {
  const size = 56;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      <div className="relative flex flex-col items-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={completed ? '#10B981' : 'rgba(109, 40, 217, 0.2)'}
              strokeWidth={strokeWidth}
            />
            {active && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#0891B2"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            )}
          </svg>
          <div
            className={`absolute flex items-center justify-center rounded-full transition-transform ${
              active
                ? 'h-6 w-6 scale-110 bg-violet-700 ring-4 ring-violet-200'
                : completed
                ? 'h-4 w-4 bg-emerald-600'
                : 'h-3.5 w-3.5 bg-slate-300'
            }`}
          >
            {active && <div className="h-2 w-2 rounded-full bg-white" />}
          </div>
        </div>
        {active && (
          <span className="mt-1 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
            Look here · {label}
          </span>
        )}
      </div>
    </div>
  );
};
