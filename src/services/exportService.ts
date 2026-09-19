import { BreakTrackerState, DAILY_CAP_SECONDS } from '../types';

export function generateBreakReportRows(state: BreakTrackerState, shiftFilter: string = 'all'): string[][] {
  const rows: string[][] = [];

  state.shifts.forEach(shift => {
    if (shiftFilter !== 'all' && shift.id !== shiftFilter) return;

    // Filter employees active or belonging to this shift
    const relevantEmployees = state.employees.filter(
      emp => emp.activeShiftId === shift.id || state.breakLogs.some(l => l.employeeId === emp.id && l.shiftId === shift.id)
    );

    relevantEmployees.forEach(emp => {
      const usedSec = emp.dailyUsedSeconds || 0;
      const remainingSec = Math.max(0, DAILY_CAP_SECONDS - usedSec);
      const isOver = usedSec > DAILY_CAP_SECONDS;
      const isLow = remainingSec < 300 && remainingSec > 0;
      const status = isOver ? 'OVER' : isLow ? 'LOW' : 'OK';
      const onBreak = !!emp.activeBreakStartMs;

      rows.push([
        emp.name,
        shift.name,
        (usedSec / 60).toFixed(1),
        (remainingSec / 60).toFixed(1),
        status,
        onBreak ? 'ON BREAK' : 'ACTIVE',
      ]);
    });

    // Also include completed break history logs
    const shiftLogs = state.breakLogs.filter(l => l.shiftId === shift.id);
    shiftLogs.forEach(log => {
      rows.push([
        log.employeeName,
        log.shiftName,
        `Break Log: ${new Date(log.startMs).toLocaleTimeString()}`,
        `Ended ${new Date(log.endMs).toLocaleTimeString()}`,
        `${(log.durationSec / 60).toFixed(1)} min`,
        'COMPLETED',
      ]);
    });
  });

  return rows;
}

export function exportToCSV(state: BreakTrackerState, shiftFilter: string = 'all') {
  const headers = ['Name', 'Shift', 'Used Today (min)', 'Remaining (min)', 'Status', 'Current State'];
  const dataRows = generateBreakReportRows(state, shiftFilter);
  const allRows = [headers, ...dataRows];

  const csvContent = allRows
    .map(row =>
      row
        .map(val => {
          const s = String(val ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\r\n');

  const shiftLabel = shiftFilter === 'all' ? 'all-shifts' : (state.shifts.find(s => s.id === shiftFilter)?.name || 'shift').toLowerCase().replace(/\s+/g, '-');
  const filename = `breakflow-report-${shiftLabel}-${new Date().toISOString().slice(0, 10)}.csv`;

  downloadBlob(filename, csvContent, 'text/csv;charset=utf-8;');
}

export function exportToExcel(state: BreakTrackerState, shiftFilter: string = 'all') {
  const dataRows = generateBreakReportRows(state, shiftFilter);
  const rowsHtml = dataRows
    .map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          th { background-color: #244bd0; color: #ffffff; font-weight: bold; }
          td { border: 1px solid #e2e8f0; padding: 6px 10px; }
        </style>
      </head>
      <body>
        <h2>BreakFlow Workplace Break & Shift Report</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table border="1">
          <thead>
            <tr>
              <th>Name</th>
              <th>Shift</th>
              <th>Used Today (min)</th>
              <th>Remaining (min)</th>
              <th>Status</th>
              <th>Current State</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const shiftLabel = shiftFilter === 'all' ? 'all-shifts' : (state.shifts.find(s => s.id === shiftFilter)?.name || 'shift').toLowerCase().replace(/\s+/g, '-');
  const filename = `breakflow-report-${shiftLabel}-${new Date().toISOString().slice(0, 10)}.xls`;

  downloadBlob(filename, html, 'application/vnd.ms-excel');
}

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 300);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
