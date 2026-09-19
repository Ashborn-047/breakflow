import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  iconBg = 'var(--brand-light)',
  iconColor = 'var(--brand)',
}) => {
  return (
    <div
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--ink-muted)',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            display: 'grid',
            placeItems: 'center',
            background: iconBg,
            color: iconColor,
            fontSize: 15,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <strong
          className="mono-text"
          style={{
            display: 'block',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {value}
        </strong>
        <small
          style={{
            display: 'block',
            color: 'var(--ink-muted)',
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {sublabel}
        </small>
      </div>
    </div>
  );
};
