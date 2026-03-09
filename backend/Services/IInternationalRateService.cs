using Accounts.Web.Features.RateSchedule.Models;

namespace Accounts.Web.Features.RateSchedule;

/// <summary>
/// Service interface for international destination-based rate lookups.
/// </summary>
public interface IInternationalRateService
{
    /// <summary>
    /// Generates international rate items for a client (or prospect).
    /// </summary>
    /// <param name="clientId">Client ID (0 for prospect).</param>
    /// <param name="includeGst">Whether to apply GST.</param>
    /// <param name="includeFuelSurcharge">Whether to apply fuel surcharge.</param>
    /// <param name="markup">Markup percentage.</param>
    /// <param name="ct">Cancellation token.</param>
    Task<List<InternationalRateItem>> GenerateAsync(
        int clientId,
        bool includeGst,
        bool includeFuelSurcharge,
        double markup,
        CancellationToken ct = default);
}
