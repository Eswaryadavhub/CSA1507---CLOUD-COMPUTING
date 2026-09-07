"""
TourPulse: Multi-Sheet Professional Excel Report Generator
Generates an .xlsx workbook using openpyxl containing 6 dedicated analytics worksheets
formatted in Times New Roman with freeze panes, borders, filters, number formatting,
and embedded openpyxl charts.
"""

import io
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import BarChart, LineChart, Reference

def generate_tourpulse_excel(report_data: dict) -> bytes:
    wb = Workbook()
    
    # Times New Roman Typography & Corporate Styles
    font_family = "Times New Roman"
    title_font = Font(name=font_family, size=15, bold=True, color="0C2340")
    section_font = Font(name=font_family, size=12, bold=True, color="0747A6")
    header_font = Font(name=font_family, size=11, bold=True, color="FFFFFF")
    bold_font = Font(name=font_family, size=10, bold=True, color="1E293B")
    regular_font = Font(name=font_family, size=10, color="1E293B")
    italic_font = Font(name=font_family, size=9, italic=True, color="64748B")
    
    header_fill = PatternFill(start_color="0C2340", end_color="0C2340", fill_type="solid")
    accent_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    kpi_box_fill = PatternFill(start_color="EFF6FF", end_color="EFF6FF", fill_type="solid")
    
    thin_border = Border(
        left=Side(style="thin", color="CBD5E1"),
        right=Side(style="thin", color="CBD5E1"),
        top=Side(style="thin", color="CBD5E1"),
        bottom=Side(style="thin", color="CBD5E1")
    )
    
    header_border = Border(
        left=Side(style="thin", color="0C2340"),
        right=Side(style="thin", color="0C2340"),
        top=Side(style="medium", color="0C2340"),
        bottom=Side(style="medium", color="0C2340")
    )

    kpis = report_data.get("kpis", {})
    attractions = report_data.get("attractions", [])
    recommendations = report_data.get("recommendations", [])
    flow_data = report_data.get("flow_data", {})

    # =========================================================================
    # Sheet 1: Summary
    # =========================================================================
    ws_summary = wb.active
    ws_summary.title = "Summary"
    ws_summary.views.sheetView[0].showGridLines = True
    
    ws_summary["A1"] = "TOURPULSE: TOURIST FLOW & ATTRACTION ANALYTICS"
    ws_summary["A1"].font = title_font
    ws_summary["A2"] = "Executive Tourism Intelligence & Capacity Optimization Workbook"
    ws_summary["A2"].font = italic_font
    
    ws_summary["A4"] = "REPORTING METADATA"
    ws_summary["A4"].font = section_font
    
    meta_rows = [
        ("Target Region / City", report_data.get("city", "All Cities")),
        ("Analysis Time Window", report_data.get("date_preset", "Last 30 Days")),
        ("Generated Timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")),
        ("Operational Database", "Oracle XE 11.2 (TOURPULSE Schema)"),
        ("Analytics & ML Framework", "MapReduce Pipeline & Scikit-learn / BigQuery ML")
    ]
    
    row_idx = 5
    for label, val in meta_rows:
        ws_summary.cell(row=row_idx, column=1, value=label).font = bold_font
        ws_summary.cell(row=row_idx, column=2, value=val).font = regular_font
        ws_summary.cell(row=row_idx, column=1).border = thin_border
        ws_summary.cell(row=row_idx, column=2).border = thin_border
        ws_summary.cell(row=row_idx, column=1).fill = accent_fill
        row_idx += 1
        
    row_idx += 1
    ws_summary.cell(row=row_idx, column=1, value="HEADLINE KEY PERFORMANCE INDICATORS").font = section_font
    row_idx += 1
    
    kpi_rows = [
        ("Total Verified Tourist Visits", kpis.get("total_visits", 0), "#,##0"),
        ("Active Monitored Attractions", kpis.get("active_attractions", 0), "#,##0"),
        ("Top Destination by Footfall", kpis.get("top_attraction", "N/A"), None),
        ("Average Cross-Site Capacity Load", kpis.get("avg_crowd_level_pct", 0) / 100.0, "0.0%"),
        ("Peak Arrival Visiting Hour", kpis.get("peak_visiting_hour", "N/A"), None),
        ("Estimated Daily Average Visitors", kpis.get("daily_average_visitors", 0), "#,##0"),
        ("Active High-Congestion Bottlenecks", kpis.get("high_crowd_attractions_count", 0), "#,##0")
    ]
    
    for label, val, num_fmt in kpi_rows:
        c1 = ws_summary.cell(row=row_idx, column=1, value=label)
        c2 = ws_summary.cell(row=row_idx, column=2, value=val)
        c1.font = bold_font
        c2.font = bold_font
        c1.fill = kpi_box_fill
        c2.fill = kpi_box_fill
        c1.border = thin_border
        c2.border = thin_border
        if num_fmt:
            c2.number_format = num_fmt
        row_idx += 1

    ws_summary.column_dimensions["A"].width = 36
    ws_summary.column_dimensions["B"].width = 42

    # =========================================================================
    # Sheet 2: Attractions
    # =========================================================================
    ws_attr = wb.create_sheet(title="Attractions")
    ws_attr.views.sheetView[0].showGridLines = True
    ws_attr.freeze_panes = "A2"
    
    attr_headers = ["ID", "Attraction Name", "City", "Category", "Verified Visits", "Capacity", "Capacity Utilization", "Crowd Density Level"]
    ws_attr.append(attr_headers)
    for col in range(1, len(attr_headers) + 1):
        cell = ws_attr.cell(row=1, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = header_border

    row_num = 2
    for a in attractions:
        v = a.get("visits", a.get("current_visits", 0))
        cap = max(a.get("capacity", 1), 1)
        util = v / cap
        ws_attr.append([
            a.get("attraction_id", a.get("id", 0)),
            a.get("name", a.get("attraction_name", "")),
            a.get("city", ""),
            a.get("category", ""),
            v,
            cap,
            util,
            a.get("crowd", a.get("current_crowd", "Low"))
        ])
        
        ws_attr.cell(row=row_num, column=1).alignment = Alignment(horizontal="center")
        ws_attr.cell(row=row_num, column=5).number_format = "#,##0"
        ws_attr.cell(row=row_num, column=6).number_format = "#,##0"
        ws_attr.cell(row=row_num, column=7).number_format = "0.0%"
        
        for c in range(1, len(attr_headers) + 1):
            ws_attr.cell(row=row_num, column=c).font = regular_font
            ws_attr.cell(row=row_num, column=c).border = thin_border
        row_num += 1

    ws_attr.auto_filter.ref = f"A1:H{max(row_num-1, 1)}"
    
    ws_attr.column_dimensions["A"].width = 8
    ws_attr.column_dimensions["B"].width = 34
    ws_attr.column_dimensions["C"].width = 16
    ws_attr.column_dimensions["D"].width = 16
    ws_attr.column_dimensions["E"].width = 18
    ws_attr.column_dimensions["F"].width = 16
    ws_attr.column_dimensions["G"].width = 22
    ws_attr.column_dimensions["H"].width = 22

    # Embed Bar Chart in Attractions sheet if data exists
    if len(attractions) > 0:
        chart1 = BarChart()
        chart1.type = "col"
        chart1.style = 10
        chart1.title = "Attraction Visits vs Capacity"
        chart1.y_axis.title = "Volume"
        chart1.x_axis.title = "Attractions"
        chart1.width = 18
        chart1.height = 10
        
        data_ref = Reference(ws_attr, min_col=5, min_row=1, max_col=6, max_row=min(len(attractions) + 1, 12))
        cats_ref = Reference(ws_attr, min_col=2, min_row=2, max_row=min(len(attractions) + 1, 12))
        chart1.add_data(data_ref, titles_from_data=True)
        chart1.set_categories(cats_ref)
        ws_attr.add_chart(chart1, "J2")

    # =========================================================================
    # Sheet 3: Tourist Flow
    # =========================================================================
    ws_flow = wb.create_sheet(title="Tourist Flow")
    ws_flow.views.sheetView[0].showGridLines = True
    ws_flow.freeze_panes = "A2"
    
    flow_headers = ["Time Horizon / Date", "Arrival Volume (Check-ins)", "Relative Peak Ratio"]
    ws_flow.append(flow_headers)
    for col in range(1, len(flow_headers) + 1):
        cell = ws_flow.cell(row=1, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")
        cell.border = header_border

    labels = flow_data.get("labels", [])
    values = flow_data.get("values", [])
    max_val = max(values, default=1)
    
    row_num = 2
    for lbl, val in zip(labels, values):
        ratio = val / max(max_val, 1)
        ws_flow.append([lbl, val, ratio])
        ws_flow.cell(row=row_num, column=1).alignment = Alignment(horizontal="center")
        ws_flow.cell(row=row_num, column=2).number_format = "#,##0"
        ws_flow.cell(row=row_num, column=3).number_format = "0.0%"
        for c in range(1, len(flow_headers) + 1):
            ws_flow.cell(row=row_num, column=c).font = regular_font
            ws_flow.cell(row=row_num, column=c).border = thin_border
        row_num += 1

    ws_flow.auto_filter.ref = f"A1:C{max(row_num-1, 1)}"
    ws_flow.column_dimensions["A"].width = 24
    ws_flow.column_dimensions["B"].width = 28
    ws_flow.column_dimensions["C"].width = 24

    # Embed Line Chart in Tourist Flow sheet
    if len(labels) > 0:
        chart2 = LineChart()
        chart2.title = "Tourist Flow Arrival Trend"
        chart2.style = 13
        chart2.y_axis.title = "Check-ins"
        chart2.x_axis.title = "Time Period"
        chart2.width = 16
        chart2.height = 9
        
        data_ref2 = Reference(ws_flow, min_col=2, min_row=1, max_row=len(labels) + 1)
        cats_ref2 = Reference(ws_flow, min_col=1, min_row=2, max_row=len(labels) + 1)
        chart2.add_data(data_ref2, titles_from_data=True)
        chart2.set_categories(cats_ref2)
        ws_flow.add_chart(chart2, "E2")

    # =========================================================================
    # Sheet 4: Crowd Analysis
    # =========================================================================
    ws_crowd = wb.create_sheet(title="Crowd Analysis")
    ws_crowd.views.sheetView[0].showGridLines = True
    ws_crowd.freeze_panes = "A2"
    
    crowd_headers = ["Density Classification", "Threshold Definition", "Monitored Destinations", "Percent of Total Network", "Recommended Action"]
    ws_crowd.append(crowd_headers)
    for col in range(1, len(crowd_headers) + 1):
        cell = ws_crowd.cell(row=1, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")
        cell.border = header_border

    tot_attrs = max(len(attractions), 1)
    high_cnt = sum(1 for a in attractions if a.get("crowd") == "High")
    mod_cnt = sum(1 for a in attractions if a.get("crowd") == "Moderate")
    low_cnt = sum(1 for a in attractions if a.get("crowd") == "Low")

    crowd_rows = [
        ("High Congestion", ">= 70% Capacity Utilization", high_cnt, high_cnt / tot_attrs, "Trigger automated mobile diversions; increase shuttle frequencies."),
        ("Moderate Activity", "40% - 69% Capacity Utilization", mod_cnt, mod_cnt / tot_attrs, "Monitor arrival surges; maintain standard visitor ingress flow."),
        ("Low Density", "< 40% Capacity Utilization", low_cnt, low_cnt / tot_attrs, "Promote as optimal destination for tranquil cultural exploration.")
    ]

    row_num = 2
    for cls_name, thresh, cnt, pct, action in crowd_rows:
        ws_crowd.append([cls_name, thresh, cnt, pct, action])
        ws_crowd.cell(row=row_num, column=3).number_format = "#,##0"
        ws_crowd.cell(row=row_num, column=4).number_format = "0.0%"
        for c in range(1, len(crowd_headers) + 1):
            ws_crowd.cell(row=row_num, column=c).font = regular_font
            ws_crowd.cell(row=row_num, column=c).border = thin_border
        row_num += 1

    ws_crowd.column_dimensions["A"].width = 22
    ws_crowd.column_dimensions["B"].width = 30
    ws_crowd.column_dimensions["C"].width = 24
    ws_crowd.column_dimensions["D"].width = 26
    ws_crowd.column_dimensions["E"].width = 50

    # =========================================================================
    # Sheet 5: Predictions
    # =========================================================================
    ws_pred = wb.create_sheet(title="Predictions")
    ws_pred.views.sheetView[0].showGridLines = True
    ws_pred.freeze_panes = "A2"
    
    pred_headers = ["Attraction Name", "City", "Capacity", "Historical Baseline", "Forecasted Demand", "Predicted Load %", "Congestion Alert Status"]
    ws_pred.append(pred_headers)
    for col in range(1, len(pred_headers) + 1):
        cell = ws_pred.cell(row=1, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")
        cell.border = header_border

    row_num = 2
    for a in attractions:
        v = a.get("visits", a.get("current_visits", 0))
        cap = max(a.get("capacity", 1), 1)
        pred_v = int(v * 1.12)
        pred_load = pred_v / cap
        status = "ALERT: High Congestion" if pred_load >= 0.70 else ("MODERATE" if pred_load >= 0.40 else "NORMAL")
        
        ws_pred.append([
            a.get("name", ""),
            a.get("city", ""),
            cap,
            v,
            pred_v,
            pred_load,
            status
        ])
        
        ws_pred.cell(row=row_num, column=3).number_format = "#,##0"
        ws_pred.cell(row=row_num, column=4).number_format = "#,##0"
        ws_pred.cell(row=row_num, column=5).number_format = "#,##0"
        ws_pred.cell(row=row_num, column=6).number_format = "0.0%"
        
        for c in range(1, len(pred_headers) + 1):
            ws_pred.cell(row=row_num, column=c).font = regular_font
            ws_pred.cell(row=row_num, column=c).border = thin_border
        row_num += 1

    ws_pred.auto_filter.ref = f"A1:G{max(row_num-1, 1)}"
    ws_pred.column_dimensions["A"].width = 32
    ws_pred.column_dimensions["B"].width = 16
    ws_pred.column_dimensions["C"].width = 14
    ws_pred.column_dimensions["D"].width = 20
    ws_pred.column_dimensions["E"].width = 20
    ws_pred.column_dimensions["F"].width = 18
    ws_pred.column_dimensions["G"].width = 26

    # =========================================================================
    # Sheet 6: Recommendations
    # =========================================================================
    ws_rec = wb.create_sheet(title="Recommendations")
    ws_rec.views.sheetView[0].showGridLines = True
    ws_rec.freeze_panes = "A2"
    
    rec_headers = ["Congested Landmark", "Crowd Density", "Capacity Load %", "Recommended Alternative", "Alternative City", "Optimal Time Slot", "Diversion Rationale"]
    ws_rec.append(rec_headers)
    for col in range(1, len(rec_headers) + 1):
        cell = ws_rec.cell(row=1, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")
        cell.border = header_border

    row_num = 2
    for r in recommendations:
        load_val = r.get("target_load_pct", 80.0) / 100.0
        ws_rec.append([
            r.get("target_attraction", r.get("name", "")),
            r.get("target_crowd", r.get("current_crowd", "High")),
            load_val,
            r.get("name", ""),
            r.get("city", ""),
            r.get("optimal_time_slot", "Morning"),
            r.get("recommendation_reason", "")
        ])
        
        ws_rec.cell(row=row_num, column=3).number_format = "0.0%"
        for c in range(1, len(rec_headers) + 1):
            ws_rec.cell(row=row_num, column=c).font = regular_font
            ws_rec.cell(row=row_num, column=c).border = thin_border
        row_num += 1

    ws_rec.auto_filter.ref = f"A1:G{max(row_num-1, 1)}"
    ws_rec.column_dimensions["A"].width = 28
    ws_rec.column_dimensions["B"].width = 16
    ws_rec.column_dimensions["C"].width = 18
    ws_rec.column_dimensions["D"].width = 28
    ws_rec.column_dimensions["E"].width = 16
    ws_rec.column_dimensions["F"].width = 30
    ws_rec.column_dimensions["G"].width = 55

    # Save to binary buffer
    out_buf = io.BytesIO()
    wb.save(out_buf)
    excel_bytes = out_buf.getvalue()
    out_buf.close()
    return excel_bytes
