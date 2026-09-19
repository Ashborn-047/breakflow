import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Coffee, Play, StopCircle, User, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DAILY_CAP_SECONDS, Employee, Shift } from '../../types';
import { AnimatedGauge } from '../common/AnimatedGauge';

interface KioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  shifts: Shift[];
  initialShiftId?: string;
  getUsedSeconds: (e: Employee) => number;
  getRemainingSeconds: (e: Employee) => number;
  onStartBreak: (employeeId: string, shiftId: string) => Promise<{ success: boolean; error?: string }>;
  onEndBreak: (employeeId: string) => Promise<{ success: boolean; error?: string }>;
  onRegisterEmployee: (name: string) => Promise<Employee>;
  onShowCapacityFull?: (shift: Shift, activeInShift: Employee[]) => void;
}

export const KioskModal: React.FC<KioskModalProps> = ({
  isOpen,
  onClose,
  employees,
  shifts,
  initialShiftId,
  getUsedSeconds,
  getRemainingSeconds,
  onStartBreak,
  onEndBreak,
  onRegisterEmployee,
  onShowCapacityFull,
}) => {
  const [searchName, setSearchName] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>(initialShiftId || shifts[0]?.id || 's1');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchName('');
      setSelectedEmployee(null);
      setErrorMessage(null);
      if (initialShiftId) {
        setSelectedShiftId(initialShiftId);
      }
    }
  }, [isOpen, initialShiftId]);

  // Fuzzy filter matching employees
  const filteredEmployees = useMemo(() => {
    const q = searchName.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e => e.name.toLowerCase().includes(q));
  }, [employees, searchName]);

  const selectedShift = shifts.find(s => s.id === selectedShiftId) || shifts[0];

  // Active breaks in this selected shift
  const activeInSelectedShift = useMemo(() => {
    return employees.filter(e => e.activeShiftId === selectedShiftId && e.activeBreakStartMs);
  }, [employees, selectedShiftId]);

  const isShiftFull = activeInSelectedShift.length >= (selectedShift?.maxConcurrent || 2);

  if (!isOpen) return null;

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setErrorMessage(null);
  };

  const handleCreateAndSelect = async () => {
    const trimmed = searchName.trim();
    if (!trimmed) return;
    try {
      const newEmp = await onRegisterEmployee(trimmed);
      setSelectedEmployee(newEmp);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Failed to add employee');
    }
  };

  const handleStart = async () => {
    if (!selectedEmployee) return;

    if (isShiftFull) {
      if (onShowCapacityFull && selectedShift) {
        onClose();
        onShowCapacityFull(selectedShift, activeInSelectedShift);
        return;
      }
      setErrorMessage(`Break slots are full (${activeInSelectedShift.length}/${selectedShift.maxConcurrent}). An employee must end their break first.`);
      return;
    }

    setErrorMessage(null);
    const res = await onStartBreak(selectedEmployee.id, selectedShiftId);
    if (res.success) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
      onClose();
    } else {
      setErrorMessage(res.error || 'Could not start break');
    }
  };

  const handleEnd = async () => {
    if (!selectedEmployee) return;
    setErrorMessage(null);
    const res = await onEndBreak(selectedEmployee.id);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Could not end break');
    }
  };

  const usedSec = selectedEmployee ? getUsedSeconds(selectedEmployee) : 0;
  const remainingSec = selectedEmployee ? getRemainingSeconds(selectedEmployee) : DAILY_CAP_SECONDS;
  const isOnBreak = !!selectedEmployee?.activeBreakStartMs;

  const formatTimer = (sec: number) => {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 20, margin: 0 }}>Take a Break · Punch Terminal</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-muted)', fontSize: 13 }}>
              Select your name and confirm your working shift for today.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Shift Selection (Dynamic: Monthly rotating shifts) */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-secondary)' }}>
              1. Select working shift for today:
            </label>
            {isShiftFull && (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--rose)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={12} /> SLOTS FULL ({activeInSelectedShift.length}/{selectedShift.maxConcurrent})
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {shifts.map(s => {
              const isSelected = s.id === selectedShiftId;
              const shiftActiveCount = employees.filter(e => e.activeShiftId === s.id && e.activeBreakStartMs).length;
              const shiftFull = shiftActiveCount >= s.maxConcurrent;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedShiftId(s.id);
                    setErrorMessage(null);
                  }}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${isSelected ? 'var(--brand)' : 'var(--border-color)'}`,
                    background: isSelected ? 'var(--brand-light)' : 'var(--surface-card)',
                    color: isSelected ? 'var(--brand)' : 'var(--ink-secondary)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  <div>{s.name}</div>
                  <div className="mono-text" style={{ fontSize: 10, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
                    {s.hours}
                  </div>
                  {shiftFull && (
                    <div style={{ fontSize: 9, color: 'var(--rose)', marginTop: 3, fontWeight: 800 }}>
                      FULL (2/2)
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Capacity Warning Banner if Shift Full and employee not on break */}
        {isShiftFull && !isOnBreak && (
          <div
            onClick={() => {
              if (onShowCapacityFull && selectedShift) {
                onClose();
                onShowCapacityFull(selectedShift, activeInSelectedShift);
              }
            }}
            style={{
              background: 'var(--rose-light)',
              border: '1px solid var(--rose-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: 'var(--rose)',
              fontSize: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
            title="Click to view full capacity details and active break members"
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <strong>Break slots are currently full! </strong>
              {selectedShift.name} has reached maximum concurrent break capacity ({activeInSelectedShift.length}/{selectedShift.maxConcurrent} active). Click to view details.
            </div>
          </div>
        )}

        {/* Step 2: Employee Selection with Smart Search */}
        {!selectedEmployee ? (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: 8 }}>
              2. Enter or select your name:
            </label>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input
                type="text"
                autoFocus
                placeholder="Type your name (e.g. Employee 01)..."
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-subtle)',
                  color: 'var(--ink-primary)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Matching List */}
            <div
              style={{
                maxHeight: 200,
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-card)',
              }}
            >
              {filteredEmployees.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
                  No match found for "{searchName}".
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={handleCreateAndSelect}
                      className="btn btn-primary btn-sm"
                      style={{ cursor: 'pointer' }}
                    >
                      ＋ Register "{searchName}" to database
                    </button>
                  </div>
                </div>
              ) : (
                filteredEmployees.map(emp => {
                  const empOnBreak = !!emp.activeBreakStartMs;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-subtle)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--brand-light)',
                            color: 'var(--brand)',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          <User size={14} />
                        </div>
                        <strong style={{ fontSize: 13, color: 'var(--ink-primary)' }}>{emp.name}</strong>
                      </div>

                      {empOnBreak ? (
                        <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700 }}>
                          ● ON BREAK
                        </span>
                      ) : (
                        <span className="mono-text" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                          {(getRemainingSeconds(emp) / 60).toFixed(0)}m left
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Step 3: Status & Action Panel for Selected Employee */
          <div
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <AnimatedGauge
                usedSeconds={usedSec}
                size={74}
                strokeWidth={6}
                isActive={isOnBreak}
                colorVariant={isOnBreak ? 'amber' : 'mint'}
                showText={true}
              />
            </div>

            <h4 style={{ fontSize: 19, margin: '0 0 4px', color: 'var(--ink-primary)' }}>
              {selectedEmployee.name}
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-muted)' }}>
              Shift: <strong>{selectedShift.name}</strong> ({selectedShift.hours})
            </p>

            {isOnBreak ? (
              <div
                style={{
                  background: 'var(--amber-light)',
                  border: '1px solid var(--amber-border)',
                  color: 'var(--amber)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 18,
                }}
              >
                ● Break In Progress: {formatTimer(usedSec)}
              </div>
            ) : isShiftFull ? (
              <div
                style={{
                  background: 'var(--rose-light)',
                  border: '1px solid var(--rose-border)',
                  color: 'var(--rose)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 18,
                }}
              >
                ⚠️ All {selectedShift.maxConcurrent} break slots are currently in use for this shift.
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--mint-light)',
                  border: '1px solid var(--mint-border)',
                  color: 'var(--mint)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 18,
                }}
              >
                ✓ {(remainingSec / 60).toFixed(1)} minutes remaining of daily allowance
              </div>
            )}

            {/* Error banner if any */}
            {errorMessage && (
              <div
                style={{
                  background: 'var(--rose-light)',
                  color: 'var(--rose)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Primary Action Button */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {isOnBreak ? (
                <button
                  onClick={handleEnd}
                  className="btn btn-warning btn-lg"
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  <StopCircle size={18} />
                  <span>End Break Now</span>
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className={isShiftFull ? 'btn btn-warning btn-lg' : 'btn btn-success btn-lg'}
                  style={{ flex: 1, cursor: remainingSec <= 0 ? 'not-allowed' : 'pointer' }}
                  disabled={remainingSec <= 0}
                  data-testid="kiosk-submit-btn"
                >
                  {isShiftFull ? <AlertTriangle size={18} /> : <Play size={18} />}
                  <span>{isShiftFull ? 'Slots Full (View Details)' : 'Start Break'}</span>
                </button>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Switch to different team member
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} className="btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
