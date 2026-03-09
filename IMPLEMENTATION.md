# Rate Schedule — Implementation Guide

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  React Frontend │────▶│  .NET 8 Backend API  │────▶│  TMS API    │
│  (Preview/Config)│     │  (QuestPDF Renderer)  │     │  (SQL SP)   │
└─────────────────┘     └──────────────────────┘     └─────────────┘
```

- **Frontend**: React/Vite/Tailwind — previews rate schedules with mock data, admin config page
- **Backend**: ASP.NET Core 8 — fetches live data from TMS API, renders PDF via QuestPDF
- **TMS API**: Existing system — exposes stored procedure `WS_stpJobType_Rates` for rate lookups

## Source Files

### Backend (`backend/`)

| File | Description |
|------|-------------|
| `Models/RateScheduleData.cs` | Data models: `RateScheduleData`, `RateRow` (10 speed columns), `ScheduledServiceRow`, `ExtraChargesData`, `WeightSurcharge`, `AfterHoursCharges` |
| `Services/RateScheduleDataService.cs` | Fetches data from TMS API — calls SP per destination suburb, maps JobTypeID to speed columns, gets scheduled services + extras |
| `Documents/RateScheduleDocument.cs` | QuestPDF `IDocument` — 3-page landscape A4: rate matrix, scheduled services, extra charges. Matches HTML mockup exactly (Inter font, DFRNT colors) |
| `Controllers/RateScheduleController.cs` | API endpoints: `GET /api/reports/rate-schedule/{clientId}` (PDF), `GET .../preview` (JSON) |

### Frontend (`frontend/`)

| File | Description |
|------|-------------|
| `src/App.tsx` | HashRouter — `/` preview, `/config` admin |
| `src/types/index.ts` | TypeScript interfaces matching C# models |
| `src/data/mockRates.ts` | All 57 suburbs with actual prices from the HTML mockup |
| `src/pages/RateSchedulePreview.tsx` | Tab-based preview matching the HTML mockup |
| `src/pages/RateScheduleConfig.tsx` | Admin config for client, suburb, speeds, surcharges |
| `src/components/RateTable.tsx` | On-demand rate matrix with ASAP column highlighting |
| `src/components/ScheduledServicesTable.tsx` | Scheduled services with color-coded badges |
| `src/components/ExtraChargesGrid.tsx` | 2-column surcharge cards + understanding box |
| `src/components/RateScheduleHeader.tsx` | DFRNT branded header with logo SVG |

### Root

| File | Description |
|------|-------------|
| `index.html` | Original HTML mockup (deployed on gh-pages, do not modify) |
| `rate-schedule-saatchi-parnell.csv` | CSV export of the rate data |

## Data Flow

```
1. Client requests PDF → GET /api/reports/rate-schedule/{clientId}?fromSuburbId=X
2. RateScheduleDataService fetches client info from TMS API
3. Gets list of destination suburbs (linked via TucSuburb.UcsuArea)
4. For EACH destination suburb, calls:
   POST /api/Rates/GetRateSchedule → WS_stpJobType_Rates SP
   Returns: [{ JobTypeID, Name, SaleRate, Rate, Availability }, ...]
5. Maps SP results to RateRow speed columns via JobTypeID lookup
6. Gets scheduled services from client contract data
7. Gets extra charges from system config (with defaults fallback)
8. RateScheduleDocument renders 3-page landscape A4 PDF via QuestPDF
9. Returns PDF as file download
```

## API Endpoints

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| GET | `/api/reports/rate-schedule/{clientId}` | `application/pdf` | Generate and download PDF |
| GET | `/api/reports/rate-schedule/{clientId}/preview` | `application/json` | Get rate data as JSON for frontend preview |

Query params: `?fromSuburbId=N` (optional, defaults to client's primary site)

## Rate Calculation Logic

Rates are **suburb-based**, not static rate codes. The system:

1. Looks up the origin suburb (client's site/depot)
2. Gets all destination suburbs from the `TucSuburb` table
3. `TucSuburb.UcsuArea` = area grouping (determines rate tier)
4. `SiteId` = depot/origin identifier
5. For each origin→destination pair, the SP returns available speeds with rates
6. `SaleRate` takes priority over `Rate` (client-specific vs default)
7. `Availability = false` means the speed isn't offered for that route (shown as "—")

### Speed Column Mapping

The SP returns `JobTypeID` values that map to speed columns:

| JobTypeID | Column | Label |
|-----------|--------|-------|
| 1 | 0 | Eco |
| 2 | 1 | 3 Hour |
| 3 | 2 | 2 Hour |
| 4 | 3 | 90 Min |
| 5 | 4 | 75 Min |
| 6 | 5 | 1 Hour |
| 7 | 6 | 45 Min |
| 8 | 7 | 30 Min |
| 9 | 8 | 15 Min |
| 10 | 9 | Direct |

> **Note:** These mappings need to be verified against the actual TMS database. The JobTypeID values may differ.

## DFRNT Design System

| Token | Value |
|-------|-------|
| Primary | `#0d0c2c` |
| Cyan | `#3bc7f4` |
| Light Grey | `#f4f2f1` |
| Table Header | `#0d0c2c` |
| ASAP Header | `#163550` |
| Border | `#e4e4e8` |
| Even Row | `#f8f8fa` |
| Font | Inter (300–700) |
| Grid | 8pt base |

## Mock Data

The `mockRates.ts` file contains all 57 destination suburbs with actual prices extracted from the HTML mockup (Saatchi & Saatchi, from Parnell). Rate tiers observed:

- **Local** (Eco available): $8.45–$18.74 — Parnell, City, Eden Terrace, Freemans Bay, Grey Lynn, etc.
- **Near** (no Eco, 30min available): $10.94–$88.70 — Epsom, Greenlane, Remuera, Morningside
- **Mid** (no Eco, no 30min): $14.08–$99.81 — Avondale, Airport, Henderson, etc.
- **Far** (no Eco, no 30min): $21.12–$133.08 — Browns Bay, Howick, Manukau, etc.
- **Very far** (limited speeds): $35.20–$155.19 — Manurewa, Papakura, Drury
