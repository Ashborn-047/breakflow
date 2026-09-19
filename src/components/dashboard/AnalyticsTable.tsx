import React from 'react';
import { DAILY_CAP_SECONDS, Employee, Shift, BreakRecord } from '../../types';
import { Play, StopCircle } from 'lucide-react';

interface AnalyticsTableProps {
  employees: Employee[];
  shifts: Shift[];
  breakLogs: BreakRecord[];
  getUsedSeconds: (e: Employee) => number;
  getRemainingSeconds: (e: Employee) => number;
  onStartBreakFor: (employee: Employee) => void;
  onEndBreak: (employeeId: string) => void;
}

export const AnalyticsTable: React.FC<AnalyticsTableProps> = ({
  employees,
  shifts,
  breakLogs,
  getUsedSeconds,
  getRemainingSeconds,
  onStartBreakFor,
  onEndBreak,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Table 1: Team Member Break Allowances */}
      <section
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 16, margin: 0 }}>Team Member Break Allowances (Today)</h3>
          <p style={{ margin: '3px 0 0', color: 'var(--ink-muted)', fontSize: 12 }}>
            60-minute daily budget tracking and real-time break telemetry
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Name</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Current Shift</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700, textAlign: 'right' }}>Used Today</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700, textAlign: 'right' }}>Remaining</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Activity</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
                    No team members registered yet.
                  </td>
                </tr>
              ) : (
                employees.map(emp => {
                  const usedSec = getUsedSeconds(emp);
                  const remainingSec = getRemainingSeconds(emp);
                  const isOver = usedSec > DAILY_CAP_SECONDS;
                  const isLow = remainingSec < 300 && remainingSec > 0;
                  const isOnBreak = !!emp.activeBreakStartMs;
                  const shift = shifts.find(s => s.id === emp.activeShiftId);

                  return (
                    <tr
                      key={emp.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--brand-light)',
                              color: 'var(--brand)',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {emp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <strong style={{ fontSize: 13, color: 'var(--ink-primary)' }}>{emp.name}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--ink-secondary)' }}>
                        {shift ? shift.name : <span style={{ color: 'var(--ink-faint)' }}>Dynamic (Flexible)</span>}
                      </td>
                      <td className="mono-text" style={{ padding: '14px 18px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>
                        {(usedSec / 60).toFixed(1)} min
                      </td>
                      <td className="mono-text" style={{ padding: '14px 18px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>
                        {(remainingSec / 60).toFixed(1)} min
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          className="mono-text"
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 700,
                            background: isOver ? 'var(--rose-light)' : isLow ? 'var(--amber-light)' : 'var(--mint-light)',
                            color: isOver ? 'var(--rose)' : isLow ? 'var(--amber)' : 'var(--mint)',
                            border: `1px solid ${isOver ? 'var(--rose-border)' : isLow ? 'var(--amber-border)' : 'var(--mint-border)'}`,
                          }}
                        >
                          {isOver ? 'EXCEEDED' : isLow ? 'LOW' : 'OPTIMAL'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {isOnBreak ? (
                          <span style={{ color: 'var(--amber)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span className="pulse-indicator" /> ON BREAK
                          </span>
                        ) : (
                          <span style={{ color: 'var(--mint)', fontSize: 12, fontWeight: 600 }}>
                            ● ACTIVE
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {isOnBreak ? (
                          <button
                            onClick={() => onEndBreak(emp.id)}
                            className="btn btn-warning btn-sm"
                            style={{ cursor: 'pointer' }}
                          >
                            <StopCircle size={13} />
                            <span>End break</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onStartBreakFor(emp)}
                            className="btn btn-subtle btn-sm"
                            style={{ cursor: 'pointer' }}
                            disabled={isOver}
                          >
                            <Play size={13} />
                            <span>Log break</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Table 2: Shift Capacity Saturation */}
      <section
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 16, margin: 0 }}>Shift Capacity Saturation</h3>
          <p style={{ margin: '3px 0 0', color: 'var(--ink-muted)', fontSize: 12 }}>
            Concurrent break slot utilization per shift
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Shift</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Hours</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700, textAlign: 'right' }}>Active Breaks</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700, textAlign: 'right' }}>Open Slots</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Capacity Load</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(s => {
                const activeCount = employees.filter(e => e.activeShiftId === s.id && e.activeBreakStartMs).length;
                const openSlots = Math.max(0, s.maxConcurrent - activeCount);
                const isFull = openSlots === 0;

                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <strong style={{ fontSize: 14 }}>{s.name}</strong>
                    </td>
                    <td className="mono-text" style={{ padding: '14px 18px', fontSize: 12, color: 'var(--ink-muted)' }}>
                      {s.hours}
                    </td>
                    <td className="mono-text" style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600 }}>
                      {activeCount}
                    </td>
                    <td className="mono-text" style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600 }}>
                      {openSlots}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        className="mono-text"
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 700,
                          background: isFull ? 'var(--amber-light)' : 'var(--mint-light)',
                          color: isFull ? 'var(--amber)' : 'var(--mint)',
                          border: `1px solid ${isFull ? 'var(--amber-border)' : 'var(--mint-border)'}`,
                        }}
                      >
                        {isFull ? 'FULL (2/2)' : `AVAILABLE (${openSlots} OPEN)`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Table 3: Completed Break Logs Feed */}
      {breakLogs.length > 0 && (
        <section
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 16, margin: 0 }}>Completed Break Audit Trail</h3>
            <p style={{ margin: '3px 0 0', color: 'var(--ink-muted)', fontSize: 12 }}>
              Chronological log of today’s completed breaks
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Employee</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Shift</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Start Time</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>End Time</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700, textAlign: 'right' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {breakLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 600 }}>{log.employeeName}</td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--ink-muted)' }}>{log.shiftName}</td>
                    <td className="mono-text" style={{ padding: '12px 18px', fontSize: 12 }}>{new Date(log.startMs).toLocaleTimeString()}</td>
                    <td className="mono-text" style={{ padding: '12px 18px', fontSize: 12 }}>{new Date(log.endMs).toLocaleTimeString()}</td>
                    <td className="mono-text" style={{ padding: '12px 18px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: 'var(--brand)' }}>
                      {(log.durationSec / 60).toFixed(1)} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
