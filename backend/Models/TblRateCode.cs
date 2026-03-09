using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Accounts.Web.Core.Domain.Despatch;

/// <summary>
/// Entity for tblRateCode. Not currently in the Accounts DbContext — needs to be added.
/// </summary>
[Table("tblRateCode")]
public class TblRateCode
{
    [Key]
    [Column("RateCodeID")]
    public int RateCodeId { get; set; }

    [Column("Amount")]
    public decimal Amount { get; set; }

    // Add other columns as needed (Description, etc.)
}
