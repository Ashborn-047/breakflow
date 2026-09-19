import React from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Coffee, Plus, StopCircle, Users } from 'lucide-react';
import { Employee, Shift } from '../../types';
import { AnimatedGauge } from '../common/AnimatedGauge';

interface LiveTelemetryViewProps {
  shifts: Shift[];
  employees: Employee[];
  getUsedSeconds: (e: Employee) => number;
  onEndBreak: (employeeId: string) => void;
  onOpenKioskForShift: (shiftId: string) => void;
}

export const LiveTelemetryView: React.FC<LiveTelemetryViewProps> = ({
  shifts,
  employees,
  getUsedSeconds,
  onEndBreak,
  onOpenKioskForShift,
}) => {
  // All employees currently on break across any shift
  const onBreakEmployees = employees.filter(e => !!e.activeBreakStartMs);

  const formatTimer = (sec: number) => {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Section 1: Who is currently on break with live elapsed time */}
      <section
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '22px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 14,
          }}
        >
          <div>
            <h3 style={{ fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coffee size={20} color="var(--amber)" />
              Who Is Currently On Break
            </h3>
            <p style={{ margin: '3px 0 0', color: 'var(--ink-muted)', fontSize: 13 }}>
              Real-time telemetry showing live elapsed durations and active break timers.
            </p>
          </div>

          <span
            className="mono-text"
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: onBreakEmployees.length > 0 ? 'var(--amber-light)' : 'var(--mint-light)',
              color: onBreakEmployees.length > 0 ? 'var(--amber)' : 'var(--mint)',
              border: `1px solid ${onBreakEmployees.length > 0 ? 'var(--amber-border)' : 'var(--mint-border)'}`,
            }}
          >
            {onBreakEmployees.length > 0 ? `● ${onBreakEmployees.length} ON BREAK` : '● 0 ON BREAK'}
          </span>
        </div>

        {onBreakEmployees.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              background: 'var(--surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <CheckCircle size={36} color="var(--mint)" style={{ marginBottom: 10 }} />
            <strong style={{ display: 'block', fontSize: 16, color: 'var(--ink-primary)' }}>
              All Team Members Are Currently On Duty
            </strong>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-muted)', fontSize: 13 }}>
              No break slots are in use. When an employee clocks out, their live timer will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {onBreakEmployees.map(emp => {
              const usedSec = getUsedSeconds(emp);
              const shift = shifts.find(s => s.id === emp.activeShiftId);
              const startTime = emp.activeBreakStartMs
                ? new Date(emp.activeBreakStartMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : '--:--';

              return (
                <div
                  key={emp.id}
                  style={{
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--amber-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px 18px',
                    boxShadow: '0 4px 14px var(--amber-glow)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <AnimatedGauge
                        usedSeconds={usedSec}
                        size={52}
                        strokeWidth={5}
                        isActive={true}
                        colorVariant="amber"
                        showText={true}
                      />
                      <div>
                        <strong style={{ fontSize: 16, color: 'var(--ink-primary)', display: 'block' }}>
                          {emp.name}
                        </strong>
                        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                          {shift?.name || 'Assigned Shift'}
                        </span>
                      </div>
                    </div>

                    <span
                      className="mono-text"
                      style={{
                        fontSize: 11,
                        background: 'var(--surface-card)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        color: 'var(--ink-secondary)',
                      }}
                    >
                      Started: {startTime}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--surface-card)',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Elapsed Time</div>
                      <div className="mono-text" style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>
                        {formatTimer(usedSec)}
                      </div>
                    </div>

                    <button
                      onClick={() => onEndBreak(emp.id)}
                      className="btn btn-warning btn-sm"
                      style={{ cursor: 'pointer' }}
                    >
                      <StopCircle size={14} />
                      <span>End Break</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Shift Capacity Saturation */}
      <section
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '22px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 14,
          }}
        >
          <div>
            <h3 style={{ fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={20} color="var(--brand)" />
              Shift Capacity Saturation
            </h3>
            <p style={{ margin: '3px 0 0', color: 'var(--ink-muted)', fontSize: 13 }}>
              Real-time break concurrency load against policy limits (2 slots max per shift).
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 18,
          }}
        >
          {shifts.map(shift => {
            const activeInShift = employees.filter(e => e.activeShiftId === shift.id && e.activeBreakStartMs);
            const activeCount = activeInShift.length;
            const maxSlots = shift.maxConcurrent;
            const openSlots = Math.max(0, maxSlots - activeCount);
            const isFull = activeCount >= maxSlots;
            const saturationPct = Math.round((activeCount / maxSlots) * 100);

            return (
              <div
                key={shift.id}
                style={{
                  background: 'var(--surface-subtle)',
                  border: `1.5px solid ${isFull ? 'var(--rose-border)' : activeCount > 0 ? 'var(--amber-border)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: isFull ? '0 4px 16px var(--rose-glow)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: 16, margin: 0 }}>{shift.name}</h4>
                    <span className="mono-text" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                      {shift.hours}
                    </span>
                  </div>

                  <span
                    className="mono-text"
                    style={{
                      padding: '3px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      background: isFull ? 'var(--rose-light)' : activeCount > 0 ? 'var(--amber-light)' : 'var(--mint-light)',
                      color: isFull ? 'var(--rose)' : activeCount > 0 ? 'var(--amber)' : 'var(--mint)',
                      border: `1px solid ${isFull ? 'var(--rose-border)' : activeCount > 0 ? 'var(--amber-border)' : 'var(--mint-border)'}`,
                    }}
                  >
                    {isFull ? '100% FULL' : `${saturationPct}% LOAD`}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-muted)', marginBottom: 6 }}>
                    <span>Active: {activeCount} / {maxSlots} slots</span>
                    <span>{openSlots} available</span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 6,
                      background: 'var(--border-color)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${saturationPct}%`,
                        background: isFull
                          ? 'var(--rose)'
                          : activeCount > 0
                          ? 'var(--amber)'
                          : 'var(--mint)',
                        borderRadius: 6,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Active employees in this shift */}
                {activeInShift.length > 0 ? (
                  <div style={{ background: 'var(--surface-card)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 6 }}>
                      Members On Break in {shift.name}:
                    </div>
                    {activeInShift.map(emp => (
                      <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '3px 0' }}>
                        <span>{emp.name}</span>
                        <span className="mono-text" style={{ color: 'var(--amber)', fontWeight: 600 }}>
                          {formatTimer(getUsedSeconds(emp))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', padding: '6px 0' }}>
                    ✓ No active breaks in this shift. Full capacity available.
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={() => onOpenKioskForShift(shift.id)}
                  className="btn btn-sm"
                  style={{
                    alignSelf: 'flex-start',
                    cursor: isFull ? 'not-allowed' : 'pointer',
                    background: isFull ? 'transparent' : 'var(--surface-card)',
                  }}
                  disabled={isFull}
                >
                  <Plus size={13} />
                  <span>{isFull ? 'Capacity Full' : 'Punch Break'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
