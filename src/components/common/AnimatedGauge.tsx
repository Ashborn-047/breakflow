import React from 'react';

interface AnimatedGaugeProps {
  usedSeconds: number;
  capSeconds?: number;
  size?: number;
  strokeWidth?: number;
  isActive?: boolean;
  showText?: boolean;
  colorVariant?: 'mint' | 'amber' | 'rose' | 'brand';
}

export const AnimatedGauge: React.FC<AnimatedGaugeProps> = ({
  usedSeconds,
  capSeconds = 3600,
  size = 46,
  strokeWidth = 4,
  isActive = false,
  showText = false,
  colorVariant = 'amber',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(1, Math.max(0, usedSeconds / capSeconds));
  const strokeDashoffset = circumference - progressRatio * circumference;

  const colorMap = {
    mint: { stroke: 'var(--mint)', glow: 'var(--mint-glow)' },
    amber: { stroke: 'var(--amber)', glow: 'var(--amber-glow)' },
    rose: { stroke: 'var(--rose)', glow: 'var(--rose-glow)' },
    brand: { stroke: 'var(--brand)', glow: 'var(--brand-glow)' },
  };

  const currentColors = colorMap[colorVariant] || colorMap.amber;

  // Format mm:ss
  const formatMinSec = (sec: number) => {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: 'rotate(-90deg)',
          overflow: 'visible',
        }}
      >
        <defs>
          <filter id={`glow-${colorVariant}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={currentColors.stroke} floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />

        {/* Animated Active Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={currentColors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter={isActive ? `url(#glow-${colorVariant})` : undefined}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
          }}
        />
      </svg>

      {/* Optional Centered Text */}
      {showText && (
        <span
          className="mono-text"
          style={{
            position: 'absolute',
            fontSize: size > 60 ? 12 : 9,
            fontWeight: 700,
            color: 'var(--ink-primary)',
          }}
        >
          {formatMinSec(usedSeconds)}
        </span>
      )}
    </div>
  );
};
