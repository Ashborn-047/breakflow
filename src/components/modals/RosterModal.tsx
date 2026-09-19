import React, { useState } from 'react';
import { Plus, Trash2, User, X } from 'lucide-react';
import { Employee } from '../../types';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onAddEmployee: (name: string) => Promise<Employee>;
  onRemoveEmployee: (employeeId: string) => Promise<void>;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  employees,
  onAddEmployee,
  onRemoveEmployee,
}) => {
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (employees.some(emp => emp.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('An employee with this name already exists');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddEmployee(trimmed);
      setNewName('');
    } catch {
      setError('Failed to add employee to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (emp: Employee) => {
    if (confirm(`Remove ${emp.name} from the database?`)) {
      await onRemoveEmployee(emp.id);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 20, margin: 0 }}>Team Roster Management</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-muted)', fontSize: 13 }}>
              Register team members and manage placeholders in your database.
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

        {/* Add Employee Form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Add new employee (e.g. Employee 13 or Alex Rivera)..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-subtle)',
              color: 'var(--ink-primary)',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !newName.trim()}
            style={{ cursor: 'pointer' }}
          >
            <Plus size={16} />
            <span>Add Member</span>
          </button>
        </form>

        {error && (
          <div style={{ background: 'var(--rose-light)', color: 'var(--rose)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {/* Registered List */}
        <div
          style={{
            maxHeight: 340,
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-card)',
          }}
        >
          {employees.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
              No team members registered yet.
            </div>
          ) : (
            employees.map(emp => (
              <div
                key={emp.id}
                className="roster-item"
                data-testid="roster-item"
                data-name={emp.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--brand-light)',
                      color: 'var(--brand)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <User size={15} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 14, color: 'var(--ink-primary)' }}>{emp.name}</strong>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>ID: {emp.id}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => handleRemove(emp)}
                    className="btn btn-danger btn-sm"
                    data-testid={`remove-${emp.name.replace(/\s+/g, '-').toLowerCase()}`}
                    style={{ cursor: 'pointer' }}
                    title="Remove from database"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            Total registered: <strong>{employees.length}</strong>
          </span>
          <button onClick={onClose} className="btn">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
