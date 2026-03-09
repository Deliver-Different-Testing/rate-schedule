# Rate Schedule — Developer Handover

## Quick Start

### Prerequisites
- .NET 8 SDK
- Node.js 20+
- SQL Server access (for live SP calls)
- QuestPDF NuGet package (for PDF rendering)

### Backend
```bash
# The backend files go into the Accounts app (or a standalone API)
# Namespace: Accounts.Web.Features.RateSchedule
# Add to DI container:
services.AddScoped<IRateScheduleService, RateScheduleService>();
services.AddScoped<IRegionalRateService, RegionalRateService>();
services.AddScoped<IInternationalRateService, InternationalRateService>();
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The React component (`RateSchedule.tsx`) can be used standalone or embedded in the Accounts app.

---

## Architecture

```
backend/
  Models/           # 9 files — DTOs and entities
  Services/         # 6 files — business logic + SP calls
  Controllers/      # 1 file — API endpoints
frontend/
  src/pages/RateSchedule/
    RateSchedule.tsx   # 1,492-line React component (preview)
    mockData.ts        # Mock data for development
index.html             # Static HTML mockup (deployed to gh-pages)
```

---

## Key Service: `RateScheduleService.cs` (557 lines)

This is the core service. It:

1. **Looks up client info** — `tblClient` JOIN `tblRateCode` JOIN `tblSuburb`
2. **Gets destination suburbs** — all suburbs for the client's `SiteId`
3. **Calls the SP** — `WS_stpJobType_RatesAsync` for each destination suburb
4. **Pivots results** — maps JobType → speed column (Eco, 3hr, 2hr, etc.)
5. **Applies surcharges** — GST, MFV, client markup
6. **Returns structured response** — `RateScheduleResponse` with items grouped by suburb

### Stored Procedure
```sql
EXEC WS_stpJobType_RatesAsync 
  @FromSuburbId, @ToSuburbId, @ClientId, @BookDate
-- Returns: JobTypeID, Name, SaleRate, Rate, Availability
```

### Speed Mapping
The SP returns job types by `SystemName`. Map to columns:
- `EC` → Eco, `3H` → 3 Hour, `2H` → 2 Hour, `90M` → 90 Min
- `75M` → 75 Min, `1H` → 1 Hour, `45M` → 45 Min
- `30M` → 30 Min, `15M` → 15 Min, `DIR` → Direct

### Important: `Availability`
The SP returns an availability flag. Rates where `Availability` indicates the service is unavailable should show as "—" in the table (not $0.00).

---

## Integration Points

### Database Tables
| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `tblClient` | `ClientID`, `UcclSuburbId`, `UcclRate` | Client origin suburb + rate code |
| `tblSuburb` | `SuburbID`, `SuburbName`, `UcsuArea`, `SiteId` | Suburb master, area grouping |
| `tblRateCode` | `RateCodeID`, `Amount` | Rate code amounts |
| `tblJobType` | `JobTypeID`, `SystemName`, `Name` | Job types → speed columns |

### EF Core Context
The service expects a `DespatchContext` with these entities. If not already scaffolded, add:
```csharp
public DbSet<TblRateCode> RateCodes { get; set; }
```

---

## What Needs Doing

### Priority 1: Wire to Live Database
- Inject `DespatchContext` with real connection string
- Validate SP parameter names match live DB
- Test with real client IDs

### Priority 2: QuestPDF Renderer
- Create `RateScheduleDocument.cs` implementing `IDocument`
- 3-page landscape A4 matching the HTML mockup layout
- Page 1: On-Demand Rate Matrix
- Page 2: Scheduled Services
- Page 3: Extra Charges

### Priority 3: Regional Rates
- `RegionalRateService.cs` is a placeholder
- Need to identify the actual SP or table for city-to-city pricing
- Talk to Kevin about the regional rate structure

### Priority 4: Kevin's Old SP
- Kevin may have an older rate schedule SP with additional logic
- Compare with `WS_stpJobType_RatesAsync` to check for gaps
- Suburb list validation — are all 57 suburbs correct?

---

## Testing

### Mock Data
Use `mockData.ts` for frontend development. It contains real prices for 57 Auckland suburbs (from Parnell origin).

### API Testing
```bash
# Client rate schedule
GET /api/RateSchedule/123?includeGst=true&includeFuelSurcharge=true

# CSV export
GET /api/RateSchedule/123/csv

# Prospect (no client record)
POST /api/RateSchedule/prospect
{
  "companyName": "Test Co",
  "locationMode": "suburbs",
  "locations": [{ "suburbId": 100, "name": "Parnell" }],
  "baseRateCodeId": 1
}
```

---

## File Summary

| Category | Files | Lines |
|----------|-------|-------|
| C# Backend | 16 | 1,353 |
| React Frontend | 2 | ~1,592 |
| HTML Mockup | 1 | ~380 |
| Documentation | 2 | ~350 |
| **Total** | **21** | **~3,675** |
