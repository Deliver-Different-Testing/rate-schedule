using Accounts.Web.Core.Domain.Despatch;
using Accounts.Web.Features.RateSchedule.Models;
using Microsoft.EntityFrameworkCore;

namespace Accounts.Web.Features.RateSchedule;

/// <summary>
/// International rate service — destination-based pricing with weight tiers.
/// 
/// STATUS: PLACEHOLDER — international pricing may not exist in the TMS at all.
/// Current process may be 100% manual quoting. This service provides the interface
/// so the UI can display rates when/if they become available.
/// </summary>
public class InternationalRateService : IInternationalRateService
{
    private readonly DespatchContext _context;

    // Weight tiers for international pricing
    private static readonly (string Label, decimal MinKg, decimal MaxKg)[] WeightTiers = new[]
    {
        ("0-5kg",   0m,  5m),
        ("5-15kg",  5m,  15m),
        ("15-25kg", 15m, 25m),
        ("25kg+",   25m, 999m),
    };

    private static readonly string[] InternationalSpeeds = new[]
    {
        "International Express",
        "International Standard",
        "International Economy",
    };

    // Known international destinations
    // TODO: Load from database table or configuration
    private static readonly (string Code, string City, string Country, string Region)[] Destinations = new[]
    {
        ("syd", "Sydney",        "Australia",  "australia"),
        ("mel", "Melbourne",     "Australia",  "australia"),
        ("bne", "Brisbane",      "Australia",  "australia"),
        ("per", "Perth",         "Australia",  "australia"),
        ("sin", "Singapore",     "Singapore",  "asia-pacific"),
        ("hkg", "Hong Kong",     "Hong Kong",  "asia-pacific"),
        ("tyo", "Tokyo",         "Japan",      "asia-pacific"),
        ("bkk", "Bangkok",       "Thailand",   "asia-pacific"),
        ("lax", "Los Angeles",   "USA",        "americas"),
        ("sfo", "San Francisco", "USA",        "americas"),
        ("lhr", "London",        "UK",         "europe"),
        ("fra", "Frankfurt",     "Germany",    "europe"),
    };

    public InternationalRateService(DespatchContext context)
    {
        _context = context;
    }

    public async Task<List<InternationalRateItem>> GenerateAsync(
        int clientId,
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

        var items = new List<InternationalRateItem>();

        foreach (var dest in Destinations)
        {
            foreach (var speed in InternationalSpeeds)
            {
                foreach (var (tierLabel, minKg, maxKg) in WeightTiers)
                {
                    // ──────────────────────────────────────────────
                    // TODO: Replace with actual rate source
                    //
                    // Possible data sources:
                    //   1. tblInternationalRate table (if exists in TMS)
                    //   2. Freight forwarder API integration (DHL, FedEx, etc.)
                    //   3. Manual rate card loaded from config/admin UI
                    //   4. Always "QuoteRequired" — no automated pricing
                    //
                    // For now, all international rates return RequiresQuote = true
                    // to indicate manual quoting is needed.
                    // ──────────────────────────────────────────────
                    var (baseRate, availability, requiresQuote) = await GetInternationalRateAsync(
                        clientId, dest.Code, speed, minKg, maxKg, ct);

                    decimal finalRate = baseRate * markupMultiplier * gstMultiplier * fuelMultiplier;
                    finalRate = Math.Round(finalRate, 2);

                    items.Add(new InternationalRateItem
                    {
                        DestinationCode = dest.Code,
                        City = dest.City,
                        Country = dest.Country,
                        Region = dest.Region,
                        SpeedName = speed,
                        WeightTier = tierLabel,
                        WeightMinKg = minKg,
                        WeightMaxKg = maxKg,
                        Rate = finalRate,
                        Availability = availability,
                        RequiresQuote = requiresQuote,
                    });
                }
            }
        }

        return items;
    }

    /// <summary>
    /// Looks up the base rate for an international destination/speed/weight combination.
    /// 
    /// TODO: Wire to actual data source. Currently returns RequiresQuote for all.
    /// 
    /// Possible implementations:
    /// 1. SELECT Rate FROM tblInternationalRate WHERE Destination=@dest AND Speed=@speed AND WeightTier=@tier
    /// 2. Call external freight API
    /// 3. Return from admin-configured rate card
    /// </summary>
    private Task<(decimal Rate, string Availability, bool RequiresQuote)> GetInternationalRateAsync(
        int clientId, string destinationCode, string speed,
        decimal weightMin, decimal weightMax, CancellationToken ct)
    {
        // TODO: Replace with real data source
        // For now, all international rates require manual quoting
        return Task.FromResult((0m, "QuoteRequired", true));
    }
}
