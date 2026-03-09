namespace Accounts.Web.Features.RateSchedule.Models;

/// <summary>
/// A single row in the rate schedule result set.
/// Maps to the columns of the #RateSchedule temp table in the original SP.
/// </summary>
public class RateScheduleItem
{
    public int ToSuburbId { get; set; }
    public string ToSuburbName { get; set; }
    public int JobTypeId { get; set; }
    public string SpeedName { get; set; }
    public int? Minutes { get; set; }
    public decimal Rate { get; set; }
    public string Availability { get; set; }
    public bool AreaOneCarJob { get; set; }
    public bool Pedal { get; set; }

    /// <summary>Which service group this rate belongs to.</summary>
    public ServiceGroup ServiceGroup { get; set; } = ServiceGroup.OnDemand;
}
