import React from 'react';
import { Activity, BarChart3, LayoutGrid, RotateCcw, Search } from 'lucide-react';

export type AppTab = 'board' | 'telemetry' | 'analytics';

interface NavigationTabsProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onResetDay: () => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onChangeTab,
  searchQuery,
  onSearchChange,
  onResetDay,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14,
        marginBottom: 22,
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: 12,
      }}
    >
      {/* Tab Navigation (3 distinct tabs) */}
      <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => onChangeTab('board')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'board' ? 'var(--surface-card)' : 'transparent',
            color: activeTab === 'board' ? 'var(--brand)' : 'var(--ink-muted)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: activeTab === 'board' ? 'var(--shadow-sm)' : 'none',
            borderBottom: activeTab === 'board' ? '2px solid var(--brand)' : '2px solid transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <LayoutGrid size={16} />
          <span>Live Shift Board</span>
        </button>

        <button
          onClick={() => onChangeTab('telemetry')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'telemetry' ? 'var(--surface-card)' : 'transparent',
            color: activeTab === 'telemetry' ? 'var(--brand)' : 'var(--ink-muted)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: activeTab === 'telemetry' ? 'var(--shadow-sm)' : 'none',
            borderBottom: activeTab === 'telemetry' ? '2px solid var(--brand)' : '2px solid transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <Activity size={16} />
          <span>Live Capacity & Telemetry</span>
        </button>

        <button
          onClick={() => onChangeTab('analytics')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'analytics' ? 'var(--surface-card)' : 'transparent',
            color: activeTab === 'analytics' ? 'var(--brand)' : 'var(--ink-muted)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: activeTab === 'analytics' ? 'var(--shadow-sm)' : 'none',
            borderBottom: activeTab === 'analytics' ? '2px solid var(--brand)' : '2px solid transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <BarChart3 size={16} />
          <span>Productivity & Analytics</span>
        </button>
      </nav>

      {/* Tools: Search + Reset Day */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={15}
            color="var(--ink-faint)"
            style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search team member..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              width: 210,
              padding: '8px 12px 8px 34px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-card)',
              color: 'var(--ink-primary)',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
        </div>

        <button
          onClick={onResetDay}
          className="btn btn-subtle btn-sm"
          title="Reset today's logs and active breaks"
        >
          <RotateCcw size={13} />
          <span>Reset day</span>
        </button>
      </div>
    </div>
  );
};
