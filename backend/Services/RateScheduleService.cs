using Accounts.Web.Core.Domain.Despatch;
using Accounts.Web.Features.RateSchedule.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Accounts.Web.Features.RateSchedule;

public class RateScheduleService : IRateScheduleService
{
    private readonly DespatchContext _context;
    private readonly IRegionalRateService _regionalService;
    private readonly IInternationalRateService _internationalService;

    // Job type SystemNames to always exclude
    private static readonly HashSet<string> ExcludedSystemNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "UT",   // Urgent Tonight
        "B",    // Baggage
        "HDR",  // Hamilton Day Run
        "HNDR", // Hamilton Next Day Run
        "MR"    // Medical Run
    };

    // CBD suburb ID — bike/size 1 special case
    private const int CbdSuburbId = 112;

    // On-demand system names
    private static readonly HashSet<string> OnDemandSystemNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "1H", "2H", "4H", "SD", "D"  // 1hr, 2hr, 4hr, Same Day, Direct
    };

    // Scheduled system names
    private static readonly HashSet<string> ScheduledSystemNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "ON", "EC", "ER"  // Overnight, Economy, Economy Run
    };

    // Default rate code ID for prospect pricing
    // TODO: Make configurable — load from tblSettings or appsettings.json
    private const int DefaultProspectRateCodeId = 1;

    public RateScheduleService(
        DespatchContext context,
        IRegionalRateService regionalService,
        IInternationalRateService internationalService)
    {
        _context = context;
        _regionalService = regionalService;
        _internationalService = internationalService;
    }

    public async Task<RateScheduleResponse> GenerateAsync(RateScheduleRequest request, CancellationToken ct = default)
    {
        // ──────────────────────────────────────────────
        // 1. Look up client info (EF)
        // ──────────────────────────────────────────────
        var clientInfo = await GetClientInfoAsync(request.ClientId, ct);
        if (clientInfo == null)
            throw new InvalidOperationException($"Client {request.ClientId} not found.");

        // Default FromSuburbID to client's home suburb
        int fromSuburbId = request.FromSuburbId > 0 ? request.FromSuburbId.Value : clientInfo.SuburbId;

        // Get from-suburb name
        var fromSuburbName = await _context.TucSuburbs
            .Where(s => s.UcsuId == fromSuburbId)
            .Select(s => s.UcsuName)
            .FirstOrDefaultAsync(ct) ?? "Unknown";

        // ──────────────────────────────────────────────
        // 2. GST rate (if needed)
        // ──────────────────────────────────────────────
        decimal gstMultiplier = 1m;
        if (request.IncludeGst)
        {
            var gstRate = await _context.TblSettings
                .Select(s => s.Gstrate)
                .FirstOrDefaultAsync(ct);
            if (gstRate.HasValue && gstRate.Value > 0)
                gstMultiplier = 1m + (gstRate.Value / 100m);
        }

        // ──────────────────────────────────────────────
        // 3. Markup multiplier
        // ──────────────────────────────────────────────
        decimal markupMultiplier = 1m + ((decimal)request.Markup / 100m);

        // ──────────────────────────────────────────────
        // 4. PPD multiplier
        // ──────────────────────────────────────────────
        decimal ppdMultiplier = 1m;
        if (request.IncludePpd && clientInfo.PpdRate.HasValue && clientInfo.PpdRate.Value > 0)
        {
            ppdMultiplier = 1m + (clientInfo.PpdRate.Value / 100m);
        }

        // ──────────────────────────────────────────────
        // 5. Get all destination suburbs for the client's site
        // ──────────────────────────────────────────────
        var suburbs = await _context.TucSuburbs
            .Where(s => s.SiteId == clientInfo.SiteId && s.Priority == 1)
            .OrderBy(s => s.UcsuName)
            .Select(s => new { s.UcsuId, s.UcsuName, s.UcsuArea })
            .ToListAsync(ct);

        // ──────────────────────────────────────────────
        // 6. Get eligible job types (EF with exclusion filters)
        // ──────────────────────────────────────────────
        var jobTypes = await _context.TucJobTypes
            .Where(jt => jt.WebJobEntry
                && !ExcludedSystemNames.Contains(jt.SystemName))
            .OrderBy(jt => jt.Minutes)
            .Select(jt => new { jt.UcjtId, jt.ShortName, jt.Minutes, jt.SystemName })
            .ToListAsync(ct);

        // Conditionally exclude Economy (EC) and Economy Run (ER)
        if (!clientInfo.EconomyActive)
        {
            jobTypes = jobTypes.Where(jt =>
                !string.Equals(jt.SystemName, "EC", StringComparison.OrdinalIgnoreCase)).ToList();
        }
        if (!clientInfo.EconomyRuns)
        {
            jobTypes = jobTypes.Where(jt =>
                !string.Equals(jt.SystemName, "ER", StringComparison.OrdinalIgnoreCase)).ToList();
        }

        // ──────────────────────────────────────────────
        // 7. Iterate suburbs × job types (replaces cursor)
        // ──────────────────────────────────────────────
        var items = new List<RateScheduleItem>();
        var today = DateTime.Today;

        foreach (var suburb in suburbs)
        {
            // Determine base vehicle size: CBD (suburb 112) = bike/size 1, else car/size 2
            int baseSize = suburb.UcsuId == CbdSuburbId ? 1 : 2;
            bool areaOneCarJob = suburb.UcsuArea == 1 && baseSize == 2;

            foreach (var jobType in jobTypes)
            {
                // Call UTL_stpJob_VariableModification to adjust variables
                var (modFromId, modToId, modSize, modSpeed, modPedal) =
                    await CallVariableModificationAsync(fromSuburbId, suburb.UcsuId, baseSize, jobType.UcjtId, false, ct);

                // Call UTL_fncJob_Rate for pricing
                decimal rawRate = await CallJobRateAsync(
                    request.ClientId, modFromId, modToId, jobType.UcjtId,
                    modSize, modPedal, false /*return*/, 0 /*weight*/, today,
                    request.IncludeFuelSurcharge, ct);

                // Call REP_fncJob_IsValid for availability
                string availability = await CallIsValidAsync(
                    jobType.UcjtId, modFromId, modToId, request.ClientId, modSize, ct);

                // Apply markup × GST × PPD
                decimal finalRate = rawRate * markupMultiplier * gstMultiplier * ppdMultiplier;
                finalRate = Math.Round(finalRate, 2);

                // Determine service group from system name
                var serviceGroup = ClassifyServiceGroup(jobType.SystemName);

                items.Add(new RateScheduleItem
                {
                    ToSuburbId = suburb.UcsuId,
                    ToSuburbName = suburb.UcsuName,
                    JobTypeId = jobType.UcjtId,
                    SpeedName = jobType.ShortName,
                    Minutes = jobType.Minutes,
                    Rate = finalRate,
                    Availability = availability,
                    AreaOneCarJob = areaOneCarJob,
                    Pedal = modPedal,
                    ServiceGroup = serviceGroup
                });

                // ──────────────────────────────────────
                // "Direct" row logic: if speed is unavailable but ASAP-eligible,
                // add a Direct row so the client knows ASAP is an option.
                // ──────────────────────────────────────
                if (string.Equals(availability, "Unavailable", StringComparison.OrdinalIgnoreCase))
                {
                    bool canBeAsap = await CallDirectCanBeAsapAsync(
                        jobType.UcjtId, modFromId, modToId, request.ClientId, modSize, ct);

                    if (canBeAsap)
                    {
                        items.Add(new RateScheduleItem
                        {
                            ToSuburbId = suburb.UcsuId,
                            ToSuburbName = suburb.UcsuName,
                            JobTypeId = jobType.UcjtId,
                            SpeedName = "Direct",
                            Minutes = jobType.Minutes,
                            Rate = finalRate,
                            Availability = "Available",
                            AreaOneCarJob = areaOneCarJob,
                            Pedal = modPedal,
                            ServiceGroup = ServiceGroup.OnDemand
                        });
                    }
                }
            }
        }

        // ──────────────────────────────────────────────
        // 8. Regional & International rates
        // ──────────────────────────────────────────────
        var regionalItems = await _regionalService.GenerateAsync(
            request.ClientId, null, request.IncludeGst, request.IncludeFuelSurcharge, request.Markup, ct);

        var internationalItems = await _internationalService.GenerateAsync(
            request.ClientId, request.IncludeGst, request.IncludeFuelSurcharge, request.Markup, ct);

        // ──────────────────────────────────────────────
        // 9. Build response
        // ──────────────────────────────────────────────
        return new RateScheduleResponse
        {
            ClientName = clientInfo.ClientName,
            FromSuburbName = fromSuburbName,
            PreparedFor = request.PreparedFor ?? clientInfo.ClientName,
            StandardRate = clientInfo.StandardRateAmount * markupMultiplier * gstMultiplier,
            VanRate = clientInfo.VanRateAmount * markupMultiplier * gstMultiplier,
            StartingExcessWeight = clientInfo.StartingWeightExcess,
            Items = items,
            RegionalItems = regionalItems,
            InternationalItems = internationalItems,
            IsProspect = false
        };
    }

    public async Task<RateScheduleResponse> GenerateProspectAsync(ProspectRateRequest request, CancellationToken ct = default)
    {
        // ──────────────────────────────────────────────
        // 1. Resolve base rate code for prospect pricing
        // ──────────────────────────────────────────────
        int rateCodeId = request.BaseRateCodeId ?? DefaultProspectRateCodeId;

        // TODO: Look up the rate code amount from tblRateCode
        // For now, use a placeholder query
        decimal baseRateAmount = 0m;
        using (var connection = _context.Database.GetDbConnection())
        {
            await connection.OpenAsync(ct);
            using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT ISNULL(Amount, 0) FROM tblRateCode WHERE RateCodeID = @RateCodeID";
            cmd.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@RateCodeID", rateCodeId));
            var result = await cmd.ExecuteScalarAsync(ct);
            baseRateAmount = result != null && result != DBNull.Value ? Convert.ToDecimal(result) : 0m;
        }

        // ──────────────────────────────────────────────
        // 2. GST / Markup multipliers
        // ──────────────────────────────────────────────
        decimal gstMultiplier = 1m;
        if (request.IncludeGst)
        {
            var gstRate = await _context.TblSettings
                .Select(s => s.Gstrate)
                .FirstOrDefaultAsync(ct);
            if (gstRate.HasValue && gstRate.Value > 0)
                gstMultiplier = 1m + (gstRate.Value / 100m);
        }
        decimal markupMultiplier = 1m + ((decimal)request.Markup / 100m);

        // ──────────────────────────────────────────────
        // 3. Resolve prospect locations to suburb IDs
        // ──────────────────────────────────────────────
        // TODO: Match uploaded location names to tblSuburb records
        // For now, try exact name match against TucSuburbs
        var locationNames = request.Locations.Select(l => l.Name).ToList();
        var matchedSuburbs = await _context.TucSuburbs
            .Where(s => locationNames.Contains(s.UcsuName))
            .Select(s => new { s.UcsuId, s.UcsuName, s.UcsuArea })
            .ToListAsync(ct);

        // Use the first location as the "from" suburb, rest as destinations
        int fromSuburbId = matchedSuburbs.FirstOrDefault()?.UcsuId ?? 0;
        string fromSuburbName = matchedSuburbs.FirstOrDefault()?.UcsuName ?? request.Locations.FirstOrDefault()?.Name ?? "Unknown";

        // ──────────────────────────────────────────────
        // 4. Get eligible job types (same as client mode)
        // ──────────────────────────────────────────────
        var jobTypes = await _context.TucJobTypes
            .Where(jt => jt.WebJobEntry && !ExcludedSystemNames.Contains(jt.SystemName))
            .OrderBy(jt => jt.Minutes)
            .Select(jt => new { jt.UcjtId, jt.ShortName, jt.Minutes, jt.SystemName })
            .ToListAsync(ct);

        // ──────────────────────────────────────────────
        // 5. Generate rates using prospect client ID (0)
        // ──────────────────────────────────────────────
        var items = new List<RateScheduleItem>();
        var today = DateTime.Today;
        int prospectClientId = 0; // Synthetic client ID for prospects

        foreach (var suburb in matchedSuburbs.Skip(1)) // Skip first (it's the origin)
        {
            int baseSize = suburb.UcsuId == CbdSuburbId ? 1 : 2;
            bool areaOneCarJob = suburb.UcsuArea == 1 && baseSize == 2;

            foreach (var jobType in jobTypes)
            {
                // TODO: For prospects, UTL_fncJob_Rate may not work with clientId=0.
                // Need to verify if the SP supports a "default" client or if we need
                // a different pricing mechanism for prospects.
                var (modFromId, modToId, modSize, modSpeed, modPedal) =
                    await CallVariableModificationAsync(fromSuburbId, suburb.UcsuId, baseSize, jobType.UcjtId, false, ct);

                decimal rawRate = await CallJobRateAsync(
                    prospectClientId, modFromId, modToId, jobType.UcjtId,
                    modSize, modPedal, false, 0, today,
                    request.IncludeFuelSurcharge, ct);

                string availability = await CallIsValidAsync(
                    jobType.UcjtId, modFromId, modToId, prospectClientId, modSize, ct);

                decimal finalRate = rawRate * markupMultiplier * gstMultiplier;
                finalRate = Math.Round(finalRate, 2);

                var serviceGroup = ClassifyServiceGroup(jobType.SystemName);

                items.Add(new RateScheduleItem
                {
                    ToSuburbId = suburb.UcsuId,
                    ToSuburbName = suburb.UcsuName,
                    JobTypeId = jobType.UcjtId,
                    SpeedName = jobType.ShortName,
                    Minutes = jobType.Minutes,
                    Rate = finalRate,
                    Availability = availability,
                    AreaOneCarJob = areaOneCarJob,
                    Pedal = modPedal,
                    ServiceGroup = serviceGroup
                });
            }
        }

        // ──────────────────────────────────────────────
        // 6. Regional & International (prospect)
        // ──────────────────────────────────────────────
        var regionalItems = await _regionalService.GenerateAsync(
            prospectClientId, null, request.IncludeGst, request.IncludeFuelSurcharge, request.Markup, ct);

        var internationalItems = await _internationalService.GenerateAsync(
            prospectClientId, request.IncludeGst, request.IncludeFuelSurcharge, request.Markup, ct);

        return new RateScheduleResponse
        {
            ClientName = request.CompanyName ?? "Prospect",
            FromSuburbName = fromSuburbName,
            PreparedFor = request.ContactName ?? request.CompanyName ?? "Prospect",
            StandardRate = baseRateAmount * markupMultiplier * gstMultiplier,
            VanRate = 0m, // No van rate for prospects without client record
            StartingExcessWeight = 0,
            Items = items,
            RegionalItems = regionalItems,
            InternationalItems = internationalItems,
            IsProspect = true,
            ProspectCompanyName = request.CompanyName
        };
    }

    /// <summary>
    /// Classifies a job type system name into a service group.
    /// </summary>
    private static ServiceGroup ClassifyServiceGroup(string systemName)
    {
        if (OnDemandSystemNames.Contains(systemName)) return ServiceGroup.OnDemand;
        if (ScheduledSystemNames.Contains(systemName)) return ServiceGroup.Scheduled;
        return ServiceGroup.OnDemand; // Default fallback
    }

    // ══════════════════════════════════════════════════════════
    //  Private helpers — EF queries and raw SQL calls
    // ══════════════════════════════════════════════════════════

    /// <summary>
    /// Queries client info from tblClient + tblRateCode joins.
    /// Uses raw SQL because TblRateCode may not be in the DbContext yet.
    /// </summary>
    private async Task<ClientRateInfo> GetClientInfoAsync(int clientId, CancellationToken ct)
    {
        // Using raw SQL to join tblRateCode which may not be in the DbContext
        var sql = @"
            SELECT
                c.UcclID           AS ClientId,
                c.SiteID           AS SiteId,
                c.UcclName         AS ClientName,
                ISNULL(c.UcclSuburbID, 0) AS SuburbId,
                ISNULL(s.UcsuName, '')    AS SuburbName,
                c.UcclRate         AS StandardRateCodeId,
                ISNULL(rc1.Amount, 0)     AS StandardRateAmount,
                c.RateVan          AS VanRateCodeId,
                ISNULL(rc2.Amount, 0)     AS VanRateAmount,
                c.StartingWeightExcess,
                c.PPDRate          AS PpdRate,
                c.EconomyActive,
                c.EconomyRuns
            FROM tblClient c
            LEFT JOIN tblSuburb s    ON s.UcsuID = c.UcclSuburbID
            LEFT JOIN tblRateCode rc1 ON rc1.RateCodeID = c.UcclRate
            LEFT JOIN tblRateCode rc2 ON rc2.RateCodeID = c.RateVan
            WHERE c.UcclID = @clientId";

        var param = new SqlParameter("@clientId", clientId);

        // Use FromSqlRaw with a keyless entity or fall back to ADO.NET
        using var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(ct);

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.Add(param);

        using var reader = await command.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct))
            return null;

        return new ClientRateInfo
        {
            ClientId = reader.GetInt32(reader.GetOrdinal("ClientId")),
            SiteId = reader.GetInt32(reader.GetOrdinal("SiteId")),
            ClientName = reader.GetString(reader.GetOrdinal("ClientName")),
            SuburbId = reader.GetInt32(reader.GetOrdinal("SuburbId")),
            SuburbName = reader.GetString(reader.GetOrdinal("SuburbName")),
            StandardRateCodeId = reader.IsDBNull(reader.GetOrdinal("StandardRateCodeId")) ? null : reader.GetInt32(reader.GetOrdinal("StandardRateCodeId")),
            StandardRateAmount = reader.GetDecimal(reader.GetOrdinal("StandardRateAmount")),
            VanRateCodeId = reader.IsDBNull(reader.GetOrdinal("VanRateCodeId")) ? null : reader.GetInt32(reader.GetOrdinal("VanRateCodeId")),
            VanRateAmount = reader.GetDecimal(reader.GetOrdinal("VanRateAmount")),
            StartingWeightExcess = reader.GetInt32(reader.GetOrdinal("StartingWeightExcess")),
            PpdRate = reader.IsDBNull(reader.GetOrdinal("PpdRate")) ? null : reader.GetDecimal(reader.GetOrdinal("PpdRate")),
            EconomyActive = reader.GetBoolean(reader.GetOrdinal("EconomyActive")),
            EconomyRuns = reader.GetBoolean(reader.GetOrdinal("EconomyRuns"))
        };
    }

    /// <summary>
    /// Calls UTL_stpJob_VariableModification via ExecuteSqlRawAsync.
    /// This SP modifies FromSuburbID, ToSuburbID, Size, Speed, Pedal in place.
    /// </summary>
    private async Task<(int fromId, int toId, int size, int speed, bool pedal)> CallVariableModificationAsync(
        int fromSuburbId, int toSuburbId, int size, int speed, bool pedal, CancellationToken ct)
    {
        var pFrom = new SqlParameter("@FromSuburbID", fromSuburbId) { Direction = ParameterDirection.InputOutput };
        var pTo = new SqlParameter("@ToSuburbID", toSuburbId) { Direction = ParameterDirection.InputOutput };
        var pSize = new SqlParameter("@Size", size) { Direction = ParameterDirection.InputOutput };
        var pSpeed = new SqlParameter("@Speed", speed) { Direction = ParameterDirection.InputOutput };
        var pPedal = new SqlParameter("@Pedal", pedal) { SqlDbType = SqlDbType.Bit, Direction = ParameterDirection.InputOutput };

        await _context.Database.ExecuteSqlRawAsync(
            "EXEC UTL_stpJob_VariableModification @FromSuburbID OUTPUT, @ToSuburbID OUTPUT, @Size OUTPUT, @Speed OUTPUT, @Pedal OUTPUT",
            new[] { pFrom, pTo, pSize, pSpeed, pPedal },
            ct);

        return (
            (int)pFrom.Value,
            (int)pTo.Value,
            (int)pSize.Value,
            (int)pSpeed.Value,
            (bool)pPedal.Value
        );
    }

    /// <summary>
    /// Calls UTL_fncJob_Rate — scalar function returning money.
    /// </summary>
    private async Task<decimal> CallJobRateAsync(
        int clientId, int fromSuburbId, int toSuburbId, int jobTypeId,
        int size, bool pedal, bool isReturn, int weight, DateTime date,
        bool includeFuelSurcharge, CancellationToken ct)
    {
        var sql = @"
            SELECT dbo.UTL_fncJob_Rate(
                @ClientID, @FromSuburbID, @ToSuburbID, @JobTypeID,
                @Size, @Pedal, @Return, @Weight, @Date,
                NULL, @IncludeFuelSurcharge, NULL, NULL, NULL, NULL
            ) AS Rate";

        using var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(ct);

        using var cmd = connection.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new SqlParameter("@ClientID", clientId));
        cmd.Parameters.Add(new SqlParameter("@FromSuburbID", fromSuburbId));
        cmd.Parameters.Add(new SqlParameter("@ToSuburbID", toSuburbId));
        cmd.Parameters.Add(new SqlParameter("@JobTypeID", jobTypeId));
        cmd.Parameters.Add(new SqlParameter("@Size", size));
        cmd.Parameters.Add(new SqlParameter("@Pedal", pedal));
        cmd.Parameters.Add(new SqlParameter("@Return", isReturn));
        cmd.Parameters.Add(new SqlParameter("@Weight", weight));
        cmd.Parameters.Add(new SqlParameter("@Date", date));
        cmd.Parameters.Add(new SqlParameter("@IncludeFuelSurcharge", includeFuelSurcharge));

        var result = await cmd.ExecuteScalarAsync(ct);
        return result == null || result == DBNull.Value ? 0m : Convert.ToDecimal(result);
    }

    /// <summary>
    /// Calls REP_fncJob_IsValid — scalar function returning availability string.
    /// </summary>
    private async Task<string> CallIsValidAsync(
        int jobTypeId, int fromSuburbId, int toSuburbId, int clientId, int size, CancellationToken ct)
    {
        var sql = @"
            SELECT dbo.REP_fncJob_IsValid(
                @JobTypeID, @FromSuburbID, @ToSuburbID, @ClientID, @Size, 1
            ) AS Availability";

        using var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(ct);

        using var cmd = connection.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new SqlParameter("@JobTypeID", jobTypeId));
        cmd.Parameters.Add(new SqlParameter("@FromSuburbID", fromSuburbId));
        cmd.Parameters.Add(new SqlParameter("@ToSuburbID", toSuburbId));
        cmd.Parameters.Add(new SqlParameter("@ClientID", clientId));
        cmd.Parameters.Add(new SqlParameter("@Size", size));

        var result = await cmd.ExecuteScalarAsync(ct);
        return result?.ToString() ?? "Unknown";
    }

    /// <summary>
    /// Calls UTL_fncJob_DirectCanBeASAP — scalar function returning bit.
    /// </summary>
    private async Task<bool> CallDirectCanBeAsapAsync(
        int jobTypeId, int fromSuburbId, int toSuburbId, int clientId, int size, CancellationToken ct)
    {
        var sql = @"
            SELECT dbo.UTL_fncJob_DirectCanBeASAP(
                @JobTypeID, @FromSuburbID, @ToSuburbID, @ClientID, @Size, 1
            ) AS CanBeAsap";

        using var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(ct);

        using var cmd = connection.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new SqlParameter("@JobTypeID", jobTypeId));
        cmd.Parameters.Add(new SqlParameter("@FromSuburbID", fromSuburbId));
        cmd.Parameters.Add(new SqlParameter("@ToSuburbID", toSuburbId));
        cmd.Parameters.Add(new SqlParameter("@ClientID", clientId));
        cmd.Parameters.Add(new SqlParameter("@Size", size));

        var result = await cmd.ExecuteScalarAsync(ct);
        return result != null && result != DBNull.Value && Convert.ToBoolean(result);
    }
}
