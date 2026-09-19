import React from 'react';
import { AlertTriangle, Clock, StopCircle, Users, X } from 'lucide-react';
import { Employee, Shift } from '../../types';
import { AnimatedGauge } from '../common/AnimatedGauge';

interface CapacityFullModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  activeEmployees: Employee[];
  getUsedSeconds: (e: Employee) => number;
  onEndBreak: (employeeId: string) => void;
}

export const CapacityFullModal: React.FC<CapacityFullModalProps> = ({
  isOpen,
  onClose,
  shift,
  activeEmployees,
  getUsedSeconds,
  onEndBreak,
}) => {
  if (!isOpen || !shift) return null;

  const formatTimer = (sec: number) => {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--amber-light)',
                border: '1px solid var(--amber-border)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--amber)',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 19, margin: 0, color: 'var(--ink-primary)' }}>
                Break Slots Full ({shift.maxConcurrent}/{shift.maxConcurrent} Active)
              </h3>
              <p style={{ margin: '2px 0 0', color: 'var(--ink-muted)', fontSize: 12 }}>
                {shift.name} ({shift.hours}) has reached maximum concurrent capacity.
              </p>
            </div>
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

        {/* Notice description */}
        <div
          style={{
            background: 'var(--amber-light)',
            border: '1px solid var(--amber-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            color: 'var(--ink-primary)',
            fontSize: 13,
            lineHeight: 1.45,
            marginBottom: 18,
          }}
        >
          <strong style={{ color: 'var(--amber)' }}>Policy Limit Reached: </strong>
          To maintain fair operational coverage, only <strong>{shift.maxConcurrent} team members</strong> can take a break at the same time in this shift. Another member must end their break before a new break can start.
        </div>

        {/* Who is currently occupying the slots */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Currently occupying break slots:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeEmployees.map(emp => {
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
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AnimatedGauge
                      usedSeconds={usedSec}
                      size={42}
                      strokeWidth={4}
                      isActive={true}
                      colorVariant="amber"
                      showText={true}
                    />
                    <div>
                      <strong style={{ fontSize: 14, color: 'var(--ink-primary)', display: 'block' }}>
                        {emp.name}
                      </strong>
                      <span className="mono-text" style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>
                        ● On break for {formatTimer(usedSec)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onEndBreak(emp.id);
                      onClose();
                    }}
                    className="btn btn-warning btn-sm"
                    style={{ cursor: 'pointer' }}
                    title="End this employee's break to free up a slot"
                  >
                    <StopCircle size={13} />
                    <span>End Break</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} className="btn btn-primary">
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
