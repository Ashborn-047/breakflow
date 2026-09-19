import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Coffee, ShieldCheck, Users } from 'lucide-react';

import { useBreakTracker } from './hooks/useBreakTracker';
import { useDatabaseStatus } from './hooks/useDatabaseStatus';
import { Header } from './components/layout/Header';
import { Hero } from './components/layout/Hero';
import { AppTab, NavigationTabs } from './components/layout/NavigationTabs';
import { StatCard } from './components/common/StatCard';
import { ShiftCard } from './components/board/ShiftCard';
import { LiveTelemetryView } from './components/telemetry/LiveTelemetryView';
import { ProductivityDashboard } from './components/analytics/ProductivityDashboard';
import { KioskModal } from './components/modals/KioskModal';
import { RosterModal } from './components/modals/RosterModal';
import { ExportModal } from './components/modals/ExportModal';
import { CapacityFullModal } from './components/modals/CapacityFullModal';
import { Employee, Shift } from './types';

export const App: React.FC = () => {
  const {
    state,
    shifts,
    employees,
    breakLogs,
    currentShift,
    totalOnBreak,
    totalCapacity,
    totalMinutesUsed,
    totalOpenSlots,
    getUsedSeconds,
    getRemainingSeconds,
    getActiveBreaksInShift,
    startBreak,
    endBreak,
    addEmployee,
    removeEmployee,
    resetDay,
  } = useBreakTracker();

  const { status: syncStatus } = useDatabaseStatus();

  // Dark/Light Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('breakflow-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('breakflow-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('breakflow-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Tab Navigation (3 distinct views)
  const [activeTab, setActiveTab] = useState<AppTab>('board');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [kioskShiftId, setKioskShiftId] = useState<string | undefined>(undefined);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Capacity full warning modal state
  const [capacityModalShift, setCapacityModalShift] = useState<Shift | null>(null);
  const [capacityModalActiveEmployees, setCapacityModalActiveEmployees] = useState<Employee[]>([]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Handlers
  const handleOpenKiosk = (preferredShiftId?: string) => {
    const targetShiftId = preferredShiftId || currentShift.id;
    const targetShift = shifts.find(s => s.id === targetShiftId) || currentShift;
    const activeInShift = getActiveBreaksInShift(targetShift.id);

    // If shift is full, show the pop-up warning
    if (activeInShift.length >= targetShift.maxConcurrent) {
      setCapacityModalShift(targetShift);
      setCapacityModalActiveEmployees(activeInShift);
      return;
    }

    setKioskShiftId(targetShiftId);
    setIsKioskOpen(true);
  };

  const handleOpenKioskForShift = (shiftId: string) => {
    handleOpenKiosk(shiftId);
  };

  const handleEndBreak = async (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    const res = await endBreak(employeeId);
    if (res.success) {
      showToast(`${emp?.name || 'Employee'} break ended successfully`);
    } else {
      showToast(res.error || 'Failed to end break');
    }
  };

  const handleStartBreak = async (employeeId: string, shiftId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    const res = await startBreak(employeeId, shiftId);
    if (res.success) {
      showToast(`${emp?.name || 'Employee'} is now on break`);
    }
    return res;
  };

  const handleResetDay = async () => {
    if (confirm("Reset all break times and clear today's audit history for a fresh cycle?")) {
      await resetDay();
      showToast('Daily break cycle has been reset');
    }
  };

  // Filtered employees for search
  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Topbar Header with Automatic Dual-Sync */}
      <Header
        syncStatus={syncStatus}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenRoster={() => setIsRosterOpen(true)}
      />

      {/* Hero Section */}
      <Hero
        activeBreaksCount={totalOnBreak}
        onOpenKiosk={() => handleOpenKiosk()}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Metric Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 26,
        }}
      >
        <StatCard
          label="Registered Team"
          value={employees.length}
          sublabel="available in workforce pool"
          icon={<Users size={17} />}
          iconBg="var(--brand-light)"
          iconColor="var(--brand)"
        />

        <StatCard
          label="On Break Now"
          value={totalOnBreak}
          sublabel={`of ${totalCapacity} maximum slots`}
          icon={<Coffee size={17} />}
          iconBg="var(--amber-light)"
          iconColor="var(--amber)"
        />

        <StatCard
          label="Minutes Used"
          value={totalMinutesUsed}
          sublabel="combined team break time"
          icon={<Clock size={17} />}
          iconBg="var(--purple-light)"
          iconColor="var(--purple)"
        />

        <StatCard
          label="Break Availability"
          value={totalOpenSlots}
          sublabel="slots open across shifts"
          icon={<ShieldCheck size={17} />}
          iconBg="var(--mint-light)"
          iconColor="var(--mint)"
        />
      </div>

      {/* Tab Navigation, Search, and Reset */}
      <NavigationTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onResetDay={handleResetDay}
      />

      {/* Tab 1: Live Shift Board */}
      {activeTab === 'board' && (
        <main>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 18,
            }}
          >
            {shifts.map(shift => {
              const activeInShift = getActiveBreaksInShift(shift.id);
              const shiftLogs = breakLogs.filter(l => l.shiftId === shift.id);

              return (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  activeBreaks={activeInShift}
                  recentLogs={shiftLogs}
                  getUsedSeconds={getUsedSeconds}
                  onEndBreak={handleEndBreak}
                  onOpenKioskForShift={handleOpenKioskForShift}
                />
              );
            })}
          </div>
        </main>
      )}

      {/* Tab 2: Live Telemetry & Shift Capacity Saturation */}
      {activeTab === 'telemetry' && (
        <main>
          <LiveTelemetryView
            shifts={shifts}
            employees={filteredEmployees}
            getUsedSeconds={getUsedSeconds}
            onEndBreak={handleEndBreak}
            onOpenKioskForShift={handleOpenKioskForShift}
          />
        </main>
      )}

      {/* Tab 3: Productivity & Analytics Dashboard with Day/Week/Month & Shift Filters */}
      {activeTab === 'analytics' && (
        <main>
          <ProductivityDashboard
            employees={filteredEmployees}
            shifts={shifts}
            breakLogs={breakLogs}
            getUsedSeconds={getUsedSeconds}
            getRemainingSeconds={getRemainingSeconds}
          />
        </main>
      )}

      {/* Footer info */}
      <footer
        style={{
          marginTop: 36,
          textAlign: 'center',
          color: 'var(--ink-muted)',
          fontSize: 12,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>
          BreakFlow Intelligent Workplace Telemetry · {syncStatus.statusText}
        </span>
      </footer>

      {/* Modals */}
      <KioskModal
        isOpen={isKioskOpen}
        onClose={() => setIsKioskOpen(false)}
        employees={employees}
        shifts={shifts}
        initialShiftId={kioskShiftId}
        getUsedSeconds={getUsedSeconds}
        getRemainingSeconds={getRemainingSeconds}
        onStartBreak={handleStartBreak}
        onEndBreak={async id => {
          const res = await endBreak(id);
          if (res.success) showToast('Break ended successfully');
          return res;
        }}
        onRegisterEmployee={async name => {
          const newEmp = await addEmployee(name);
          showToast(`${newEmp.name} registered in database`);
          return newEmp;
        }}
        onShowCapacityFull={(shift, active) => {
          setCapacityModalShift(shift);
          setCapacityModalActiveEmployees(active);
        }}
      />

      <CapacityFullModal
        isOpen={!!capacityModalShift}
        onClose={() => setCapacityModalShift(null)}
        shift={capacityModalShift}
        activeEmployees={capacityModalActiveEmployees}
        getUsedSeconds={getUsedSeconds}
        onEndBreak={handleEndBreak}
      />

      <RosterModal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        employees={employees}
        onAddEmployee={async name => {
          const newEmp = await addEmployee(name);
          showToast(`${newEmp.name} added to roster`);
          return newEmp;
        }}
        onRemoveEmployee={async id => {
          await removeEmployee(id);
          showToast('Employee removed from database');
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        state={state}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--ink-primary)',
            color: 'var(--surface-card)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={16} color="var(--mint)" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
