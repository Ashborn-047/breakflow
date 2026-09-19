import React from 'react';
import { Coffee, Plus, StopCircle } from 'lucide-react';
import { isShiftActive } from '../../hooks/useBreakTracker';
import { BreakRecord, Employee, Shift } from '../../types';
import { AnimatedGauge } from '../common/AnimatedGauge';

interface ShiftCardProps {
  shift: Shift;
  activeBreaks: Employee[];
  recentLogs: BreakRecord[];
  getUsedSeconds: (e: Employee) => number;
  onEndBreak: (employeeId: string) => void;
  onOpenKioskForShift: (shiftId: string) => void;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  activeBreaks,
  recentLogs,
  getUsedSeconds,
  onEndBreak,
  onOpenKioskForShift,
}) => {
  const isLive = isShiftActive(shift);
  const activeCount = activeBreaks.length;
  const maxSlots = shift.maxConcurrent;
  const isFull = activeCount >= maxSlots;
  const capacityPct = Math.min(100, Math.round((activeCount / maxSlots) * 100));

  // Build slot items up to maxSlots
  const slots = [];
  for (let i = 0; i < maxSlots; i++) {
    slots.push(activeBreaks[i] || null);
  }

  // Format mm:ss
  const formatTimer = (sec: number) => {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <article
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        opacity: isLive ? 1 : 0.82,
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Shift Head */}
      <div
        style={{
          padding: '18px 20px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: isLive
            ? 'linear-gradient(180deg, var(--surface-subtle) 0%, var(--surface-card) 100%)'
            : 'var(--surface-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <h3 style={{ fontSize: 17, margin: 0 }}>{shift.name}</h3>
          <span
            className="mono-text"
            style={{
              fontSize: 12,
              color: 'var(--ink-muted)',
              background: 'var(--surface-subtle)',
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
            }}
          >
            {shift.hours}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--ink-muted)',
          }}
        >
          <span>
            {activeCount} of {maxSlots} break slots occupied
          </span>
          <span
            style={{
              fontWeight: 700,
              color: isLive ? 'var(--mint)' : 'var(--ink-faint)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isLive ? 'var(--mint)' : 'var(--ink-faint)',
              }}
            />
            {isLive ? 'Live shift' : 'Off shift'}
          </span>
        </div>

        {/* Capacity bar */}
        <div
          style={{
            height: 7,
            borderRadius: 8,
            background: 'var(--surface-subtle)',
            overflow: 'hidden',
            marginTop: 12,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${capacityPct}%`,
              background: isFull
                ? 'var(--amber)'
                : 'linear-gradient(90deg, var(--mint) 0%, #059669 100%)',
              borderRadius: 8,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Live Break Slots (Dynamic: No static names) */}
      <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Real-time break slots
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {slots.map((emp, idx) => {
            if (emp) {
              const usedSec = getUsedSeconds(emp);
              return (
                <div
                  key={emp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--amber-border)',
                    boxShadow: '0 2px 8px var(--amber-glow)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AnimatedGauge
                      usedSeconds={usedSec}
                      size={44}
                      strokeWidth={4}
                      isActive={true}
                      colorVariant="amber"
                      showText={true}
                    />
                    <div>
                      <strong style={{ fontSize: 14, color: 'var(--ink-primary)', display: 'block' }}>
                        {emp.name}
                      </strong>
                      <span
                        className="mono-text"
                        style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}
                      >
                        ● Break active · {formatTimer(usedSec)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onEndBreak(emp.id)}
                    className="btn btn-warning btn-sm"
                    style={{ cursor: 'pointer' }}
                    title="End break now"
                  >
                    <StopCircle size={14} />
                    <span>End break</span>
                  </button>
                </div>
              );
            }

            // Empty available slot
            return (
              <div
                key={`empty-slot-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--border-color)',
                  background: 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: '1px dashed var(--border-color)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--ink-faint)',
                      fontSize: 12,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    Slot available
                  </span>
                </div>

                <button
                  onClick={() => onOpenKioskForShift(shift.id)}
                  className="btn btn-subtle btn-sm"
                  style={{ cursor: 'pointer' }}
                  title={isLive ? 'Log an employee break' : 'Log an employee break (off-shift)'}
                >
                  <Plus size={13} />
                  <span>Log break</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Recent Shift Activity Feed */}
        {recentLogs.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Recent shift breaks
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentLogs.slice(0, 3).map(log => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    color: 'var(--ink-secondary)',
                    padding: '4px 6px',
                    borderRadius: 4,
                    background: 'var(--surface-subtle)',
                  }}
                >
                  <span>{log.employeeName}</span>
                  <span className="mono-text" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                    {(log.durationSec / 60).toFixed(1)}m · {new Date(log.endMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Quick Action */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
          {isFull ? 'All slots full' : `${maxSlots - activeCount} slot(s) open`}
        </span>
        <button
          onClick={() => onOpenKioskForShift(shift.id)}
          className={isFull ? 'btn btn-warning btn-sm' : 'btn btn-primary btn-sm'}
          data-testid={`shift-action-${shift.id}`}
          style={{ cursor: 'pointer' }}
          title={isFull ? 'Break slots full: click to view capacity details' : 'Log a break for this shift'}
        >
          <Coffee size={13} />
          <span>{isFull ? 'Slots full' : 'Quick punch'}</span>
        </button>
      </div>
    </article>
  );
};
