"""Gap #10: Add payslip PDF download button to payroll-extras.tsx"""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\payroll-extras.tsx")
src = f.read_text("utf-8")

BT = chr(96)

# Add jsPDF import at top
if "jspdf" not in src:
    src = src.replace(
        '"use client";',
        '"use client";\nimport jsPDF from "jspdf";'
    )
    print("Added jsPDF import")

# Add downloadPayslipPDF function before the return statement
pdf_fn = f"""
  function downloadPayslipPDF(ps: Payslip) {{
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    let y = 20;
    
    // Header
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, w, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("PAYSLIP", 15, 18);
    doc.setFontSize(10);
    doc.text({BT}${{runRef}} | Generated ${{new Date().toISOString().slice(0,10)}}{BT}, 15, 28);
    
    y = 45;
    doc.setTextColor(30, 41, 59); // slate-800
    
    // Employee info
    doc.setFontSize(14);
    doc.text(ps.employee_name, 15, y); y += 7;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text({BT}${{ps.employee_id}} | ${{ps.department}}{BT}, 15, y);
    if (ps.iban) {{
      y += 5;
      doc.text({BT}Bank: ${{ps.bank_name || "N/A"}} | IBAN: ${{ps.iban}}{BT}, 15, y);
    }}
    y += 12;
    
    // Table header helper
    function tableHeader(title: string, startY: number) {{
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(15, startY - 4, w - 30, 7, "F");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(title.toUpperCase(), 17, startY);
      doc.text("AMOUNT (SAR)", w - 50, startY);
      return startY + 8;
    }}
    
    function tableRow(name: string, amount: number, startY: number, bold = false) {{
      doc.setFontSize(9);
      doc.setTextColor(bold ? 16 : 71, bold ? 185 : 85, bold ? 129 : 105);
      if (bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.text(name, 17, startY);
      doc.text(fmt(amount), w - 50, startY);
      return startY + 6;
    }}
    
    // Earnings
    y = tableHeader("Earnings", y);
    for (const e of ps.earnings) {{ y = tableRow(e.name, e.amount, y); }}
    y = tableRow("Total Earnings", ps.total_earnings, y, true);
    y += 6;
    
    // Deductions
    y = tableHeader("Deductions", y);
    for (const d of ps.deductions) {{ y = tableRow(d.name, d.amount, y); }}
    y = tableRow("Total Deductions", ps.total_deductions, y, true);
    y += 6;
    
    // Employer contributions
    if (ps.employer_contributions.length > 0) {{
      y = tableHeader("Employer Contributions", y);
      for (const c of ps.employer_contributions) {{ y = tableRow(c.name, c.amount, y); }}
      y += 6;
    }}
    
    // Net pay box
    doc.setFillColor(16, 185, 129);
    doc.rect(15, y, w - 30, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("NET PAY", 20, y + 9);
    doc.text({BT}SAR ${{fmt(ps.net_pay)}}{BT}, w - 55, y + 9);
    
    // Footer
    y += 25;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("This is a computer-generated document. | Taliq HR Platform", 15, y);
    
    doc.save({BT}payslip-${{ps.employee_id}}-${{runRef}}.pdf{BT});
  }}

"""

# Insert before the return (
if "downloadPayslipPDF" not in src:
    # Find "return (" in the component
    return_idx = src.index("  return (")
    src = src[:return_idx] + pdf_fn + src[return_idx:]
    print("Added downloadPayslipPDF function")

# Add download button to each payslip card - after the net pay div
old_net = '</div>\n                </div>\n                <div className="grid grid-cols-3 gap-3 text-xs">'
new_net = '</div>\n                  <button onClick={() => downloadPayslipPDF(ps)} className="mt-1 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium hover:bg-emerald-100" title="Download PDF">PDF</button>\n                </div>\n                <div className="grid grid-cols-3 gap-3 text-xs">'

if "downloadPayslipPDF(ps)" not in src:
    src = src.replace(old_net, new_net)
    print("Added PDF button to payslip cards")

f.write_text(src, "utf-8")
print("Gap #10 DONE")
