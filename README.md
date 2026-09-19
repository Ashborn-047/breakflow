# ⏱️ BreakFlow — Intelligent Workplace Break & Shift Tracker

[![GitHub Pages Deployment](https://github.com/Ashborn-047/breakflow/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Ashborn-047/breakflow/actions/workflows/deploy-pages.yml)
[![E2E Playwright Tests](https://github.com/Ashborn-047/breakflow/actions/workflows/e2e.yml/badge.svg)](https://github.com/Ashborn-047/breakflow/actions/workflows/e2e.yml)
[![SpacetimeDB Cloud](https://img.shields.io/badge/SpacetimeDB-Cloud%20Synced-8A2BE2.svg)](https://spacetimedb.com/breakflow)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-10%2F10%20Passed-2EAD33.svg)](https://playwright.dev/)

**BreakFlow** is a modern, production-grade workplace coordination platform designed for multi-shift team operations. It enforces fair operational coverage, tracks individual daily allowances, coordinates monthly rotating shifts, and synchronizes real-time state with zero configuration across LocalStorage and SpacetimeDB Cloud.

---

## 🌟 Key Highlights & Capabilities

- **⚡ Zero-Configuration Dual-Sync Architecture**:
  - Instant local read/write persistence (<1ms) via LocalStorage driver.
  - Simultaneous cloud synchronization via SpacetimeDB Cloud (`wss://maincloud.spacetimedb.com`).
  - Seamless offline resilience — users can log breaks uninterrupted even during temporary network reconnections.

- **🔄 Monthly Dynamic Shift Rotation**:
  - Shifts rotate monthly across the team.
  - Team members are not statically hardcoded into cards; the break punch kiosk allows any employee to select their active shift dynamically.

- **🛡️ Strict Concurrency Policy Guard**:
  - Configurable maximum concurrency cap (2 concurrent breaks per shift).
  - When capacity is reached, further breaks are blocked and a dedicated **Capacity Full Modal** displays active break-takers, elapsed timers, and allows immediate slot release.

- **👥 24 Configurable Team Members (Alphabetical Roster)**:
  - Workforce roster initialized in alphabetical ascending order from **Employee 01** to **Employee 24**.
  - Dynamic member additions and removals automatically synchronized to both local state and SpacetimeDB cloud.

- **📊 3 Distinct Dedicated Dashboards (100% Dynamic)**:
  1. **Live Shift Board**: Real-time slot utilization, active SVG countdown gauges, quick-punch terminals, and shift activity feeds.
  2. **Live Capacity & Telemetry**: Saturation meters, active break telemetry, and shift load distribution.
  3. **Productivity & Analytics**: Real-time team productivity rates, time-filter analytics (Today, This Week, This Month), and load allocation charts.

- **🎨 Modern Visual Design System**:
  - Built with pure Vanilla CSS tokens, glassmorphic overlays, and GSAP micro-animations.
  - High-contrast Dark / Light theme toggle with local preference persistence.
  - Responsive layouts optimized for desktop terminals, wall displays, and mobile devices.

- **📥 Data Export & Handover**:
  - One-click export to universal CSV and Excel spreadsheet (`.xls`) format with shift-scoping filters.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** + **TypeScript** | Strict type safety, functional architecture, zero `any` types |
| **Build Tooling** | **Vite 6** | Instant HMR, lightning-fast compilation, optimized chunk bundling |
| **Animation & Telemetry** | **GSAP** + **SVG Gauges** | High-performance hardware-accelerated gauge transitions |
| **Database & Cloud** | **SpacetimeDB Cloud** (`maincloud`) | Relational in-memory database with serverless reducers and tables |
| **Local Persistence** | **LocalStorage Driver** | Zero-latency instant fallback and optimistic UI updates |
| **E2E Testing** | **Playwright** | 10 automated test suites verifying all edge cases and workflows |
| **CI/CD** | **GitHub Actions** | Automated Playwright test pipeline + automated GitHub Pages deploy |

---

## 🗄️ SpacetimeDB Cloud Schema

Published database name: **`breakflow`**  
Host: `https://maincloud.spacetimedb.com`  
Dashboard: [https://spacetimedb.com/breakflow](https://spacetimedb.com/breakflow)

### Tables
- **`employee`**: `id` (PK), `name`, `activeShiftId`, `dailyUsedSeconds`, `activeBreakStartMs`
- **`shift`**: `id` (PK), `name`, `hours`, `startHour`, `endHour`, `maxConcurrent`
- **`breakLog`**: `id` (AutoInc PK), `employeeId`, `employeeName`, `shiftId`, `shiftName`, `startMs`, `endMs`, `durationSec`

### Reducers
- `startBreak(employeeId, shiftId)`: Validates active breaks, allowance caps, and shift concurrency before starting timer.
- `endBreak(employeeId)`: Computes exact duration, accrues daily usage, and inserts into `breakLog`.
- `registerEmployee(id, name)`: Adds new team member to database.
- `removeEmployee(employeeId)`: Drops employee record from database.
- `resetDay()`: Clears active breaks and daily counters for fresh shift cycles.
- `seedData()`: Automatically populates all 24 verified team members and default shifts.

---

## 🧪 E2E Playwright Test Suite

The test suite in [`e2e/break-tracker.spec.ts`](./e2e/break-tracker.spec.ts) runs on Chrome / Chromium and tests all real-world flows:

```bash
Running 10 tests using 1 worker

  ok  1 › Initial Load & Verified Roster Count (751ms)
  ok  2 › All 24 Real Team Members Are Sorted Alphabetically (1.1s)
  ok  3 › Break Punch Lifecycle (Start & End Break) (1.4s)
  ok  4 › Concurrency Policy Enforcement (2 Slots Max per Shift) (2.2s)
  ok  5 › Tab Navigation & Telemetry Views (1.7s)
  ok  6 › Roster Management (Add & Remove Team Member) (1.4s)
  ok  7 › Dark & Light Theme Toggle & Persistence (1.2s)
  ok  8 › Reset Day Flow (1.3s)
  ok  9 › Search Filtering in Kiosk and Shift Board (988ms)
  ok 10 › Export Report Modal & Shift Selection (1.0s)

10 passed (14.2s)
```

Run tests locally:
```bash
npm run test:e2e
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ashborn-047/breakflow.git
   cd breakflow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🌐 GitHub Pages Deployment & Secrets Guide

### Do you need GitHub Secrets?
> [!NOTE]  
> **NO external secrets are required** for basic deployment!  
> The GitHub Pages deployment workflow uses GitHub's built-in `GITHUB_TOKEN` with `pages: write` permissions.

### Enabling GitHub Pages on your repository:
1. Go to your repository on GitHub: `https://github.com/Ashborn-047/breakflow`
2. Click **Settings** → **Pages** (in the left sidebar).
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. Push your code to the `main` branch. The [`deploy-pages.yml`](./.github/workflows/deploy-pages.yml) workflow will automatically build and publish your site!

---

## 📄 License
This project is licensed under the ISC License.
