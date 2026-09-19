import React, { useState, useMemo } from 'react';
import { BarChart2, Calendar, CheckCircle2, Filter, PieChart, TrendingUp, Users } from 'lucide-react';
import { BreakRecord, DAILY_CAP_SECONDS, Employee, Shift } from '../../types';

interface ProductivityDashboardProps {
  employees: Employee[];
  shifts: Shift[];
  breakLogs: BreakRecord[];
  getUsedSeconds: (e: Employee) => number;
  getRemainingSeconds: (e: Employee) => number;
}

export const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({
  employees,
  shifts,
  breakLogs,
  getUsedSeconds,
  getRemainingSeconds,
}) => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [shiftFilter, setShiftFilter] = useState<string>('all');

  // Filter logs strictly based on actual recorded timestamp
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const timeThreshold =
      timeRange === 'today'
        ? startOfToday.getTime()
        : timeRange === 'week'
        ? now - 7 * 24 * 60 * 60 * 1000
        : now - 30 * 24 * 60 * 60 * 1000;

    return breakLogs.filter(log => {
      const matchTime = log.startMs >= timeThreshold;
      const matchShift = shiftFilter === 'all' || log.shiftId === shiftFilter;
      return matchTime && matchShift;
    });
  }, [breakLogs, timeRange, shiftFilter]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (shiftFilter === 'all') return employees;
    return employees.filter(
      e => e.activeShiftId === shiftFilter || filteredLogs.some(l => l.employeeId === e.id)
    );
  }, [employees, shiftFilter, filteredLogs]);

  // Dynamic calculation of total minutes used from actual real records
  const totalUsedMinutes = useMemo(() => {
    const fromLogs = filteredLogs.reduce((acc, l) => acc + (l.durationSec || 0), 0);
    // Also include currently live ongoing breaks
    const ongoingSec = filteredEmployees
      .filter(e => e.activeBreakStartMs)
      .reduce((acc, e) => acc + Math.max(0, (Date.now() - (e.activeBreakStartMs || Date.now())) / 1000), 0);
    return Math.round((fromLogs + ongoingSec) / 60);
  }, [filteredLogs, filteredEmployees]);

  const totalBreakHours = Number((totalUsedMinutes / 60).toFixed(1));

  // Dynamic calculation of average break duration
  const avgBreakDuration = useMemo(() => {
    if (filteredLogs.length === 0) return '0.0 min';
    const totalSec = filteredLogs.reduce((acc, l) => acc + (l.durationSec || 0), 0);
    return `${(totalSec / filteredLogs.length / 60).toFixed(1)} min`;
  }, [filteredLogs]);

  // Dynamic productivity rate: scheduled work hours vs break time
  const productivityRate = useMemo(() => {
    const scheduledHoursPerDay = 8;
    const days = timeRange === 'today' ? 1 : timeRange === 'week' ? 5 : 22;
    const totalPossibleWorkHours = filteredEmployees.length * scheduledHoursPerDay * days;
    if (totalPossibleWorkHours === 0) return 100;
    const activeWorkingHours = Math.max(0, totalPossibleWorkHours - totalBreakHours);
    return Number(((activeWorkingHours / totalPossibleWorkHours) * 100).toFixed(1));
  }, [filteredEmployees.length, timeRange, totalBreakHours]);

  // Dynamic break duration distribution (Strictly from real filteredLogs)
  const durationDistribution = useMemo(() => {
    let quick = 0; // < 15 min
    let standard = 0; // 15 - 30 min
    let extended = 0; // 30 - 45 min
    let longBreak = 0; // > 45 min

    filteredLogs.forEach(log => {
      const min = log.durationSec / 60;
      if (min < 15) quick++;
      else if (min < 30) standard++;
      else if (min < 45) extended++;
      else longBreak++;
    });

    return [
      { label: '< 15m (Quick)', count: quick, color: 'var(--mint)' },
      { label: '15–30m (Standard)', count: standard, color: 'var(--brand)' },
      { label: '30–45m (Extended)', count: extended, color: 'var(--amber)' },
      { label: '> 45m (Long)', count: longBreak, color: 'var(--rose)' },
    ];
  }, [filteredLogs]);

  const maxDurationCount = Math.max(...durationDistribution.map(d => d.count), 1);
  const totalBreaksCount = filteredLogs.length;

  // Dynamic Shift breakdown strictly from real logs and active breaks
  const shiftBreakdown = useMemo(() => {
    return shifts.map((s, idx) => {
      const shiftLogs = filteredLogs.filter(l => l.shiftId === s.id);
      const logsMinutes = Math.round(shiftLogs.reduce((acc, l) => acc + (l.durationSec || 0), 0) / 60);

      // Add currently ongoing breaks for this shift
      const liveSec = employees
        .filter(e => e.activeShiftId === s.id && e.activeBreakStartMs)
        .reduce((acc, e) => acc + Math.max(0, (Date.now() - (e.activeBreakStartMs || Date.now())) / 1000), 0);

      const minutes = logsMinutes + Math.round(liveSec / 60);
      const colors = ['#315efb', '#10b981', '#f59e0b'];

      return {
        id: s.id,
        name: s.name,
        hours: s.hours,
        minutes,
        color: colors[idx % colors.length],
      };
    });
  }, [shifts, filteredLogs, employees]);

  const totalShiftMinutes = shiftBreakdown.reduce((acc, s) => acc + s.minutes, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Filter Toolbar */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Time Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} color="var(--brand)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-secondary)' }}>
            Time Range:
          </span>
          <div style={{ display: 'flex', background: 'var(--surface-subtle)', borderRadius: 8, padding: 3, border: '1px solid var(--border-subtle)' }}>
            {(['today', 'week', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: timeRange === range ? 'var(--surface-card)' : 'transparent',
                  color: timeRange === range ? 'var(--brand)' : 'var(--ink-muted)',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: timeRange === range ? 'var(--shadow-sm)' : 'none',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* Shift Scope Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="var(--ink-muted)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-secondary)' }}>
            Shift Scope:
          </span>
          <select
            value={shiftFilter}
            onChange={e => setShiftFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-card)',
              color: 'var(--ink-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="all">All Shifts Combined</option>
            {shifts.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Productivity KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-muted)', fontSize: 13, fontWeight: 600 }}>
            <span>Productivity Rate</span>
            <TrendingUp size={16} color="var(--mint)" />
          </div>
          <strong className="mono-text" style={{ display: 'block', fontSize: 28, marginTop: 12, color: 'var(--mint)' }}>
            {productivityRate}%
          </strong>
          <small style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
            on-duty active working ratio
          </small>
        </div>

        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-muted)', fontSize: 13, fontWeight: 600 }}>
            <span>Total Break Time</span>
            <BarChart2 size={16} color="var(--brand)" />
          </div>
          <strong className="mono-text" style={{ display: 'block', fontSize: 28, marginTop: 12, color: 'var(--ink-primary)' }}>
            {totalUsedMinutes} min
          </strong>
          <small style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
            ({totalBreakHours} hrs) in {timeRange}
          </small>
        </div>

        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-muted)', fontSize: 13, fontWeight: 600 }}>
            <span>Avg Break Duration</span>
            <Calendar size={16} color="var(--amber)" />
          </div>
          <strong className="mono-text" style={{ display: 'block', fontSize: 28, marginTop: 12, color: 'var(--ink-primary)' }}>
            {avgBreakDuration}
          </strong>
          <small style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
            across {totalBreaksCount} recorded breaks
          </small>
        </div>

        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-muted)', fontSize: 13, fontWeight: 600 }}>
            <span>Audited Members</span>
            <Users size={16} color="var(--purple)" />
          </div>
          <strong className="mono-text" style={{ display: 'block', fontSize: 28, marginTop: 12, color: 'var(--ink-primary)' }}>
            {filteredEmployees.length}
          </strong>
          <small style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
            registered workforce
          </small>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 18,
        }}
      >
        {/* Chart 1: Break Duration Distribution (Bar Chart) */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '22px 24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h4 style={{ fontSize: 16, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={18} color="var(--brand)" />
            Break Duration Distribution
          </h4>
          <p style={{ margin: '0 0 20px', color: 'var(--ink-muted)', fontSize: 12 }}>
            Interval breakdown of {totalBreaksCount} recorded breaks
          </p>

          {totalBreaksCount === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13, background: 'var(--surface-subtle)', borderRadius: 8, border: '1px dashed var(--border-color)' }}>
              No completed breaks recorded for this timeframe yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {durationDistribution.map(item => {
                const pct = Math.round((item.count / maxDurationCount) * 100);
                return (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink-secondary)' }}>{item.label}</span>
                      <span className="mono-text" style={{ fontWeight: 700, color: 'var(--ink-primary)' }}>
                        {item.count} breaks
                      </span>
                    </div>
                    <div style={{ height: 10, background: 'var(--surface-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: item.color,
                          borderRadius: 6,
                          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Shift Break Load Share (Donut Chart) */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '22px 24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h4 style={{ fontSize: 16, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={18} color="var(--mint)" />
            Shift Break Load Allocation
          </h4>
          <p style={{ margin: '0 0 20px', color: 'var(--ink-muted)', fontSize: 12 }}>
            Real-time break minutes consumed per shift
          </p>

          {totalShiftMinutes === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13, background: 'var(--surface-subtle)', borderRadius: 8, border: '1px dashed var(--border-color)' }}>
              0 break minutes recorded yet. As breaks are taken, shift proportions will display here.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
              {/* SVG Donut Chart */}
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  {(() => {
                    let accumulatedAngle = 0;
                    const radius = 52;
                    const center = 70;
                    const strokeWidth = 20;
                    const circumference = 2 * Math.PI * radius;

                    return shiftBreakdown.map((s) => {
                      const ratio = s.minutes / totalShiftMinutes;
                      if (ratio === 0) return null;
                      const strokeDasharray = `${ratio * circumference} ${circumference}`;
                      const strokeDashoffset = -accumulatedAngle * circumference;
                      accumulatedAngle += ratio;

                      return (
                        <circle
                          key={s.name}
                          cx={center}
                          cy={center}
                          r={radius}
                          fill="none"
                          stroke={s.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%',
                            transition: 'stroke-dasharray 0.6s ease',
                          }}
                        />
                      );
                    });
                  })()}
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <strong className="mono-text" style={{ fontSize: 16, color: 'var(--ink-primary)' }}>
                    {totalShiftMinutes}m
                  </strong>
                  <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>Total</span>
                </div>
              </div>

              {/* Donut Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shiftBreakdown.map(s => {
                  const pct = totalShiftMinutes > 0 ? Math.round((s.minutes / totalShiftMinutes) * 100) : 0;
                  return (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-primary)' }}>
                          {s.name}
                        </div>
                        <div className="mono-text" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                          {s.minutes} min ({pct}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtered Team Breakdown Table */}
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
          <h3 style={{ fontSize: 16, margin: 0 }}>
            Individual Allowance & Usage Breakdown ({timeRange.toUpperCase()})
          </h3>
          <p style={{ margin: '3px 0 0', color: 'var(--ink-muted)', fontSize: 12 }}>
            Real-time break usage per employee for selected scope
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Team Member</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700, textAlign: 'right' }}>Total Break Time</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700, textAlign: 'right' }}>Daily Cap</th>
                <th style={{ padding: '12px 18px', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 700 }}>Utilization Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => {
                const used = Math.round(getUsedSeconds(emp) / 60);
                const cap = Math.round(DAILY_CAP_SECONDS / 60);
                const isOver = used > cap;

                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '13px 18px', fontWeight: 600 }}>{emp.name}</td>
                    <td className="mono-text" style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 600 }}>
                      {used} min
                    </td>
                    <td className="mono-text" style={{ padding: '13px 18px', textAlign: 'right', color: 'var(--ink-muted)' }}>
                      {cap} min
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <span
                        className="mono-text"
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 700,
                          background: isOver ? 'var(--rose-light)' : 'var(--mint-light)',
                          color: isOver ? 'var(--rose)' : 'var(--mint)',
                          border: `1px solid ${isOver ? 'var(--rose-border)' : 'var(--mint-border)'}`,
                        }}
                      >
                        {isOver ? 'EXCEEDED' : 'WITHIN BUDGET'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
