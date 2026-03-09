using Accounts.Web.Features.RateSchedule.Models;

namespace Accounts.Web.Features.RateSchedule;

public interface IRateScheduleService
{
    /// <summary>
    /// Generates a client rate schedule, replicating the logic of REP_qryClientRateSchedule.
    /// </summary>
    Task<RateScheduleResponse> GenerateAsync(RateScheduleRequest request, CancellationToken ct = default);

    /// <summary>
    /// Generates a prospect rate schedule using uploaded locations and a base rate code.
    /// </summary>
    Task<RateScheduleResponse> GenerateProspectAsync(ProspectRateRequest request, CancellationToken ct = default);
}
