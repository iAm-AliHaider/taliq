import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// ─── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") || "paycodes";

  try {
    if (section === "paycodes") {
      const rows = await sql`
        SELECT p.*, 
               gd.account_name as gl_debit_name, 
               gc.account_name as gl_credit_name
        FROM paycodes p
        LEFT JOIN gl_accounts gd ON gd.account_number = p.gl_debit_account
        LEFT JOIN gl_accounts gc ON gc.account_number = p.gl_credit_account
        ORDER BY p.sort_order, p.id
      `;
      return NextResponse.json(rows);
    }

    if (section === "gl_accounts") {
      const rows = await sql`
        SELECT * FROM gl_accounts ORDER BY account_number
      `;
      return NextResponse.json(rows);
    }

    if (section === "payroll_runs") {
      const rows = await sql`
        SELECT * FROM payroll_runs ORDER BY period_year DESC, period_month DESC
      `;
      return NextResponse.json(rows);
    }

    if (section === "payroll_lines") {
      const run_id = searchParams.get("run_id");
      if (!run_id) return NextResponse.json({ error: "run_id required" }, { status: 400 });
      const rows = await sql`
        SELECT * FROM payroll_lines WHERE run_id = ${Number(run_id)} ORDER BY employee_id, paycode_id
      `;
      return NextResponse.json(rows);
    }

    if (section === "journal_voucher") {
      const run_id = searchParams.get("run_id");
      if (!run_id) return NextResponse.json({ error: "run_id required" }, { status: 400 });
      const [jv] = await sql`
        SELECT * FROM journal_vouchers WHERE run_id = ${Number(run_id)} ORDER BY id DESC LIMIT 1
      `;
      if (!jv) return NextResponse.json(null);
      const lines = await sql`
        SELECT * FROM jv_lines WHERE jv_id = ${jv.id} ORDER BY line_no
      `;
      return NextResponse.json({ ...jv, lines });
    }

    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    // ── GL Account CRUD ────────────────────────────────────────────────────────
    if (action === "create_gl_account") {
      const { account_number, account_name, account_name_ar, account_type, parent_account, cost_center } = body;
      const [row] = await sql`
        INSERT INTO gl_accounts (account_number, account_name, account_name_ar, account_type, parent_account, cost_center)
        VALUES (${account_number}, ${account_name}, ${account_name_ar || ""}, ${account_type}, ${parent_account || ""}, ${cost_center || ""})
        RETURNING *
      `;
      return NextResponse.json(row);
    }

    if (action === "update_gl_account") {
      const { id, account_number, account_name, account_name_ar, account_type, parent_account, cost_center, is_active } = body;
      const [row] = await sql`
        UPDATE gl_accounts SET
          account_number = ${account_number},
          account_name = ${account_name},
          account_name_ar = ${account_name_ar || ""},
          account_type = ${account_type},
          parent_account = ${parent_account || ""},
          cost_center = ${cost_center || ""},
          is_active = ${is_active !== false}
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json(row);
    }

    if (action === "delete_gl_account") {
      await sql`DELETE FROM gl_accounts WHERE id = ${body.id}`;
      return NextResponse.json({ ok: true });
    }

    // ── Paycode CRUD ───────────────────────────────────────────────────────────
    if (action === "create_paycode") {
      const { code, name, name_ar, paycode_type, category, gl_debit_account, gl_credit_account, is_taxable, is_gosi, sort_order } = body;
      const [row] = await sql`
        INSERT INTO paycodes (code, name, name_ar, paycode_type, category, gl_debit_account, gl_credit_account, is_taxable, is_gosi, sort_order)
        VALUES (${code}, ${name}, ${name_ar || ""}, ${paycode_type}, ${category || "salary"},
                ${gl_debit_account || ""}, ${gl_credit_account || ""},
                ${is_taxable || false}, ${is_gosi || false}, ${sort_order || 0})
        RETURNING *
      `;
      return NextResponse.json(row);
    }

    if (action === "update_paycode") {
      const { id, code, name, name_ar, paycode_type, category, gl_debit_account, gl_credit_account, is_taxable, is_gosi, is_active, sort_order } = body;
      const [row] = await sql`
        UPDATE paycodes SET
          code = ${code}, name = ${name}, name_ar = ${name_ar || ""},
          paycode_type = ${paycode_type}, category = ${category || "salary"},
          gl_debit_account = ${gl_debit_account || ""},
          gl_credit_account = ${gl_credit_account || ""},
          is_taxable = ${is_taxable || false},
          is_gosi = ${is_gosi || false},
          is_active = ${is_active !== false},
          sort_order = ${sort_order || 0}
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json(row);
    }

    if (action === "delete_paycode") {
      await sql`DELETE FROM paycodes WHERE id = ${body.id}`;
      return NextResponse.json({ ok: true });
    }

    // ── Payroll Run ────────────────────────────────────────────────────────────
    if (action === "run_payroll") {
      const { period_month, period_year, notes } = body;
      const monthNames = ["January","February","March","April","May","June",
                          "July","August","September","October","November","December"];
      const periodLabel = `${monthNames[period_month - 1]} ${period_year}`;
      const ref = `PR-${period_year}-${String(period_month).padStart(2, "0")}`;

      // Check if already exists
      const existing = await sql`SELECT id FROM payroll_runs WHERE ref = ${ref}`;
      if (existing.length > 0) {
        return NextResponse.json({ error: `Payroll run ${ref} already exists` }, { status: 409 });
      }

      // Fetch all active employees
      const employees = await sql`
        SELECT id, name, department, basic_salary, housing_allowance, transport_allowance
        FROM employees WHERE status = 'active' OR status IS NULL
      `;

      // Fetch paycodes
      const paycodes = await sql`SELECT * FROM paycodes WHERE is_active = true ORDER BY sort_order`;

      // Create payroll run
      const [run] = await sql`
        INSERT INTO payroll_runs (ref, period_label, period_month, period_year, employee_count, notes)
        VALUES (${ref}, ${periodLabel}, ${period_month}, ${period_year}, ${employees.length}, ${notes || ""})
        RETURNING *
      `;

      let totalGross = 0, totalDeductions = 0, totalGosiEmp = 0, totalGosioEr = 0;

      // Build payroll lines
      for (const emp of employees) {
        const basic = Number(emp.basic_salary) || 0;
        const housing = Number(emp.housing_allowance) || 0;
        const transport = Number(emp.transport_allowance) || 0;
        const insurable = Math.min(basic + housing, 45000);
        const gosiEmpRate = 0.09;
        const gosiErRate  = 0.1175;
        const gosiEmp = Math.round(insurable * gosiEmpRate);
        const gosiEr  = Math.round(insurable * gosiErRate);

        totalGross += basic + housing + transport;
        totalDeductions += gosiEmp;
        totalGosiEmp += gosiEmp;
        totalGosioEr += gosiEr;

        // Map paycode codes to amounts
        const amountMap: Record<string, number> = {
          BASIC:    basic,
          HOUSING:  housing,
          TRANSPORT:transport,
          GOSI_EMP: gosiEmp,
          GOSI_CO:  gosiEr,
        };

        for (const pc of paycodes) {
          const amount = amountMap[pc.code as string];
          if (amount === undefined || amount === 0) continue;
          await sql`
            INSERT INTO payroll_lines
              (run_id, employee_id, employee_name, department, paycode_id, paycode_code,
               paycode_name, paycode_type, amount, gl_debit_account, gl_credit_account)
            VALUES
              (${run.id}, ${emp.id}, ${emp.name}, ${emp.department || ""},
               ${pc.id}, ${pc.code}, ${pc.name}, ${pc.paycode_type},
               ${amount}, ${pc.gl_debit_account || ""}, ${pc.gl_credit_account || ""})
          `;
        }
      }

      // Update totals
      const totalNet = totalGross - totalDeductions;
      const [updated] = await sql`
        UPDATE payroll_runs SET
          total_gross = ${totalGross},
          total_deductions = ${totalDeductions},
          total_net = ${totalNet},
          total_gosi_employee = ${totalGosiEmp},
          total_gosi_employer = ${totalGosioEr},
          status = 'draft'
        WHERE id = ${run.id}
        RETURNING *
      `;

      return NextResponse.json(updated);
    }

    if (action === "approve_payroll") {
      const [row] = await sql`
        UPDATE payroll_runs SET status = 'approved', approved_at = NOW()
        WHERE id = ${body.run_id} RETURNING *
      `;
      return NextResponse.json(row);
    }

    // ── Generate JV ────────────────────────────────────────────────────────────
    if (action === "generate_jv") {
      const { run_id } = body;
      const [run] = await sql`SELECT * FROM payroll_runs WHERE id = ${run_id}`;
      if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

      // Delete old JV if any
      await sql`DELETE FROM journal_vouchers WHERE run_id = ${run_id}`;

      const jvRef = `JV-${run.ref}`;
      const jvDate = new Date();
      const [jv] = await sql`
        INSERT INTO journal_vouchers (run_id, jv_ref, jv_date, description, total_debit, total_credit)
        VALUES (${run_id}, ${jvRef}, ${jvDate.toISOString().slice(0,10)},
                ${"Payroll Journal Voucher — " + run.period_label},
                ${run.total_gross + run.total_gosi_employer},
                ${run.total_gross + run.total_gosi_employer})
        RETURNING *
      `;

      // Aggregate by GL account across all lines
      const lines = await sql`SELECT * FROM payroll_lines WHERE run_id = ${run_id}`;
      const debitMap: Record<string, { name: string; amount: number }> = {};
      const creditMap: Record<string, { name: string; amount: number }> = {};

      for (const line of lines) {
        const amt = Number(line.amount);
        const dr = line.gl_debit_account as string;
        const cr = line.gl_credit_account as string;

        if (line.paycode_type === "earning" || line.paycode_type === "employer_contribution") {
          // Dr Expense, Cr Liability
          if (dr) { debitMap[dr] = { name: line.paycode_name, amount: (debitMap[dr]?.amount || 0) + amt }; }
          if (cr) { creditMap[cr] = { name: "Salaries Payable", amount: (creditMap[cr]?.amount || 0) + amt }; }
        } else {
          // Deduction: Dr Liability (salaries payable), Cr Deduction liability
          if (dr) { debitMap[dr] = { name: "Salaries Payable", amount: (debitMap[dr]?.amount || 0) + amt }; }
          if (cr) { creditMap[cr] = { name: line.paycode_name, amount: (creditMap[cr]?.amount || 0) + amt }; }
        }
      }

      // Fetch GL account names
      const glRows = await sql`SELECT account_number, account_name FROM gl_accounts`;
      const glMap: Record<string, string> = {};
      for (const g of glRows) glMap[g.account_number as string] = g.account_name as string;

      let lineNo = 1;
      for (const [acct, data] of Object.entries(debitMap)) {
        if (data.amount <= 0) continue;
        await sql`
          INSERT INTO jv_lines (jv_id, line_no, account_number, account_name, debit, credit, narration)
          VALUES (${jv.id}, ${lineNo++}, ${acct}, ${glMap[acct] || data.name}, ${data.amount}, 0, ${run.period_label})
        `;
      }
      for (const [acct, data] of Object.entries(creditMap)) {
        if (data.amount <= 0) continue;
        await sql`
          INSERT INTO jv_lines (jv_id, line_no, account_number, account_name, debit, credit, narration)
          VALUES (${jv.id}, ${lineNo++}, ${acct}, ${glMap[acct] || data.name}, 0, ${data.amount}, ${run.period_label})
        `;
      }

      const jvLines = await sql`SELECT * FROM jv_lines WHERE jv_id = ${jv.id} ORDER BY line_no`;
      return NextResponse.json({ ...jv, lines: jvLines });
    }

    // ── Export JV ──────────────────────────────────────────────────────────────
    if (action === "export_jv") {
      const { run_id, format } = body; // format: "bc_csv" | "sap_csv" | "generic_csv"
      const [jv] = await sql`SELECT * FROM journal_vouchers WHERE run_id = ${run_id} ORDER BY id DESC LIMIT 1`;
      if (!jv) return NextResponse.json({ error: "No JV for this run" }, { status: 404 });

      const lines = await sql`SELECT * FROM jv_lines WHERE jv_id = ${jv.id} ORDER BY line_no`;
      const [run] = await sql`SELECT * FROM payroll_runs WHERE id = ${run_id}`;

      let csv = "";
      if (format === "bc_csv") {
        // D365 Business Central General Journal import format
        csv = "Journal Template Name,Journal Batch Name,Line No.,Account Type,Account No.,Posting Date,Document No.,Description,Debit Amount,Credit Amount,Shortcut Dimension 1 Code,Shortcut Dimension 2 Code\n";
        lines.forEach((l: any, i: number) => {
          csv += `GENERAL,PAYROLL,${(i+1)*10000},G/L Account,${l.account_number},${jv.jv_date},${jv.jv_ref},"${l.account_name}",${l.debit || ""},${l.credit || ""},${l.dimension_dept || ""},${l.dimension_emp || ""}\n`;
        });
      } else if (format === "sap_csv") {
        // SAP Journal Entry (GL)
        csv = "CompanyCode,DocumentDate,PostingDate,DocumentType,Reference,HeaderText,Account,Amount,DebitCredit,Text,CostCenter\n";
        lines.forEach((l: any) => {
          if (l.debit > 0) {
            csv += `1000,${jv.jv_date},${jv.jv_date},ZP,${jv.jv_ref},"${run.period_label}",${l.account_number},${l.debit},D,"${l.account_name}",${l.dimension_dept || ""}\n`;
          }
          if (l.credit > 0) {
            csv += `1000,${jv.jv_date},${jv.jv_date},ZP,${jv.jv_ref},"${run.period_label}",${l.account_number},${l.credit},C,"${l.account_name}",${l.dimension_dept || ""}\n`;
          }
        });
      } else {
        // Generic CSV
        csv = "JV Ref,Date,Line No,Account No,Account Name,Debit (SAR),Credit (SAR),Narration\n";
        lines.forEach((l: any) => {
          csv += `${jv.jv_ref},${jv.jv_date},${l.line_no},${l.account_number},"${l.account_name}",${l.debit || 0},${l.credit || 0},"${l.narration}"\n`;
        });
      }

      // Mark as exported
      await sql`UPDATE journal_vouchers SET export_format = ${format}, exported_at = NOW() WHERE id = ${jv.id}`;

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${jv.jv_ref}-${format}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
