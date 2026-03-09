# Rate Schedule — Implementation Guide

## Overview

Client-facing rate schedule generation for DFRNT courier tenants. Generates printable/PDF rate schedules showing suburb-to-suburb pricing for on-demand, scheduled, regional, and international services.

**Three output formats:**
1. **HTML preview** — rendered in-browser (React component)
2. **PDF** — QuestPDF landscape A4, DFRNT branded (3 pages)
3. **CSV export** — raw rate data for download

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│ React Frontend (preview + config)                │
│   RateSchedule.tsx (1,492 lines)                │
│   mockData.ts (development data)                 │
├─────────────────────────────────────────────────┤
│ API Layer                                        │
│   RateScheduleController.cs                      │
│   GET /api/RateSchedule/{clientId}               │
│   GET /api/RateSchedule/{clientId}/csv           │
│   POST /api/RateSchedule/prospect                │
├─────────────────────────────────────────────────┤
│ Service Layer                                    │
│   RateScheduleService.cs (557 lines)            │
│   RegionalRateService.cs (153 lines)            │
│   InternationalRateService.cs (145 lines)       │
├─────────────────────────────────────────────────┤
│ Data Layer (EF Core + SP calls)                  │
│   DespatchContext → tblSuburb, tblRateCode,     │
│   tblJobType, UTL_fncJob_Rate                   │
│   WS_stpJobType_RatesAsync (stored procedure)   │
└─────────────────────────────────────────────────┘
```

---

## Source Files

### Backend — Models (`backend/Models/`)

| File | Lines | Purpose |
|------|-------|---------|
| `ClientRateInfo.cs` | 38 | Internal model for client lookup (tblClient + tblRateCode + tblSuburb) |
| `RateScheduleItem.cs` | 21 | Single row in rate schedule — maps to `#RateSchedule` temp table from SP |
| `RateScheduleRequest.cs` | 29 | Request DTO: ClientId, FromSuburbId, IncludeGst, IncludeFuelSurcharge, Markup |
| `RateScheduleResponse.cs` | 28 | Response DTO: client info + List<RateScheduleItem> + regional + international |
| `ProspectRateRequest.cs` | 57 | Prospect rate request — locations provided directly (no client record) |
| `RegionalRateItem.cs` | 40 | City-to-city route rate (e.g., AKL→WLG) with weight tiers |
| `InternationalRateItem.cs` | 43 | International destination rate with weight tiers and regions |
| `ServiceGroup.cs` | 20 | Enum: OnDemand, Scheduled, Regional, International |
| `TblRateCode.cs` | 20 | EF Core entity for `tblRateCode` table |

### Backend — Services (`backend/Services/`)

| File | Lines | Purpose |
|------|-------|---------|
| `IRateScheduleService.cs` | 16 | Interface: `GenerateAsync` + `GenerateProspectAsync` |
| `RateScheduleService.cs` | 557 | **Core service** — calls SP, pivots results into rate matrix, applies GST/MFV/markup |
| `IRegionalRateService.cs` | 26 | Interface for regional city-to-city rates |
| `RegionalRateService.cs` | 153 | Regional rate service (placeholder — SP not yet identified) |
| `IInternationalRateService.cs` | 24 | Interface for international destination rates |
| `InternationalRateService.cs` | 145 | International rate service (placeholder — may be manual quoting) |

### Backend — Controllers (`backend/Controllers/`)

| File | Lines | Purpose |
|------|-------|---------|
| `RateScheduleController.cs` | 136 | API endpoints: GET client rates, GET CSV, POST prospect rates |

### Frontend (`frontend/src/pages/RateSchedule/`)

| File | Lines | Purpose |
|------|-------|---------|
| `RateSchedule.tsx` | 1,492 | Full React component — 3-page preview matching HTML mockup |
| `mockData.ts` | ~100 | Mock rate data for development (57 Auckland suburbs) |

### HTML Mockup (root)

| File | Purpose |
|------|---------|
| `index.html` | Static HTML mockup deployed to GitHub Pages — visual reference |
| `rate-schedule-saatchi-parnell.csv` | Sample CSV data for Saatchi & Saatchi, Parnell |

---

## Data Flow

### On-Demand Rates

1. **Client lookup**: `tblClient` → get `SuburbId` (origin), `StandardRateCodeId`
2. **Suburb list**: `tblSuburb` → get all destination suburbs for the client's `SiteId`
3. **Rate calculation**: For each destination suburb, call `WS_stpJobType_RatesAsync` stored procedure
   - Input: `FromSuburbId`, `ToSuburbId`, `ClientId`, `BookDate`
   - Output: `JobTypeID`, `Name`, `SaleRate`, `Rate`, `Availability`
