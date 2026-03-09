# Rate Schedule — Handover for Kerran

## Overview
Rate schedule generation — client-facing pricing documents from live TMS data. QuestPDF for PDF output, React frontend for preview/config.

## ⚠️ Important: Menu Framework

The Rate Schedule frontend lives **inside the DFRNT Reports app** — NOT as a standalone app. The reports app (`Deliver-Different-Testing/reports`) has a shared sidebar navigation that all report tools share.

### Reports App Menu Structure (`web/src/App.tsx`)

```tsx
// Sidebar navigation — all report pages share this shell
const navItems = [
  { to: '/library',             icon: Library,    label: 'Report Library' },
  { to: '/builder',             icon: BarChart3,  label: 'Report Builder' },
  { to: '/attachment-builder',  icon: Paperclip,  label: 'Attachment Builder' },
  { to: '/rate-schedule',       icon: Zap,        label: 'Rate Schedule' },
]
```

**Design tokens:**
- Sidebar: `bg-[#0d0c2c]` (DFRNT primary dark)
- Active item: `text-[#3bc7f4]` cyan, left border `#3bc7f4`, bg `rgba(59,199,244,0.08)`
- Inactive: `text-white/60`, hover `text-white bg-white/5`
- Content area: `bg-[#f4f2f1]` (DFRNT light grey)
- Logo: 36px rounded square `bg-[#3bc7f4]` with "D"

### Layout
```
┌──────────────┬─────────────────────────────────┐
│              │                                 │
│   DFRNT      │   <main> — your page renders    │
│   Reports    │   here with full width/height   │
│              │                                 │
│  ● Library   │                                 │
│  ● Builder   │                                 │
│  ● Attach    │                                 │
│  ● Rates  ◄──│── Rate Schedule page            │
│              │                                 │
└──────────────┴─────────────────────────────────┘
```

Your Rate Schedule page component goes in `web/src/pages/RateSchedule/RateSchedule.tsx`. The existing file already has a working implementation with mock data — build on top of it.

**Do NOT create a separate app with its own layout/nav.** Just export a React component that renders inside `<main>`.

---

## Repos

| Repo | What's there | Branch |
|------|-------------|--------|
| `Deliver-Different-Testing/reports` | **Main repo** — React frontend (`web/`), EF Core backend spec (`Documents/`), existing Rate Schedule page | `main` |
| `Deliver-Different-Testing/rate-schedule` | HTML mockup only (57 suburbs, static prices) | `main` |

### Key files in `reports` repo:

**Frontend** (`web/src/pages/RateSchedule/`):
- `RateSchedule.tsx` — Full React page with client search, suburb matrix, CSV export, prospect mode, service group tabs
- `mockData.ts` — 57 suburbs, 10 speeds, mock clients, regional/international data

**Backend spec** (`Documents/`):
- `rates-guide-spec.md` — Architecture overview, API design, status
- `rate-schedule-ef/` — 15 EF Core files:
  - `RateScheduleService.cs` — Main service calling `UTL_fncJob_Rate` per cell
  - `RateScheduleController.cs` — API controller (JSON + CSV endpoints)
  - `IRateScheduleService.cs` — Service interface
  - `RateScheduleRequest.cs`, `RateScheduleResponse.cs`, `RateScheduleItem.cs` — DTOs
  - `ClientRateInfo.cs` — Internal client data model
  - `TblRateCode.cs` — EF entity for `tblRateCode`
  - `IRateScheduleService.cs`, `IRegionalRateService.cs`, `IInternationalRateService.cs` — Service interfaces
  - `RegionalRateService.cs`, `RegionalRateItem.cs` — Regional pricing
  - `InternationalRateService.cs`, `InternationalRateItem.cs` — International pricing
  - `ServiceGroup.cs`, `ProspectRateRequest.cs` — Supporting types
  - `IMPLEMENTATION.md` — Detailed integration guide with SP mappings, entity mappings, performance notes
  - `GAPS.md` — Known gaps

---

## Architecture

### Data Flow
```
Client selects client → 
  EF Core loads client info (suburb, rate code) →
    Service iterates suburb × speed matrix →
      Calls UTL_fncJob_Rate (SQL scalar function) per cell →
        Returns rate matrix →
          QuestPDF renders landscape A4 PDF
          React renders interactive preview
```

### Key SQL Objects
- **`UTL_fncJob_Rate`** — scalar function, the rate calculator (decades of business logic, don't rewrite)
- **`UTL_stpJob_VariableModification`** — SP with OUTPUT params, modifies variables in place
- **`REP_fncJob_IsValid`** — availability check per suburb/speed combo
- **`UTL_fncJob_DirectCanBeASAP`** — Direct/ASAP eligibility
- **`TucSuburb.UcsuArea`** — area grouping for suburbs
- **`TucClient.UcclSuburbId`** — client's origin suburb
- **`TucClient.UcclRate`** / `RateVan` — client's rate codes

### Four Service Groups
1. **On-Demand** ✅ — 1hr, 2hr, 4hr, Same Day, Direct (suburb-to-suburb via `UTL_fncJob_Rate`)
2. **Scheduled** ⚠️ — Overnight, Economy, Economy Run (partially implemented, ER may be flat-rate)
3. **Regional** 🔴 — City-to-city, weight-based (SP not yet identified)
4. **International** 🔴 — Country-based, may be manual quotes only

### Two Modes
- **Existing Client** — lookup by name, loads their rate code + suburb
- **Prospect** — no client record, CSV upload locations, generic zone-based pricing

---

## API Endpoints (to build)

```
GET  /api/RateSchedule/{clientId}
     ?fromSuburbId=123
     &includeGst=true
     &includeFuelSurcharge=true
     &markup=10
     &includePpd=false
     &serviceGroups=on-demand,scheduled

GET  /api/RateSchedule/{clientId}/csv

POST /api/RateSchedule/prospect   (TODO)
```

---

## QuestPDF Output
- Landscape A4
- Header: client name, prepared date, "Prepared for" contact
- Rate matrix table: suburbs × speeds
- Supplementary pages: contracted rates, zone-based pricing
- Files: `RateScheduleData.cs`, `RateScheduleDocument.cs`, `RateScheduleDataService.cs`

---

## What's Done vs What Needs Wiring

| Item | Status |
|------|--------|
| React frontend with mock data | ✅ Done |
| EF Core service for on-demand rates | ✅ Code written, needs integration |
| QuestPDF document renderer | ✅ Code written |
| API controller | ✅ Code written |
| Kevin suburb list validation | ⏳ Waiting |
| Regional/International pricing | 🔴 SPs not identified |
| Prospect mode API | 🔴 Not built |
| Wiring to live DB | 🔴 Needs connection to DespatchWeb/Accounts |

---

## Build & Run (Frontend)

```bash
cd reports/web
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/
```

Uses HashRouter (`/#/rate-schedule`) for GitHub Pages compatibility.

---

## Questions for Steve/Kevin
1. What SP drives regional/inter-city rates?
2. Is Economy Run per-suburb or flat-rate per route?
3. International — in TMS or always manual quotes?
4. Is there a "list price" rate code for prospects?
