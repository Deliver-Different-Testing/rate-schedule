using Accounts.Web.Features.RateSchedule.Models;

namespace Accounts.Web.Features.RateSchedule;

/// <summary>
/// Service interface for regional/national city-to-city rate lookups.
/// </summary>
public interface IRegionalRateService
{
    /// <summary>
    /// Generates regional rate items for a client (or prospect).
    /// </summary>
    /// <param name="clientId">Client ID (0 for prospect).</param>
    /// <param name="fromCityCode">Origin city code (e.g. "akl"). Null = all origins.</param>
    /// <param name="includeGst">Whether to apply GST.</param>
    /// <param name="includeFuelSurcharge">Whether to apply fuel surcharge.</param>
    /// <param name="markup">Markup percentage.</param>
    /// <param name="ct">Cancellation token.</param>
    Task<List<RegionalRateItem>> GenerateAsync(
        int clientId,
        string fromCityCode,
        bool includeGst,
        bool includeFuelSurcharge,
        double markup,
        CancellationToken ct = default);
}