4. **Pivot**: Group by destination suburb, map each JobType to speed column (Eco, 3hr, 2hr, 90min, 75min, 1hr, 45min, 30min, 15min, Direct)
5. **Apply surcharges**: GST (15%), MFV (monthly fuel variation %), client markup

### Speed Column Mapping

```csharp
// JobType SystemNames → column positions
"EC"  → Eco
"3H"  → 3 Hour
"2H"  → 2 Hour
"90M" → 90 Min
"75M" → 75 Min
"1H"  → 1 Hour
"45M" → 45 Min
"30M" → 30 Min
"15M" → 15 Min
"DIR" → Direct
```

### Key Database References

| Table/SP | Purpose |
|----------|---------|
| `tblClient` | Client record — `UcclSuburbId` = origin suburb |
| `tblSuburb` | Suburb master — `UcsuArea` = area grouping, `SiteId` = depot |
| `tblRateCode` | Rate code amounts (standard, van) |
| `tblJobType` | Job type definitions with `SystemName` for speed mapping |
| `WS_stpJobType_RatesAsync` | **Main SP** — returns rates for a suburb pair |
| `UTL_fncJob_Rate` | Rate calculation function (called by SP internally) |

---

## API Endpoints

### `GET /api/RateSchedule/{clientId}`

Query params:
- `fromSuburbId` (optional — defaults to client's home suburb)
- `includeGst` (default: true)
- `includeFuelSurcharge` (default: true)
- `markup` (default: 0)
- `preparedFor` (optional label)

Returns: `RateScheduleResponse` JSON

### `GET /api/RateSchedule/{clientId}/csv`

Same params. Returns CSV download.

### `POST /api/RateSchedule/prospect`

Body: `ProspectRateRequest` — for generating rates without a client record.

---

## React Frontend

### 3-Page Layout (matching HTML mockup)

**Page 1 — On-Demand Rate Matrix**
- DFRNT header with logo, client name, date
- Title: "On-Demand Rate Schedule"
- Disclaimer: "From: {suburb} | If your delivery suburb is not listed, please contact us"
- Rate table: destination × speed columns (Eco through Direct)
- ASAP columns (45min, 30min, 15min) tinted cyan
- Unavailable routes shown as "—"
- Footer: DIRECT/ASAP explanations, MFV/GST notes

**Page 2 — Scheduled Service Rates**
- Contracted routes table with service badges (Next Day, Same Day, Morning, Afternoon)
- Base rate + estimated with MFV

**Page 3 — Extra Charges & Information**
- 2-column card grid: Extra Items, Weight Surcharges, After Hours, Van/Multi-Trip, MFV, PPD
- "Understanding Your Rates" info box

### Design System
- Font: Inter
- Primary: #0d0c2c
- Cyan: #3bc7f4
- Table headers: #0d0c2c background, white text
- Alternating rows: #f8f8fa / #fff
- ASAP column tint: rgba(59, 199, 244, 0.06)

---

## Print / PDF Flow

### Current: HTML Print
The HTML mockup supports `@media print` with proper page breaks.

### Target: QuestPDF
The `RateScheduleDocument.cs` (not yet created) will use QuestPDF to render identical layout as a PDF. This should:
1. Accept `RateScheduleResponse` data
2. Render 3-page landscape A4
3. Match the HTML mockup's visual layout exactly
4. Use `SkiaSharp` for the DFRNT atom logo SVG

---

## File Counts

| Category | Files | Lines |
|----------|-------|-------|
| C# Models | 9 | 296 |
| C# Services | 6 | 921 |
| C# Controllers | 1 | 136 |
| React Frontend | 2 | ~1,592 |
| HTML Mockup | 1 | ~380 |
| **Total** | **19** | **~3,325** |

---

## What's Done vs What Needs Wiring

### ✅ Done
- Full rate schedule service (557 lines) with SP calling, pivot logic, surcharge application
- Regional rate service interface + placeholder
- International rate service interface + placeholder
- Prospect rate flow (no client record needed)
- API controller with 3 endpoints
- React preview component matching HTML mockup
- Mock data for development
- HTML mockup as visual reference

### 🔲 Needs Wiring
- QuestPDF document renderer (`RateScheduleDocument.cs`) — not yet created
- Wire `DespatchContext` to actual database connection
- Validate SP parameter names against live database
- Kevin's old rate schedule SP — may have additional logic to incorporate
- Regional rate data source — SP not yet identified
- International pricing — may be entirely manual
- Weight/dims surcharge panel on HTML mockup (done) needs to pull from `tblSurcharge` or config
