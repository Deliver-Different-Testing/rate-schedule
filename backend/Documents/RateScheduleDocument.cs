using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Dfrnt.Reports.Models;

namespace Dfrnt.Reports.Documents;

/// <summary>
/// QuestPDF document renderer for the DFRNT Rate Schedule.
/// Produces a 3-page landscape A4 PDF matching the HTML mockup exactly.
/// </summary>
public class RateScheduleDocument : IDocument
{
    private readonly RateScheduleData _data;

    // DFRNT Design System Colors
    private static readonly string Primary = "#0d0c2c";
    private static readonly string Cyan = "#3bc7f4";
    private static readonly string LightGrey = "#f4f2f1";
    private static readonly string TableHeaderBg = "#0d0c2c";
    private static readonly string AsapHeaderBg = "#163550";
    private static readonly string BorderColor = "#e4e4e8";
    private static readonly string EvenRowBg = "#f8f8fa";

    // Speed column headers
    private static readonly string[] SpeedColumns = { "Eco", "3 Hour", "2 Hour", "90 Min", "75 Min", "1 Hour", "45 Min", "30 Min", "15 Min", "Direct" };
    // Columns 6,7,8 (45min, 30min, 15min) are ASAP-highlighted
    private static readonly HashSet<int> AsapColumns = new() { 6, 7, 8 };

    public RateScheduleDocument(RateScheduleData data)
    {
        _data = data;
    }

    public DocumentMetadata GetMetadata() => new()
    {
        Title = $"Rate Schedule — {_data.ClientName}, {_data.FromSuburb}",
        Author = "DFRNT",
        Creator = "DFRNT Rate Schedule Generator",
        Producer = "QuestPDF"
    };

    public void Compose(IDocumentContainer container)
    {
        // Page 1: On-Demand Rate Matrix
        container.Page(page =>
        {
            ConfigurePage(page);
            page.Content().Column(col =>
            {
                col.Item().Element(c => ComposeHeader(c));
                col.Item().Element(c => ComposeTitleBar(c, "On-Demand Rate Schedule", "Base rates ex. MFV, GST & PPD"));
                col.Item().Element(c => ComposeDisclaimer(c));
                col.Item().Element(c => ComposeRateTable(c));
                col.Item().Element(c => ComposeFooterNotes(c));
                col.Item().Element(c => ComposePageNumber(c, 1, 3));
            });
        });

        // Page 2: Scheduled Services
        container.Page(page =>
        {
            ConfigurePage(page);
            page.Content().Column(col =>
            {
                col.Item().Element(c => ComposeHeader(c));
                col.Item().Element(c => ComposeTitleBar(c, "Scheduled Service Rates", "Pre-agreed contracted rates"));
                col.Item().Text("These rates apply to pre-agreed scheduled services only. On-demand rates are shown on the preceding page.")
                    .FontSize(7.5f).FontColor("#666666").Italic();
                col.Item().PaddingTop(8).Element(c => ComposeScheduledTable(c));
                col.Item().PaddingTop(8).Element(c => ComposeScheduleNote(c));
                col.Item().Element(c => ComposePageNumber(c, 2, 3));
            });
        });

        // Page 3: Extra Charges
        container.Page(page =>
        {
            ConfigurePage(page);
            page.Content().Column(col =>
            {
                col.Item().Element(c => ComposeHeader(c));
                col.Item().Element(c => ComposeTitleBar(c, "Additional Charges & Information", "Surcharges & policies"));
                col.Item().PaddingTop(12).Element(c => ComposeExtrasGrid(c));
                col.Item().PaddingTop(16).Element(c => ComposeUnderstandingBox(c));
                col.Item().Element(c => ComposePageNumber(c, 3, 3));
            });
        });
    }

    private void ConfigurePage(PageDescriptor page)
    {
        page.Size(PageSizes.A4.Landscape());
        page.MarginHorizontal(32);
        page.MarginVertical(28);
        page.DefaultTextStyle(x => x.FontFamily("Inter").FontSize(9));
    }

