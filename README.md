# ⏱️ BreakFlow — Intelligent Workplace Break & Shift Telemetry Platform

<div align="center">

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.6-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://html.spec.whatwg.org/)
[![CSS3](https://img.shields.io/badge/CSS3_Tokens-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![Vite](https://img.shields.io/badge/Vite_6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![SpacetimeDB Cloud](https://img.shields.io/badge/SpacetimeDB_Cloud-8A2BE2?style=for-the-badge&logo=databricks&logoColor=white)](https://spacetimedb.com)
[![Playwright](https://img.shields.io/badge/Playwright_E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Node.js](https://img.shields.io/badge/Node.js_24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![GSAP](https://img.shields.io/badge/GSAP_Hardware_Accel-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/gsap/)

<br/>

[![GitHub Pages Deployment](https://github.com/Ashborn-047/breakflow/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Ashborn-047/breakflow/actions/workflows/deploy-pages.yml)
[![E2E Playwright Tests](https://github.com/Ashborn-047/breakflow/actions/workflows/e2e.yml/badge.svg)](https://github.com/Ashborn-047/breakflow/actions/workflows/e2e.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production_Ready-brightgreen.svg)]()

<p align="center">
  <strong>BreakFlow</strong> is a high-reliability, real-time workplace break coordination and shift telemetry engine engineered for mission-critical operations. It delivers sub-millisecond local optimistic latency, 2-slot concurrency enforcement, rotating shift rosters, and continuous multi-device cloud synchronization powered by <strong>SpacetimeDB Cloud</strong>.
</p>

</div>

---

## 🏛️ System Architecture & Engineering Design

BreakFlow is engineered as a **dual-tier optimistic telemetry platform**. It guarantees zero UI blocking via instant local persistence while asynchronously coordinating with an in-memory relational cloud database.

### 1. High-Level System Architecture

```mermaid
graph TD
    subgraph Client ["Client Browser Tier (React 19 + TypeScript)"]
        UI["Modern Web Interface<br/>(Shift Board · Telemetry · Analytics)"]
        Kiosk["Punch Kiosk & Terminal<br/>(Dynamic Shift & Member Picker)"]
        Arbiter["Concurrency Policy Arbiter<br/>(2-Slot Cap Enforcement)"]
        SM["DualSyncStorageManager<br/>(State Orchestrator)"]
    end

    subgraph LocalEngine ["Local Persistence Tier (< 1ms)"]
        LSD["LocalStorageDriver<br/>(breakflow_local_v5)"]
        MemCache["In-Memory State Snapshot<br/>(Optimistic UI Engine)"]
    end

    subgraph CloudTier ["SpacetimeDB Cloud Tier (Realtime)"]
        REST["SpacetimeDB HTTP / REST Engine<br/>(/v1/database/breakflow)"]
        Reducers["Serverless Reducers<br/>(start_break · end_break · reset_day)"]
        Tables["Relational Tables<br/>(employee · shift · break_log)"]
        TelemetryHeartbeat["Telemetry Ping Monitor<br/>(Roundtrip Latency Heartbeat)"]
    end

    UI --> SM
    Kiosk --> Arbiter
    Arbiter --> SM
    SM -->|Immediate Sync <1ms| MemCache
    MemCache -->|Local Storage Flush| LSD
    SM -->|Async Cloud Dispatch| REST
    REST --> Reducers
    Reducers --> Tables
    TelemetryHeartbeat -->|Every 10s Ping| REST
    REST -.->|Realtime Latency ms| UI
```

---

### 2. Dual-Sync State Machine & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Employee as Team Member
    participant UI as BreakFlow UI
    participant Arbiter as Concurrency Arbiter
    participant Local as LocalStorage Driver
    participant Cloud as SpacetimeDB Cloud

    Employee->>UI: Punch "Start Break" (Select Shift)
    UI->>Arbiter: Check active break slots for shift
    alt Shift has >= 2 active breaks
        Arbiter-->>UI: REJECT: Slots Full (Capacity Cap Reached)
        UI-->>Employee: Display "Break Slots Full (2/2 Active)" Warning Modal
    else Shift has < 2 active breaks
        Arbiter-->>UI: APPROVE: Slot Available
        UI->>Local: Write active break immediately (<1ms)
        Local-->>UI: Local State Updated & Persisted
        UI-->>Employee: Instant Toast & Live Gauge Animation (0ms perceived latency)
        par Cloud Synchronization
            UI->>Cloud: POST /v1/database/breakflow/call/start_break [empId, shiftId]
            Cloud->>Cloud: Execute reducer & update employee record
            Cloud-->>UI: HTTP 200 OK
        and Health & Latency Telemetry
            UI->>Cloud: POST /v1/database/breakflow/sql (SELECT * FROM employee)
            Cloud-->>UI: 200 OK (Calculate real roundtrip latency: 24ms - 260ms)
            UI->>UI: Render Green Pill: Synced (Local + Cloud 258ms)
        end
    end
```

---

### 3. Concurrency Policy & Slot Lifecycle Invariants

BreakFlow enforces rigorous operational fairness rules across all shifts:

```mermaid
stateDiagram-v2
    [*] --> OnDuty: Employee Registered
    OnDuty --> SlotValidation: Request Break Punch
    
    state SlotValidation {
        [*] --> CheckAllowance
        CheckAllowance --> AllowanceExceeded: Daily Used >= 60m
        CheckAllowance --> CheckShiftCapacity: Daily Used < 60m
        CheckShiftCapacity --> ShiftSaturated: Active Slots == 2
        CheckShiftCapacity --> SlotGranted: Active Slots < 2
    }

    AllowanceExceeded --> OnDuty: Blocked (Daily Allowance Exhausted)
    ShiftSaturated --> CapacityModal: Blocked (Max 2 Concurrent Breakers)
    CapacityModal --> OnDuty: User waits or ends existing break
    SlotGranted --> OnBreak: Active Timer Begins
    
    OnBreak --> EndBreakAction: Click "End Break"
    EndBreakAction --> ComputeDuration: Calculate Elapsed Seconds
    ComputeDuration --> LogBreakRecord: Insert into break_log
    LogBreakRecord --> OnDuty: Slot Released & Usage Accrued
```

---

## 🌟 Key Features & Capabilities

- **⚡ Zero-Configuration Dual-Sync Engine**:
  - Instant local read/write persistence (<1ms) via `LocalStorageDriver`.
  - Simultaneous cloud synchronization via SpacetimeDB Cloud (`https://maincloud.spacetimedb.com`).
  - Offline-first resilience — all operations function standalone during connectivity interruptions and reconcile automatically upon reconnecting.

- **🛡️ Strict 2-Slot Concurrency Policy**:
  - Enforces a maximum of 2 simultaneous breaks per shift.
  - Saturated shifts trigger an interactive **Capacity Overflow Modal** displaying current active break-takers, elapsed timers, and immediate slot release actions.

- **🔄 Monthly Dynamic Shift Rotation**:
  - Team members rotate through monthly shifts (`Morning shift`, `Afternoon shift`, `Night shift`).
  - Employees are not hardcoded to fixed shifts; team members select their active rotation at punch time.

- **👥 Alphabetical 24-Member Workforce Roster**:
  - All 24 verified team members (`Abhay Mishra` through `Vedika Vivek Bhosle`) seeded alphabetically.
  - Complete roster management interface allowing dynamic team addition, removal, and real-time synchronization.

- **📊 3 Distinct Dynamic Telemetry Dashboards**:
  1. **Live Shift Board**: Real-time slot occupancy, SVG animated countdown gauges, and recent activity audit logs.
  2. **Live Capacity & Telemetry**: Shift load saturation meters, active break-taker telemetry, and capacity headroom.
  3. **Productivity & Analytics**: Live workforce productivity rates, duration distribution histograms, and time filters (`Today`, `This Week`, `This Month`).

- **🎨 Modern Visual Design System**:
  - High-performance Vanilla CSS token system with glassmorphism and subtle elevation.
  - Hardware-accelerated SVG gauge animations powered by GSAP.
  - Instant Dark / Light theme toggle with persisted user preference.
  - Fully responsive on desktop screens, operations terminals, and mobile devices.

- **📥 Universal Data Export**:
  - One-click export to CSV and formatted Microsoft Excel (`.xls`) spreadsheets with shift-scoping filters.

---

## 📁 Repository Structure

```
breakflow/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml      # Automated GitHub Pages production deployment
│       └── e2e.yml               # Automated Playwright test pipeline
├── e2e/
│   └── break-tracker.spec.ts     # 10 comprehensive end-to-end integration tests
├── public/                       # Static public assets
├── spacetimedb/
│   └── spacetimedb/
│       └── src/index.ts          # SpacetimeDB TypeScript schema & serverless reducers
├── spacetimedb-rust/             # SpacetimeDB Rust module alternative
│   └── src/lib.rs
├── src/
│   ├── components/
│   │   ├── analytics/            # Productivity charts & saturation telemetry
│   │   ├── board/                # Shift cards & real-time slot displays
│   │   ├── common/               # Animated SVG gauges & UI components
│   │   ├── kiosk/                # Break punch terminal & autocomplete
│   │   ├── layout/               # Header with live cloud latency pill & footer
│   │   ├── modals/               # Roster management & export report modals
│   │   └── telemetry/            # Live telemetry dashboard tab
│   ├── hooks/
│   │   └── useBreakTracker.ts    # React state hook & reactive store subscriptions
│   ├── services/
│   │   └── storage/
│   │       ├── IStorageAdapter.ts # Storage interface contract
│   │       ├── LocalStorageDriver.ts # Offline-first local storage driver
│   │       ├── SpacetimeDriver.ts # SpacetimeDB Cloud REST client & heartbeat
│   │       └── index.ts          # DualSyncStorageManager orchestrator
│   ├── types/
│   │   └── index.ts              # Global TypeScript models & 24 team member roster
│   ├── App.tsx                   # Main application router & tab controller
│   ├── index.css                 # Comprehensive CSS design tokens & themes
│   └── main.tsx                  # React 19 entry point
├── playwright.config.ts          # Playwright test configuration with UTC simulation
├── tsconfig.json                 # TypeScript strict compiler configuration
└── vite.config.ts                # Vite 6 build configuration & GitHub Pages base
```

---

## 🗄️ SpacetimeDB Cloud Architecture

- **Database Name:** `breakflow`
- **Host:** `https://maincloud.spacetimedb.com`
- **Console / Dashboard:** [https://spacetimedb.com/breakflow](https://spacetimedb.com/breakflow)

### Database Tables
| Table | Primary Key | Attributes | Description |
| :--- | :--- | :--- | :--- |
| **`employee`** | `id` (String) | `name`, `activeShiftId`, `dailyUsedSeconds`, `activeBreakStartMs` | Workforce members and live break state |
| **`shift`** | `id` (String) | `name`, `hours`, `startHour`, `endHour`, `maxConcurrent` | Shift operating schedules and slot caps |
| **`breakLog`** | `id` (AutoInc U64) | `employeeId`, `employeeName`, `shiftId`, `shiftName`, `startMs`, `endMs`, `durationSec` | Historical telemetry audit records |

### Reducer Functions
- **`start_break(employeeId, shiftId)`**: Atomically checks allowance and shift occupancy before initiating break.
- **`end_break(employeeId)`**: Calculates precise duration, accumulates daily usage, releases slot, and inserts audit log.
- **`register_employee(id, name)`**: Dynamically registers a team member to the cloud roster.
- **`remove_employee(employeeId)`**: Drops employee record from database.
- **`reset_day()`**: Clears active breaks and daily counters for fresh daily operations.
- **`seed_data()`**: Seeds default shifts and all 24 verified team members.

---

## 🧪 Comprehensive E2E Testing

The Playwright test suite in [`e2e/break-tracker.spec.ts`](./e2e/break-tracker.spec.ts) validates real-world operational workflows under strict UTC conditions:

```bash
Running 10 tests using 1 worker

  ✓  1 e2e/break-tracker.spec.ts: 1. Initial Load & Verified Roster Count (812ms)
  ✓  2 e2e/break-tracker.spec.ts: 2. All 24 Team Members Are Sorted Alphabetically (1.1s)
  ✓  3 e2e/break-tracker.spec.ts: 3. Break Punch Lifecycle (Start & End Break) (1.2s)
  ✓  4 e2e/break-tracker.spec.ts: 4. Concurrency Policy Enforcement (2 Slots Max per Shift) (2.2s)
  ✓  5 e2e/break-tracker.spec.ts: 5. Tab Navigation & Telemetry Views (1.4s)
  ✓  6 e2e/break-tracker.spec.ts: 6. Roster Management (Add & Remove Team Member) (1.3s)
  ✓  7 e2e/break-tracker.spec.ts: 7. Dark & Light Theme Toggle & Persistence (1.0s)
  ✓  8 e2e/break-tracker.spec.ts: 8. Reset Day Flow (1.2s)
  ✓  9 e2e/break-tracker.spec.ts: 9. Search Filtering in Kiosk and Shift Board (657ms)
  ✓ 10 e2e/break-tracker.spec.ts: 10. Export Report Modal & Shift Selection (939ms)

  10 passed (16.7s)
```

Run tests locally:
```bash
npm run test:e2e
```

---

## 🚀 Quick Start & Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/)

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ashborn-047/breakflow.git
   cd breakflow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

4. **Production build**:
   ```bash
   npm run build
   ```

---

## 🌐 GitHub Pages Deployment & Secrets Guide

### Do you need GitHub Secrets?
> [!NOTE]  
> **NO external secrets are required!**  
> The deployment workflow uses GitHub's built-in `GITHUB_TOKEN` with automatic `pages: write` permissions.

### Enabling GitHub Pages on your repository:
1. Navigate to **Settings** → **Pages** on your repository.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Pushes to `main` automatically run the [`deploy-pages.yml`](./.github/workflows/deploy-pages.yml) workflow and publish your site!

---

## 📄 License
This project is licensed under the [ISC License](LICENSE).
