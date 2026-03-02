import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// ─── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") || "";

  try {
    // ── Payslip data for one employee in a run ──────────────────────────────
    if (section === "payslip") {
      const run_id = searchParams.get("run_id");
      const employee_id = searchParams.get("employee_id");
      if (!run_id) return NextResponse.json({ error: "run_id required" }, { status: 400 });

      const [run] = await sql`SELECT * FROM payroll_runs WHERE id = ${Number(run_id)}`;
      if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

      let lines;
      if (employee_id) {
        lines = await sql`
          SELECT * FROM payroll_lines WHERE run_id = ${Number(run_id)} AND employee_id = ${employee_id}
          ORDER BY paycode_type, paycode_code
        `;
      } else {
        lines = await sql`
          SELECT * FROM payroll_lines WHERE run_id = ${Number(run_id)}
          ORDER BY employee_id, paycode_type, paycode_code
        `;
      }

      // Group by employee
      const byEmp: Record<string, any> = {};
      for (const l of lines) {
        const eid = l.employee_id as string;
        if (!byEmp[eid]) {
          byEmp[eid] = {
            employee_id: eid, employee_name: l.employee_name, department: l.department,
            earnings: [], deductions: [], employer_contributions: [],
            total_earnings: 0, total_deductions: 0, net_pay: 0,
          };
        }
        const entry = { code: l.paycode_code, name: l.paycode_name, amount: Number(l.amount) };
        if (l.paycode_type === "earning") {
          byEmp[eid].earnings.push(entry);
          byEmp[eid].total_earnings += entry.amount;
        } else if (l.paycode_type === "deduction") {
          byEmp[eid].deductions.push(entry);
          byEmp[eid].total_deductions += entry.amount;
        } else {
          byEmp[eid].employer_contributions.push(entry);
        }
      }
      for (const eid of Object.keys(byEmp)) {
        byEmp[eid].net_pay = byEmp[eid].total_earnings - byEmp[eid].total_deductions;
      }

      // Get employee bank info
      const empIds = Object.keys(byEmp);
      if (empIds.length > 0) {
        const emps = await sql`SELECT id, iban, bank_name, id_number FROM employees WHERE id = ANY(${empIds})`;
        for (const e of emps) {
          if (byEmp[e.id as string]) {
            byEmp[e.id as string].iban = e.iban;
            byEmp[e.id as string].bank_name = e.bank_name;
            byEmp[e.id as string].id_number = e.id_number;
          }
        }
      }

      return NextResponse.json({
        run,
        payslips: employee_id ? (byEmp[employee_id] || null) : Object.values(byEmp),
      });
    }

    // ── WPS SIF file generation ─────────────────────────────────────────────
    if (section === "wps_sif") {
      const run_id = searchParams.get("run_id");
      if (!run_id) return NextResponse.json({ error: "run_id required" }, { status: 400 });

      const [run] = await sql`SELECT * FROM payroll_runs WHERE id = ${Number(run_id)}`;
      if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

      // Get net pay per employee
      const lines = await sql`
        SELECT employee_id, employee_name, paycode_type, SUM(amount) as total
        FROM payroll_lines WHERE run_id = ${Number(run_id)}
        GROUP BY employee_id, employee_name, paycode_type
      `;
      const empTotals: Record<string, { name: string; earnings: number; deductions: number }> = {};
      for (const l of lines) {
        const eid = l.employee_id as string;
        if (!empTotals[eid]) empTotals[eid] = { name: l.employee_name as string, earnings: 0, deductions: 0 };
        if (l.paycode_type === "earning") empTotals[eid].earnings += Number(l.total);
        else if (l.paycode_type === "deduction") empTotals[eid].deductions += Number(l.total);
      }

      // Get employee bank data
      const empIds = Object.keys(empTotals);
      const emps = await sql`SELECT id, iban, bank_code, id_number, id_type FROM employees WHERE id = ANY(${empIds})`;
      const empMap: Record<string, any> = {};
      for (const e of emps) empMap[e.id as string] = e;

      // Build SIF file (MOL format)
      // Header: SIF, EDR (employer), MOL establishment ID, month, year, total records, total salary
      const totalNet = Object.values(empTotals).reduce((s, e) => s + (e.earnings - e.deductions), 0);
      let sif = "";
      // Header record
      sif += `SIF\t0000000000\t${String(run.period_month).padStart(2,"0")}\t${run.period_year}\t${empIds.length}\t${Math.round(totalNet)}\tSAR\n`;

      // Employee records
      for (const eid of empIds) {
        const emp = empMap[eid] || {};
        const net = empTotals[eid].earnings - empTotals[eid].deductions;
        const idType = emp.id_type === "national_id" ? "N" : "I";
        sif += `${emp.id_number || ""}\t${idType}\t${emp.bank_code || ""}\t${emp.iban || ""}\t${Math.round(empTotals[eid].earnings)}\t${Math.round(empTotals[eid].deductions)}\t${Math.round(net)}\n`;
      }

      return new Response(sif, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="WPS-SIF-${run.ref}.txt"`,
        },
      });
    }

    // ── GOSI Monthly Report ─────────────────────────────────────────────────
    if (section === "gosi_report") {
      const run_id = searchParams.get("run_id");
      if (!run_id) return NextResponse.json({ error: "run_id required" }, { status: 400 });

      const lines = await sql`
        SELECT pl.employee_id, pl.employee_name, pl.department, pl.paycode_code, pl.amount,
               e.nationality, e.id_number, e.basic_salary, e.housing_allowance
        FROM payroll_lines pl
        LEFT JOIN employees e ON e.id = pl.employee_id
        WHERE pl.run_id = ${Number(run_id)} AND pl.paycode_code IN ('GOSI_EMP', 'GOSI_CO')
        ORDER BY pl.employee_id
      `;

      const byEmp: Record<string, any> = {};
      for (const l of lines) {
        const eid = l.employee_id as string;
        if (!byEmp[eid]) {
          const insurable = Math.min((Number(l.basic_salary) || 0) + (Number(l.housing_allowance) || 0), 45000);
          byEmp[eid] = {
            employee_id: eid, employee_name: l.employee_name, department: l.department,
            nationality: l.nationality, id_number: l.id_number,
            insurable_salary: insurable,
            gosi_employee: 0, gosi_employer: 0,
          };
        }
        if (l.paycode_code === "GOSI_EMP") byEmp[eid].gosi_employee = Number(l.amount);
        if (l.paycode_code === "GOSI_CO") byEmp[eid].gosi_employer = Number(l.amount);
      }

      const employees = Object.values(byEmp);
      const totals = {
        total_insurable: employees.reduce((s: number, e: any) => s + e.insurable_salary, 0),
        total_employee: employees.reduce((s: number, e: any) => s + e.gosi_employee, 0),
        total_employer: employees.reduce((s: number, e: any) => s + e.gosi_employer, 0),
        total_combined: employees.reduce((s: number, e: any) => s + e.gosi_employee + e.gosi_employer, 0),
      };

      return NextResponse.json({ employees, totals });
    }

    // ── Salary history ──────────────────────────────────────────────────────
    if (section === "salary_history") {
      const employee_id = searchParams.get("employee_id");
      if (employee_id) {
        const rows = await sql`
          SELECT * FROM salary_history WHERE employee_id = ${employee_id}
          ORDER BY effective_date DESC
        `;
        return NextResponse.json(rows);
      }
      // All recent changes
      const rows = await sql`
        SELECT sh.*, e.name as employee_name FROM salary_history sh
        LEFT JOIN employees e ON e.id = sh.employee_id
        ORDER BY sh.effective_date DESC LIMIT 50
      `;
      return NextResponse.json(rows);
    }

    // ── Org chart ───────────────────────────────────────────────────────────
    if (section === "org_chart") {
      const rows = await sql`
        SELECT e.id, e.name, e.position, e.department, e.manager_id, e.grade,
               m.name as manager_name
        FROM employees e
        LEFT JOIN employees m ON m.id = e.manager_id
        ORDER BY e.department, e.name
      `;
      return NextResponse.json(rows);
    }

    // ── EOS provisions ──────────────────────────────────────────────────────
    if (section === "eos_provisions") {
      const employee_id = searchParams.get("employee_id");
      if (employee_id) {
        const rows = await sql`
          SELECT * FROM eos_provisions WHERE employee_id = ${employee_id}
          ORDER BY period_year DESC, period_month DESC
        `;
        return NextResponse.json(rows);
      }
      // Latest provision per employee
      const rows = await sql`
        SELECT DISTINCT ON (ep.employee_id) ep.*, e.name as employee_name, e.join_date
        FROM eos_provisions ep
        LEFT JOIN employees e ON e.id = ep.employee_id
        ORDER BY ep.employee_id, ep.period_year DESC, ep.period_month DESC
      `;
      return NextResponse.json(rows);
    }

    // ── Payroll adjustments for a run ────────────────────────────────────────
    if (section === "adjustments") {
      const run_id = searchParams.get("run_id");
      if (!run_id) return NextResponse.json({ error: "run_id required" }, { status: 400 });
      const rows = await sql`
        SELECT * FROM payroll_adjustments WHERE run_id = ${Number(run_id)}
        ORDER BY employee_id, paycode_code
      `;
      return NextResponse.json(rows);
    }

    // ── Overtime calculation ────────────────────────────────────────────────
    if (section === "overtime") {
      const employee_id = searchParams.get("employee_id");
      const month = searchParams.get("month");
      const year = searchParams.get("year");
      if (!employee_id || !month || !year) {
        return NextResponse.json({ error: "employee_id, month, year required" }, { status: 400 });
      }
      // Get attendance for the month
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      const records = await sql`
        SELECT * FROM attendance_records
        WHERE employee_id = ${employee_id} AND date LIKE ${prefix + "%"}
        ORDER BY date
      `;
      const [emp] = await sql`SELECT basic_salary FROM employees WHERE id = ${employee_id}`;
      const hourlyRate = ((Number(emp?.basic_salary) || 0) / 30) / 8;
      const otRate = hourlyRate * 1.5; // Saudi Labor Law Article 107

      let totalOtHours = 0;
      for (const r of records) {
        const cin = r.check_in as string;
        const cout = r.check_out as string;
        if (cin && cout) {
          const hrs = (new Date(`2000-01-01 ${cout}`).getTime() - new Date(`2000-01-01 ${cin}`).getTime()) / 3600000;
          if (hrs > 8) totalOtHours += hrs - 8;
        }
      }

      return NextResponse.json({
        employee_id, period: prefix,
        hourly_rate: Math.round(hourlyRate * 100) / 100,
        ot_rate: Math.round(otRate * 100) / 100,
        total_ot_hours: Math.round(totalOtHours * 100) / 100,
        total_ot_amount: Math.round(totalOtHours * otRate),
        records_count: records.length,
      });
    }

    // ── Probation alerts ────────────────────────────────────────────────────
    if (section === "probation_alerts") {
      const rows = await sql`
        SELECT e.id, e.name, e.department, e.position, e.join_date,
               c.probation_end, c.contract_type
        FROM employees e
        LEFT JOIN contracts c ON c.employee_id = e.id
        WHERE c.probation_end IS NOT NULL
        ORDER BY c.probation_end ASC
      `;
      const now = new Date();
      const alerts = (rows || []).map((r: any) => {
        const end = new Date(r.probation_end);
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
        return { ...r, days_left: daysLeft, is_urgent: daysLeft <= 7, is_warning: daysLeft <= 30 };
      });
      return NextResponse.json(alerts);
    }

    // ── Payroll anomaly detection ───────────────────────────────────────────
    if (section === "anomalies") {
      const run_id = searchParams.get("run_id");
      if (!run_id) return NextResponse.json({ error: "run_id required" }, { status: 400 });

      const [run] = await sql`SELECT * FROM payroll_runs WHERE id = ${Number(run_id)}`;
      if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

      // Find previous run
      const [prevRun] = await sql`
        SELECT * FROM payroll_runs
        WHERE id < ${Number(run_id)} AND status != 'cancelled'
        ORDER BY id DESC LIMIT 1
      `;

      const anomalies: any[] = [];

      if (prevRun) {
        // Compare per-employee totals
        const currLines = await sql`
          SELECT employee_id, employee_name, paycode_type, SUM(amount) as total
          FROM payroll_lines WHERE run_id = ${Number(run_id)}
          GROUP BY employee_id, employee_name, paycode_type
        `;
        const prevLines = await sql`
          SELECT employee_id, paycode_type, SUM(amount) as total
          FROM payroll_lines WHERE run_id = ${prevRun.id}
          GROUP BY employee_id, paycode_type
        `;

        const currMap: Record<string, Record<string, number>> = {};
        const nameMap: Record<string, string> = {};
        for (const l of currLines) {
          const eid = l.employee_id as string;
          if (!currMap[eid]) currMap[eid] = {};
          currMap[eid][l.paycode_type as string] = Number(l.total);
          nameMap[eid] = l.employee_name as string;
        }

        const prevMap: Record<string, Record<string, number>> = {};
        for (const l of prevLines) {
          const eid = l.employee_id as string;
          if (!prevMap[eid]) prevMap[eid] = {};
          prevMap[eid][l.paycode_type as string] = Number(l.total);
        }

        // Check for significant changes
        for (const eid of Object.keys(currMap)) {
          const currEarnings = currMap[eid].earning || 0;
          const prevEarnings = prevMap[eid]?.earning || 0;
          if (prevEarnings > 0) {
            const pctChange = ((currEarnings - prevEarnings) / prevEarnings) * 100;
            if (Math.abs(pctChange) > 10) {
              anomalies.push({
                type: pctChange > 0 ? "earnings_increase" : "earnings_decrease",
                severity: Math.abs(pctChange) > 30 ? "high" : "medium",
                employee_id: eid, employee_name: nameMap[eid],
                message: `Earnings changed by ${pctChange.toFixed(1)}% (${prevEarnings.toLocaleString()} → ${currEarnings.toLocaleString()})`,
                prev_amount: prevEarnings, curr_amount: currEarnings,
                pct_change: Math.round(pctChange * 10) / 10,
              });
            }
          }
          if (!prevMap[eid]) {
            anomalies.push({
              type: "new_employee",
              severity: "low",
              employee_id: eid, employee_name: nameMap[eid],
              message: `New employee in payroll (not in previous run)`,
            });
          }
        }
        for (const eid of Object.keys(prevMap)) {
          if (!currMap[eid]) {
            anomalies.push({
              type: "missing_employee",
              severity: "high",
              employee_id: eid, employee_name: eid,
              message: `Employee was in previous run but missing from current run`,
            });
          }
        }

        // Compare run totals
        const grossDiff = ((Number(run.total_gross) - Number(prevRun.total_gross)) / Number(prevRun.total_gross)) * 100;
        if (Math.abs(grossDiff) > 5) {
          anomalies.push({
            type: "total_variance",
            severity: Math.abs(grossDiff) > 20 ? "high" : "medium",
            message: `Total gross changed by ${grossDiff.toFixed(1)}% vs previous run`,
            prev_amount: Number(prevRun.total_gross), curr_amount: Number(run.total_gross),
            pct_change: Math.round(grossDiff * 10) / 10,
          });
        }
      }

      return NextResponse.json({ run_id: Number(run_id), compared_to: prevRun?.ref || null, anomalies });
    }

    // ── Employee self-service data ──────────────────────────────────────────
    if (section === "my_payslips") {
      const employee_id = searchParams.get("employee_id");
      if (!employee_id) return NextResponse.json({ error: "employee_id required" }, { status: 400 });

      const runs = await sql`
        SELECT DISTINCT pr.id, pr.ref, pr.period_label, pr.period_month, pr.period_year, pr.status
        FROM payroll_runs pr
        INNER JOIN payroll_lines pl ON pl.run_id = pr.id
        WHERE pl.employee_id = ${employee_id} AND pr.status != 'cancelled'
        ORDER BY pr.period_year DESC, pr.period_month DESC
      `;
      return NextResponse.json(runs);
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
    // ── Add payroll adjustment ──────────────────────────────────────────────
    if (action === "add_adjustment") {
      const { run_id, employee_id, paycode_code, amount, reason } = body;
      // Look up paycode
      const [pc] = await sql`SELECT * FROM paycodes WHERE code = ${paycode_code}`;
      if (!pc) return NextResponse.json({ error: "Paycode not found" }, { status: 404 });
      // Look up employee name
      const [emp] = await sql`SELECT name FROM employees WHERE id = ${employee_id}`;

      const [row] = await sql`
        INSERT INTO payroll_adjustments
          (run_id, employee_id, employee_name, paycode_id, paycode_code, paycode_name,
           paycode_type, amount, gl_debit_account, gl_credit_account, reason)
        VALUES
          (${run_id}, ${employee_id}, ${emp?.name || employee_id}, ${pc.id}, ${pc.code}, ${pc.name},
           ${pc.paycode_type}, ${amount}, ${pc.gl_debit_account || ""}, ${pc.gl_credit_account || ""}, ${reason || ""})
        RETURNING *
      `;

      // Also insert into payroll_lines so it's included in JV
      await sql`
        INSERT INTO payroll_lines
          (run_id, employee_id, employee_name, department, paycode_id, paycode_code,
           paycode_name, paycode_type, amount, gl_debit_account, gl_credit_account)
        VALUES
          (${run_id}, ${employee_id}, ${emp?.name || ""}, '',
           ${pc.id}, ${pc.code}, ${pc.name}, ${pc.paycode_type},
           ${amount}, ${pc.gl_debit_account || ""}, ${pc.gl_credit_account || ""})
      `;

      // Recalculate run totals
      const totals = await sql`
        SELECT paycode_type, SUM(amount) as total FROM payroll_lines
        WHERE run_id = ${run_id} GROUP BY paycode_type
      `;
      let gross = 0, ded = 0, gosiEmp = 0, gosiEr = 0;
      for (const t of totals) {
        if (t.paycode_type === "earning") gross += Number(t.total);
        else if (t.paycode_type === "deduction") ded += Number(t.total);
      }
      // Separate GOSI from payroll_lines
      const gosiTotals = await sql`
        SELECT paycode_code, SUM(amount) as total FROM payroll_lines
        WHERE run_id = ${run_id} AND paycode_code IN ('GOSI_EMP', 'GOSI_CO')
        GROUP BY paycode_code
      `;
      for (const g of gosiTotals) {
        if (g.paycode_code === "GOSI_EMP") gosiEmp = Number(g.total);
        if (g.paycode_code === "GOSI_CO") gosiEr = Number(g.total);
      }

      await sql`
        UPDATE payroll_runs SET
          total_gross = ${gross}, total_deductions = ${ded},
          total_net = ${gross - ded},
          total_gosi_employee = ${gosiEmp}, total_gosi_employer = ${gosiEr}
        WHERE id = ${run_id}
      `;

      return NextResponse.json(row);
    }

    if (action === "delete_adjustment") {
      const { id, run_id } = body;
      // Get the adjustment to find amount
      const [adj] = await sql`SELECT * FROM payroll_adjustments WHERE id = ${id}`;
      if (adj) {
        // Remove matching payroll_line
        await sql`
          DELETE FROM payroll_lines
          WHERE run_id = ${adj.run_id} AND employee_id = ${adj.employee_id}
            AND paycode_code = ${adj.paycode_code} AND amount = ${adj.amount}
        `;
      }
      await sql`DELETE FROM payroll_adjustments WHERE id = ${id}`;

      // Recalculate
      if (run_id || adj?.run_id) {
        const rid = run_id || adj.run_id;
        const totals = await sql`
          SELECT paycode_type, SUM(amount) as total FROM payroll_lines
          WHERE run_id = ${rid} GROUP BY paycode_type
        `;
        let gross = 0, ded = 0;
        for (const t of totals) {
          if (t.paycode_type === "earning") gross += Number(t.total);
          else if (t.paycode_type === "deduction") ded += Number(t.total);
        }
        await sql`UPDATE payroll_runs SET total_gross=${gross}, total_deductions=${ded}, total_net=${gross-ded} WHERE id=${rid}`;
      }
      return NextResponse.json({ ok: true });
    }

    // ── Post payroll (auto-decrement loans) ─────────────────────────────────
    if (action === "post_payroll") {
      const { run_id } = body;
      const [run] = await sql`SELECT * FROM payroll_runs WHERE id = ${run_id}`;
      if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
      if (run.status !== "approved") {
        return NextResponse.json({ error: "Run must be approved before posting" }, { status: 400 });
      }

      // Decrement active loans for employees in this run
      const loanLines = await sql`
        SELECT employee_id, paycode_code, amount FROM payroll_lines
        WHERE run_id = ${run_id} AND paycode_code IN ('LOAN_DED', 'ADV_DED') AND amount > 0
      `;

      for (const ll of loanLines) {
        const isAdvance = ll.paycode_code === "ADV_DED";
        const loanType = isAdvance ? "%advance%" : "%";
        // Update the oldest active loan of matching type
        await sql`
          UPDATE loans SET
            remaining = GREATEST(remaining - ${Number(ll.amount)}, 0),
            installments_left = GREATEST(installments_left - 1, 0),
            status = CASE WHEN GREATEST(installments_left - 1, 0) = 0 THEN 'completed' ELSE status END
          WHERE id = (
            SELECT id FROM loans
            WHERE employee_id = ${ll.employee_id}
              AND status IN ('active', 'approved')
              AND installments_left > 0
              AND LOWER(loan_type) LIKE ${isAdvance ? '%advance%' : '%'}
              AND (${isAdvance} OR LOWER(loan_type) NOT LIKE '%advance%')
            ORDER BY id ASC LIMIT 1
          )
        `;
      }

      // Calculate EOS provisions for all employees
      const emps = await sql`
        SELECT id, basic_salary, join_date FROM employees
      `;
      const month = Number(run.period_month);
      const year = Number(run.period_year);
      for (const emp of emps) {
        const joinDate = new Date(emp.join_date as string);
        const periodEnd = new Date(year, month - 1, 28);
        const yearsOfService = (periodEnd.getTime() - joinDate.getTime()) / (365.25 * 86400000);
        const basic = Number(emp.basic_salary) || 0;

        // Saudi Labor Law EOS: first 5 years = 0.5 month per year, after = 1 month per year
        let eosTotal = 0;
        if (yearsOfService <= 5) {
          eosTotal = (basic / 2) * yearsOfService;
        } else {
          eosTotal = (basic / 2) * 5 + basic * (yearsOfService - 5);
        }
        const monthlyProvision = eosTotal / Math.max(yearsOfService * 12, 1);

        try {
          await sql`
            INSERT INTO eos_provisions (employee_id, period_month, period_year, years_of_service,
              monthly_basic, monthly_provision, cumulative_provision)
            VALUES (${emp.id}, ${month}, ${year}, ${Math.round(yearsOfService * 100) / 100},
              ${basic}, ${Math.round(monthlyProvision)}, ${Math.round(eosTotal)})
            ON CONFLICT (employee_id, period_month, period_year)
            DO UPDATE SET years_of_service = EXCLUDED.years_of_service,
              monthly_provision = EXCLUDED.monthly_provision,
              cumulative_provision = EXCLUDED.cumulative_provision
          `;
        } catch (_) { /* skip */ }
      }

      // Mark as posted
      const [updated] = await sql`
        UPDATE payroll_runs SET status = 'posted', posted_at = NOW()
        WHERE id = ${run_id} RETURNING *
      `;

      return NextResponse.json(updated);
    }

    // ── Record salary change ────────────────────────────────────────────────
    if (action === "record_salary_change") {
      const { employee_id, effective_date, change_type, new_basic, new_housing, new_transport, reason, approved_by } = body;

      const [emp] = await sql`
        SELECT basic_salary, housing_allowance, transport_allowance FROM employees WHERE id = ${employee_id}
      `;
      if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

      const oldBasic = Number(emp.basic_salary) || 0;
      const oldHousing = Number(emp.housing_allowance) || 0;
      const oldTransport = Number(emp.transport_allowance) || 0;
      const oldTotal = oldBasic + oldHousing + oldTransport;
      const newTotal = (new_basic || oldBasic) + (new_housing || oldHousing) + (new_transport || oldTransport);
      const pctChange = oldTotal > 0 ? ((newTotal - oldTotal) / oldTotal) * 100 : 0;

      // Record history
      const [row] = await sql`
        INSERT INTO salary_history
          (employee_id, effective_date, change_type, old_basic, new_basic,
           old_housing, new_housing, old_transport, new_transport,
           old_total, new_total, percentage_change, reason, approved_by)
        VALUES
          (${employee_id}, ${effective_date}, ${change_type || "increment"},
           ${oldBasic}, ${new_basic || oldBasic},
           ${oldHousing}, ${new_housing || oldHousing},
           ${oldTransport}, ${new_transport || oldTransport},
           ${oldTotal}, ${newTotal}, ${Math.round(pctChange * 10) / 10},
           ${reason || ""}, ${approved_by || "admin"})
        RETURNING *
      `;

      // Update employee record
      await sql`
        UPDATE employees SET
          basic_salary = ${new_basic || oldBasic},
          housing_allowance = ${new_housing || oldHousing},
          transport_allowance = ${new_transport || oldTransport}
        WHERE id = ${employee_id}
      `;

      return NextResponse.json(row);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
