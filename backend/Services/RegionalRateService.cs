using Accounts.Web.Core.Domain.Despatch;
using Accounts.Web.Features.RateSchedule.Models;
using Microsoft.EntityFrameworkCore;

namespace Accounts.Web.Features.RateSchedule;

/// <summary>
/// Regional/national rate service — city-to-city pricing with weight tiers.
/// 
/// STATUS: PLACEHOLDER — the actual SP or rate table for inter-city pricing
/// has not been identified yet. This service provides the correct interface
/// and structure; the data access layer needs to be wired to the real source.
/// </summary>
public class RegionalRateService : IRegionalRateService
{
    private readonly DespatchContext _context;

    // Standard weight tiers for regional pricing
    private static readonly (string Label, decimal MinKg, decimal MaxKg)[] WeightTiers = new[]
    {
        ("0-5kg",   0m,  5m),
        ("5-15kg",  5m,  15m),
        ("15-25kg", 15m, 25m),
        ("25kg+",   25m, 999m),
    };

    // Regional speed names
    private static readonly string[] RegionalSpeeds = new[]
    {
        "Regional Same Day",
        "Regional Overnight",
        "National Economy",
    };

    // Known NZ cities for regional routing
    // TODO: Load from database table (tblRegionalCity or similar)
    private static readonly (string Code, string Name)[] Cities = new[]
    {
        ("akl", "Auckland"),
        ("ham", "Hamilton"),
        ("tau", "Tauranga"),
        ("rot", "Rotorua"),
        ("npl", "New Plymouth"),
        ("pmn", "Palmerston North"),
        ("wlg", "Wellington"),
        ("nsn", "Nelson"),
        ("chc", "Christchurch"),
        ("dud", "Dunedin"),
        ("zqn", "Queenstown"),
    };

    public RegionalRateService(DespatchContext context)
    {
        _context = context;
    }

    public async Task<List<RegionalRateItem>> GenerateAsync(
        int clientId,
        string fromCityCode,
        bool includeGst,
        bool includeFuelSurcharge,
        double markup,
        CancellationToken ct = default)
    {
        // ──────────────────────────────────────────────
        // GST multiplier
        // ──────────────────────────────────────────────
        decimal gstMultiplier = 1m;
        if (includeGst)
        {
            var gstRate = await _context.TblSettings
                .Select(s => s.Gstrate)
                .FirstOrDefaultAsync(ct);
            if (gstRate.HasValue && gstRate.Value > 0)
                gstMultiplier = 1m + (gstRate.Value / 100m);
        }

        decimal markupMultiplier = 1m + ((decimal)markup / 100m);
        decimal fuelMultiplier = includeFuelSurcharge ? 1.08m : 1m; // TODO: Get actual fuel surcharge rate

        var items = new List<RegionalRateItem>();

        var originCities = string.IsNullOrEmpty(fromCityCode)
            ? Cities
            : Cities.Where(c => c.Code.Equals(fromCityCode, StringComparison.OrdinalIgnoreCase)).ToArray();

        foreach (var from in originCities)
        {
            foreach (var to in Cities)
            {
                if (from.Code == to.Code) continue;

                foreach (var speed in RegionalSpeeds)
                {
                    foreach (var (tierLabel, minKg, maxKg) in WeightTiers)
                    {
                        // ──────────────────────────────────────────────
                        // TODO: Replace with actual SP/table call
                        // 
                        // Candidate data sources (need DB investigation):
                        //   1. tblRegionalRate — dedicated rate table (if exists)
                        //   2. WS_stpJobType_RatesAsync with city-level params
                        //   3. tblFreightRate or tblLinehaulRate
                        //
                        // For now, return 0 rate with "Unavailable" to indicate
                        // this needs real data wiring.
                        // ──────────────────────────────────────────────
                        var (baseRate, availability) = await GetRegionalRateAsync(
                            clientId, from.Code, to.Code, speed, minKg, maxKg, ct);

                        decimal finalRate = baseRate * markupMultiplier * gstMultiplier * fuelMultiplier;
                        finalRate = Math.Round(finalRate, 2);

                        items.Add(new RegionalRateItem
                        {
                            FromCityCode = from.Code,
                            FromCityName = from.Name,
                            ToCityCode = to.Code,
                            ToCityName = to.Name,
                            SpeedName = speed,
                            WeightTier = tierLabel,
                            WeightMinKg = minKg,
                            WeightMaxKg = maxKg,
                            Rate = finalRate,
                            Availability = availability,
                        });
                    }
                }
            }
        }

        return items;
    }

    /// <summary>
    /// Looks up the base rate for a regional route/speed/weight combination.
    /// 
    /// TODO: Wire to actual data source. This is a placeholder that returns 0.
    /// 
    /// Possible implementations:
    /// 1. SELECT Rate FROM tblRegionalRate WHERE FromCity=@from AND ToCity=@to AND Speed=@speed AND WeightMin &lt;= @weight AND WeightMax &gt; @weight
    /// 2. EXEC dbo.UTL_fncRegionalRate @ClientID, @FromCity, @ToCity, @Speed, @Weight
    /// 3. Call WS_stpJobType_RatesAsync with regional parameters (if it supports them)
    /// </summary>
    private Task<(decimal Rate, string Availability)> GetRegionalRateAsync(
        int clientId, string fromCity, string toCity, string speed,
        decimal weightMin, decimal weightMax, CancellationToken ct)
    {
        // TODO: Replace with real database call
        // For now, return placeholder values
        return Task.FromResult((0m, "Unavailable"));
    }
}
