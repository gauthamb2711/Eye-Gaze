import React from 'react';

interface DwellIndicatorProps {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  isDemo?: boolean;
}

export const DwellIndicator: React.FC<DwellIndicatorProps> = ({
  progress,
  size = 48,
  strokeWidth = 4,
  isDemo = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(15, 23, 42, 0.16)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isDemo ? '#0891B2' : '#6D28D9'}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 60ms linear' }}
      />
    </svg>
  );
};
