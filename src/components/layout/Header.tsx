import React from 'react';
import { CheckCircle2, Clock, Cloud, HardDrive, Moon, Sun, Users } from 'lucide-react';
import { useLiveClock } from '../../hooks/useLiveClock';
import { SyncStatus } from '../../services/storage';

interface HeaderProps {
  syncStatus: SyncStatus;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenRoster: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncStatus,
  isDarkMode,
  onToggleTheme,
  onOpenRoster,
}) => {
  const { time, date } = useLiveClock();

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 28,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--brand) 0%, #1e40af 100%)',
            color: '#ffffff',
            boxShadow: '0 8px 20px var(--brand-glow)',
            fontWeight: 800,
            fontSize: 21,
            letterSpacing: '-0.02em',
          }}
        >
          B
        </div>
        <div>
          <h1 style={{ fontSize: 22, margin: 0, lineHeight: 1.2 }}>BreakFlow</h1>
          <p style={{ margin: '2px 0 0', color: 'var(--ink-muted)', fontSize: 13 }}>
            Intelligent break telemetry & shift coordination
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Live Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Clock size={16} color="var(--brand)" />
          <div>
            <strong className="mono-text" style={{ fontSize: 14, display: 'block', lineHeight: 1 }}>
              {time}
            </strong>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{date}</span>
          </div>
        </div>

        {/* Automatic Dual-Sync Pill (Local + SpacetimeDB Cloud) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            fontSize: 12,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
          title="Dual Sync Active: Logs are saved locally and synced simultaneously with SpacetimeDB Cloud."
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HardDrive size={13} color="var(--mint)" />
            <Cloud size={14} color={syncStatus.cloudConnected ? 'var(--brand)' : 'var(--ink-muted)'} />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
            {syncStatus.cloudConnected
              ? `Synced (Local + Cloud ${syncStatus.cloudLatencyMs ? `${syncStatus.cloudLatencyMs}ms` : ''})`
              : 'Synced (Local Engine)'}
          </span>
          <span
            className={`pulse-indicator ${syncStatus.cloudConnected ? 'pulse-mint' : ''}`}
            style={{ width: 7, height: 7 }}
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="btn btn-subtle"
          style={{ padding: '9px 12px' }}
          title="Toggle Dark / Light Theme"
        >
          {isDarkMode ? <Sun size={16} color="var(--amber)" /> : <Moon size={16} color="var(--brand)" />}
          <span style={{ fontSize: 12 }}>{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>

        {/* Team Roster Management */}
        <button
          onClick={onOpenRoster}
          className="btn"
          style={{ padding: '9px 14px' }}
          title="Manage Team Roster"
        >
          <Users size={16} color="var(--brand)" />
          <span>Roster</span>
        </button>
      </div>
    </header>
  );
};