    private void ComposeHeader(IContainer container)
    {
        container.PaddingBottom(6).BorderBottom(2).BorderColor(Primary).Row(row =>
        {
            row.RelativeItem().Row(logoRow =>
            {
                // Logo placeholder — in production, embed the DFRNT SVG/PNG
                logoRow.ConstantItem(32).Height(32)
                    .Background(Primary).AlignCenter().AlignMiddle()
                    .Text("D").FontSize(16).FontColor("#ffffff").Bold();
                logoRow.ConstantItem(10); // spacing
                logoRow.RelativeItem().AlignMiddle()
                    .Text("DFRNT").FontSize(15).Bold().FontColor(Primary).LetterSpacing(1.5f);
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text($"Generated {_data.PrintDate:dd MMMM yyyy}")
                    .FontSize(8.5f).FontColor("#888888");
                col.Item().PaddingTop(2).Text(_data.ClientName)
                    .FontSize(11).SemiBold().FontColor(Primary);
            });
        });
    }

    private void ComposeTitleBar(IContainer container, string title, string subtitle)
    {
        container.PaddingBottom(3).Row(row =>
        {
            row.RelativeItem().Text(title).FontSize(14).Bold().FontColor(Primary);
            row.RelativeItem().AlignRight().AlignBottom()
                .Text(subtitle).FontSize(9).SemiBold().FontColor(Cyan)
                .LetterSpacing(0.5f);
        });
    }

    private void ComposeDisclaimer(IContainer container)
    {
        container.PaddingBottom(8)
            .Text($"From: {_data.FromSuburb}  |  If your delivery suburb is not listed, please contact us for a quote.")
            .FontSize(7.5f).FontColor("#666666").Italic();
    }

    private void ComposeRateTable(IContainer container)
    {
        container.Table(table =>
        {
            // Define columns: Destination + 10 speed columns
            table.ColumnsDefinition(cols =>
            {
                cols.RelativeColumn(2.5f); // Destination (wider)
                for (int i = 0; i < 10; i++)
                    cols.RelativeColumn(1);
            });

            // Header row
            table.Header(header =>
            {
                header.Cell().Background(TableHeaderBg).Padding(5).PaddingHorizontal(4)
                    .Text("Destination").FontSize(8.5f).FontColor("#ffffff").SemiBold();

                for (int i = 0; i < SpeedColumns.Length; i++)
                {
                    var bg = AsapColumns.Contains(i) ? AsapHeaderBg : TableHeaderBg;
                    header.Cell().Background(bg).Padding(5).PaddingHorizontal(4)
                        .AlignCenter()
                        .Text(SpeedColumns[i]).FontSize(8.5f).FontColor("#ffffff").SemiBold();
                }
            });

            // Data rows
            for (int rowIdx = 0; rowIdx < _data.OnDemandRates.Count; rowIdx++)
            {
                var rate = _data.OnDemandRates[rowIdx];
                var isEven = rowIdx % 2 == 0;
                var rowBg = isEven ? "#ffffff" : EvenRowBg;

                table.Cell().Background(rowBg).Border(0.5f).BorderColor(BorderColor)
                    .Padding(3).PaddingHorizontal(5)
                    .Text(rate.Destination).FontSize(8.5f).Medium().FontColor(Primary);

                for (int col = 0; col < 10; col++)
                {
                    var value = rate.GetRate(col);
                    var cellBg = AsapColumns.Contains(col)
                        ? (isEven ? "#f0fbff" : "#e6f7fd")
                        : rowBg;

                    var cell = table.Cell().Background(cellBg).Border(0.5f).BorderColor(BorderColor)
                        .Padding(3).PaddingHorizontal(5).AlignRight();

                    if (value.HasValue)
                        cell.Text($"${value:F2}").FontSize(8.5f);
                    else
                        cell.Text("—").FontSize(7).FontColor("#cccccc").AlignCenter();
                }
            }
        });
    }

