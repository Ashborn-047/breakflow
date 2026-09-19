import React from 'react';
import { Coffee, Download } from 'lucide-react';

interface HeroProps {
  activeBreaksCount: number;
  onOpenKiosk: () => void;
  onOpenExport: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  activeBreaksCount,
  onOpenKiosk,
  onOpenExport,
}) => {
  return (
    <section
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: 20,
        marginBottom: 24,
      }}
    >
      <div>
        <h2 style={{ fontSize: 32, lineHeight: 1.15, margin: '0 0 6px' }}>
          Today’s break board
        </h2>
        <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 14 }}>
          {activeBreaksCount > 0 ? (
            <span style={{ color: 'var(--amber)', fontWeight: 600 }}>
              ● {activeBreaksCount} break{activeBreaksCount === 1 ? '' : 's'} in progress right now ·{' '}
            </span>
          ) : (
            <span style={{ color: 'var(--mint)', fontWeight: 600 }}>
              ● All team members on duty ·{' '}
            </span>
          )}
          Up to 60 minutes allowance per person per day.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={onOpenKiosk}
          className="btn btn-primary btn-lg"
          style={{ cursor: 'pointer' }}
        >
          <Coffee size={18} />
          <span>Take a break</span>
        </button>

        <button
          onClick={onOpenExport}
          className="btn btn-lg"
          style={{ cursor: 'pointer' }}
        >
          <Download size={17} />
          <span>Export report</span>
        </button>
      </div>
    </section>
  );
};
