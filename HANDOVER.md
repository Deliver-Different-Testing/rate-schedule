# Rate Schedule — Developer Handover

## Prerequisites

- **.NET 8 SDK** — for the backend API
- **Node.js 20+** — for the React frontend
- **QuestPDF NuGet** — `QuestPDF` package (Community license for < $1M revenue)

## Quick Start

### Frontend (development preview with mock data)
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
# Routes: / (preview), /config (admin)
```

### Backend (requires TMS API access)
```bash
cd backend
dotnet restore
dotnet run
# API at https://localhost:5001
# GET /api/reports/rate-schedule/{clientId} → PDF
# GET /api/reports/rate-schedule/{clientId}/preview → JSON
```

## What's Done ✅

- [x] **HTML mockup** (`index.html`) — deployed on gh-pages, pixel-perfect 3-page rate schedule
- [x] **C# data models** — `RateScheduleData`, `RateRow`, `ScheduledServiceRow`, `ExtraChargesData`
- [x] **QuestPDF document** — 3-page landscape A4 renderer matching the HTML mockup
- [x] **API controller** — PDF generation + JSON preview endpoints
- [x] **Data service** — structured to call TMS API, with SP mapping logic
- [x] **React frontend** — preview app with all 3 tabs, matching HTML mockup exactly
- [x] **Mock data** — all 57 suburbs with real prices from the mockup
- [x] **TypeScript types** — matching C# models
- [x] **Documentation** — implementation guide + this handover

## What Needs Wiring 🔧

### 1. TMS API Integration
The `RateScheduleDataService` has TODO markers for actual API endpoints:
- `GET /api/Clients/{clientId}` → client name + primary suburb
- `GET /api/Suburbs/destinations?fromSuburbId=X` → destination suburbs
- `POST /api/Rates/GetRateSchedule` → calls `WS_stpJobType_Rates` SP
- `GET /api/Clients/{clientId}/scheduled-services` → contracted routes
- `GET /api/Clients/{clientId}/extra-charges` → surcharge config

### 2. JobTypeID Mapping
The `JobTypeToColumnIndex` dictionary in `RateScheduleDataService` needs to be verified against the actual TMS database. Current mapping is placeholder.

### 3. QuestPDF Font Registration
Need to register the Inter font with QuestPDF:
```csharp
QuestPDF.Settings.License = LicenseType.Community;
FontManager.RegisterFont(File.OpenRead("fonts/Inter-Regular.ttf"));
```

### 4. DFRNT Logo
The QuestPDF document uses a text placeholder for the logo. Replace with actual SVG/PNG embed.

### 5. Frontend API Integration
The React app currently uses `mockRates.ts`. To connect to the backend:
```typescript
const response = await fetch(`/api/reports/rate-schedule/${clientId}/preview`);
const data: RateScheduleData = await response.json();
```

### 6. .NET Project File
No `.csproj` created yet. When integrating into the existing solution:
```xml
<PackageReference Include="QuestPDF" Version="2024.12.0" />
```

## Integration Points

| System | Endpoint | Purpose |
|--------|----------|---------|
| TMS API | `POST /api/Rates/GetRateSchedule` | SP: `WS_stpJobType_Rates` — rates per suburb pair |
| TMS DB | `TucSuburb` table | `UcsuArea` = area grouping, determines rate tier |
| TMS DB | `TucSuburb.SiteId` | Depot/origin identifier |
| Client Config | Contract data | Scheduled service routes + rates |
| System Config | Surcharge tables | Extra items, weight, after-hours charges |

## Testing Notes

- **Frontend**: Open `http://localhost:5173` — all 57 suburbs render with correct prices
- **PDF**: Use QuestPDF's `GeneratePdfAndShow()` during dev to preview without a browser
- **Rate verification**: Compare PDF output against `rate-schedule-saatchi-parnell.csv`
- **Edge cases**: Drury has very limited speeds (no Eco, 3hr, 2hr); Papakura/Manurewa have no Direct