    private void ComposeFooterNotes(IContainer container)
    {
        container.PaddingTop(10).BorderTop(1).BorderColor(BorderColor).PaddingTop(5)
            .Row(row =>
            {
                row.RelativeItem().Text(t =>
                {
                    t.Span("DIRECT: ").Bold().FontSize(7.5f).FontColor(Primary);
                    t.Span("Courier goes directly from pickup to delivery.").FontSize(7.5f).FontColor("#666666");
                });
                row.ConstantItem(24);
                row.RelativeItem().Text(t =>
                {
                    t.Span("ASAP (shaded): ").Bold().FontSize(7.5f).FontColor(Primary);
                    t.Span("Courier delivers as soon as possible after pickup.").FontSize(7.5f).FontColor("#666666");
                });
                row.ConstantItem(24);
                row.RelativeItem().Text(t =>
                {
                    t.Span("*Base rates: ").Bold().FontSize(7.5f).FontColor(Primary);
                    t.Span("MFV, GST, and PPD are applied at invoicing.").FontSize(7.5f).FontColor("#666666");
                });
            });
    }

    private void ComposeScheduledTable(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                cols.RelativeColumn(3);   // Route
                cols.RelativeColumn(2.5f); // Service
                cols.RelativeColumn(2);   // Schedule
                cols.RelativeColumn(1);   // Base Rate
                cols.RelativeColumn(1);   // Est. with MFV
            });

            // Header
            table.Header(header =>
            {
                foreach (var h in new[] { "Route", "Service", "Schedule", "Base Rate", "Est. with MFV" })
                {
                    var cell = header.Cell().Background(TableHeaderBg).Padding(6).PaddingHorizontal(8);
                    var text = cell.Text(h).FontSize(8.5f).FontColor("#ffffff").SemiBold();
                    // Right-align rate columns
                    if (h.Contains("Rate") || h.Contains("MFV"))
                        cell.AlignRight();
                }
            });

            // Rows
            for (int i = 0; i < _data.ScheduledServices.Count; i++)
            {
                var svc = _data.ScheduledServices[i];
                var bg = i % 2 == 0 ? "#ffffff" : EvenRowBg;

                table.Cell().Background(bg).Border(0.5f).BorderColor(BorderColor).Padding(5).PaddingHorizontal(8)
                    .Text(svc.Route).FontSize(9).FontColor("#333333");

                // Service with badge
                table.Cell().Background(bg).Border(0.5f).BorderColor(BorderColor).Padding(5).PaddingHorizontal(8)
                    .Row(r =>
                    {
                        var (badgeBg, badgeColor) = GetBadgeColors(svc.ServiceBadge);
                        r.AutoItem().Background(badgeBg).Padding(1).PaddingHorizontal(6)
                            .Text(svc.ServiceBadge).FontSize(7).SemiBold().FontColor(badgeColor);
                        r.ConstantItem(4);
                        r.RelativeItem().AlignMiddle().Text(svc.Service).FontSize(9).FontColor("#333333");
                    });

                table.Cell().Background(bg).Border(0.5f).BorderColor(BorderColor).Padding(5).PaddingHorizontal(8)
                    .Text(svc.Schedule).FontSize(9).FontColor("#333333");

                table.Cell().Background(bg).Border(0.5f).BorderColor(BorderColor).Padding(5).PaddingHorizontal(8)
                    .AlignRight().Text($"${svc.BaseRate:F2}").FontSize(9).FontColor("#333333");

                table.Cell().Background(bg).Border(0.5f).BorderColor(BorderColor).Padding(5).PaddingHorizontal(8)
                    .AlignRight().Text($"${svc.EstWithMFV:F2}").FontSize(9).FontColor("#333333");
            }
        });
    }

    private void ComposeScheduleNote(IContainer container)
    {
        container.Background("#f8f8fa").BorderLeft(3).BorderColor(Cyan)
            .Padding(6).PaddingHorizontal(8)
            .Text("💡 Scheduled service rates are contracted and reviewed quarterly. To add, remove, or modify scheduled services, contact your account manager. MFV estimates are based on current month's fuel variation and may change.")
            .FontSize(7.5f).FontColor("#666666").Italic();
    }

    private void ComposeExtrasGrid(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                cols.RelativeColumn();
                cols.ConstantItem(8); // gap
                cols.RelativeColumn();
            });

            // Row 1: Extra Items | Weight Surcharges
            ComposeExtraCard(table, "📦 Extra Items",
                $"Additional items per consignment: ${_data.Extras.ExtraItemCharge:F2}");
            table.Cell(); // gap
            ComposeExtraCard(table, "⚖️ Weight Surcharges",
                $"Consignments over 30kg up to 50kg incur an additional charge. A further charge applies per 25kg (or part thereof) over 50kg.\n" +
                $"3hr ${_data.Extras.WeightSurcharges.FirstOrDefault()?.ThreeHour:F2}  |  2hr ${_data.Extras.WeightSurcharges.FirstOrDefault()?.TwoHour:F2}  |  90min ${_data.Extras.WeightSurcharges.FirstOrDefault()?.NinetyMin:F2}  |  75min ${_data.Extras.WeightSurcharges.FirstOrDefault()?.SeventyFiveMin:F2}  |  1hr+ ${_data.Extras.WeightSurcharges.FirstOrDefault()?.OneHourPlus:F2}");

            // Row 2: After Hours | Van/Multi-Trip
            ComposeExtraCard(table, "🌙 After Hours",
                $"Outside business hours (7am–7pm Mon–Fri):\nStandard: ${_data.Extras.AfterHours.Standard:F2}  |  Midnight–5am: ${_data.Extras.AfterHours.Overnight:F2}  |  Saturday 8am–1pm: ${_data.Extras.AfterHours.Saturday:F2}");
            table.Cell(); // gap
            ComposeExtraCard(table, "🚐 Van / Multi-Trip Charge", _data.Extras.VanMultiTripNote);

            // Row 3: MFV | PPD
            ComposeExtraCard(table, "⛽ Monthly Fuel Variation (MFV)", _data.Extras.MfvNote);
            table.Cell(); // gap
            ComposeExtraCard(table, "🧾 Prompt Payment Discount (PPD)", _data.Extras.PpdNote);
        });
    }

    private void ComposeExtraCard(TableDescriptor table, string title, string body)
    {
        table.Cell().Background(EvenRowBg).Border(1).BorderColor(BorderColor)
            .Padding(8).PaddingHorizontal(10).Column(col =>
            {
                col.Item().Text(title).FontSize(8.5f).Bold().FontColor(Primary);
                col.Item().PaddingTop(3).Text(body).FontSize(7.5f).FontColor("#555555").LineHeight(1.5f);
            });
    }

    private void ComposeUnderstandingBox(IContainer container)
    {
        container.Background("#f0f8ff").BorderLeft(3).BorderColor(Cyan)
            .Padding(10).Column(col =>
            {
                col.Item().PaddingBottom(4).Text("Understanding Your Rates")
                    .FontSize(8.5f).SemiBold().FontColor(Primary);
                col.Item().Text(t =>
                {
                    t.Span("Base Rate").Bold().FontSize(7.5f);
                    t.Span(" = the rate shown in the schedule, before any surcharges.\n").FontSize(7.5f);
                    t.Span("Your Invoice").Bold().FontSize(7.5f);
                    t.Span(" = Base Rate + MFV% + any applicable surcharges + GST − PPD (if eligible).\n").FontSize(7.5f);
                    t.Span("DIRECT").Bold().FontSize(7.5f);
                    t.Span(" = courier goes straight from pickup to delivery, no other stops.\n").FontSize(7.5f);
                    t.Span("ASAP").Bold().FontSize(7.5f);
                    t.Span(" (shaded columns) = courier delivers as soon as possible after picking up, may combine with nearby deliveries.").FontSize(7.5f);
                }).FontColor("#555555").LineHeight(1.6f);
            });
    }

    private void ComposePageNumber(IContainer container, int current, int total)
    {
        container.PaddingTop(8).BorderTop(1).BorderColor("#f0f0f0").PaddingTop(4)
            .AlignRight().Text($"Page {current} of {total}")
            .FontSize(7).FontColor("#aaaaaa");
    }

    private static (string bg, string color) GetBadgeColors(string badge) => badge?.ToLower() switch
    {
        "next day" => ("#e8f5e9", "#2e7d32"),
        "same day" => ("#fce4ec", "#c62828"),
        "morning" => ("#e3f2fd", "#1565c0"),
        "afternoon" => ("#fff3e0", "#e65100"),
        _ => ("#e8e8ec", "#555555")
    };
}
