import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import { exportToCSV, exportToExcel } from '../../services/exportService';
import { BreakTrackerState } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: BreakTrackerState;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  const [selectedShift, setSelectedShift] = useState<string>('all');

  if (!isOpen) return null;

  const handleExportCSV = () => {
    exportToCSV(state, selectedShift);
    onClose();
  };

  const handleExportExcel = () => {
    exportToExcel(state, selectedShift);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 20, margin: 0 }}>Export Break Records</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-muted)', fontSize: 13 }}>
              Generate comprehensive reports for payroll, analytics, or shift handover.
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

        {/* Shift Filter */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: 8 }}>
            Select Shift Scope:
          </label>
          <select
            value={selectedShift}
            onChange={e => setSelectedShift(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-subtle)',
              color: 'var(--ink-primary)',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          >
            <option value="all">All Shifts Combined</option>
            {state.shifts.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.hours})
              </option>
            ))}
          </select>
        </div>

        {/* Download Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-lg"
            style={{ display: 'flex', flexDirection: 'column', padding: '16px 12px', gap: 6, cursor: 'pointer' }}
          >
            <FileText size={22} color="var(--brand)" />
            <strong style={{ fontSize: 14 }}>Export CSV</strong>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Universal tabular text</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="btn btn-primary btn-lg"
            style={{ display: 'flex', flexDirection: 'column', padding: '16px 12px', gap: 6, cursor: 'pointer' }}
          >
            <FileSpreadsheet size={22} />
            <strong style={{ fontSize: 14 }}>Export Excel</strong>
            <span style={{ fontSize: 11, opacity: 0.85 }}>Formatted spreadsheet (.xls)</span>
          </button>
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
