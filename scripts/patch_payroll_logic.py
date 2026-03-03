"""Replace run_payroll block with corrected version:
- GOSI rates from policy table (9.75% Saudi, 0% non-Saudi)
- Nationality-aware GOSI calculation
- Loan deductions from loans table
- Advance salary deductions from loans table
"""
import sys
sys.stdout.reconfigure(encoding="utf-8")

path = r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\paycodes\route.ts"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find start and end of run_payroll block (lines 143-230, 0-indexed = 142-229)
start = None
end = None
for i, line in enumerate(lines):
    if 'if (action === "run_payroll")' in line:
        start = i
    if start and i > start and 'if (action === "approve_payroll")' in line:
        end = i
        break

print(f"Found run_payroll block: lines {start+1}–{end} (0-indexed {start}–{end-1})")

NEW_BLOCK = '''    if (action === "run_payroll") {
      const { period_month, period_year, notes } = body;
      const monthNames = ["January","February","March","April","May","June",
                          "July","August","September","October","November","December"];
      const periodLabel = `${monthNames[period_month - 1]} ${period_year}`;
      const ref = `PR-${period_year}-${String(period_month).padStart(2, "0")}`;

      // Duplicate check
      const existing = await sql`SELECT id FROM payroll_runs WHERE ref = ${ref}`;
      if (existing.length > 0) {
        return NextResponse.json({ error: `Payroll run ${ref} already exists` }, { status: 409 });
      }

      // ── 1. GOSI rates from policy table ───────────────────────────────────────
      let gosiEmpRateSaudi = 0.0975;   // 9.75% default (annuities 9% + SANED 0.75%)
      let gosiErRateSaudi  = 0.1175;   // 11.75% default
      let gosiErRateNonSaudi = 0.02;   // 2.0% occupational hazards only
      let maxInsurable = 45000;
      let minInsurable = 1500;
      try {
        const [gosiPolicy] = await sql\`SELECT config FROM policies WHERE category = 'gosi'\`;
        if (gosiPolicy?.config) {
          const cfg = gosiPolicy.config as any;
          gosiEmpRateSaudi    = (cfg.employee_rate    || 9.75)  / 100;
          gosiErRateSaudi     = (cfg.employer_rate    || 11.75) / 100;
          gosiErRateNonSaudi  = (cfg.non_saudi_employer_rate || 2.0) / 100;
          maxInsurable        = cfg.max_insurable_salary || 45000;
          minInsurable        = cfg.min_insurable_salary || 1500;
        }
      } catch (_) { /* use defaults */ }

      // ── 2. All employees (with nationality for GOSI) ──────────────────────────
      const employees = await sql\`
        SELECT id, name, department, nationality,
               basic_salary, housing_allowance, transport_allowance
        FROM employees
      \`;

      // ── 3. Active loan deductions per employee ────────────────────────────────
      // Separate regular loans from advance salary for different paycodes
      const loanRows = await sql\`
        SELECT employee_id, loan_type, monthly_installment
        FROM loans
        WHERE status IN ('active', 'approved') AND installments_left > 0
      \`;
      type LoanMap = Record<string, { loan: number; advance: number }>;
      const loanMap: LoanMap = {};
      for (const lr of loanRows) {
        const eid = lr.employee_id as string;
        if (!loanMap[eid]) loanMap[eid] = { loan: 0, advance: 0 };
        const isAdvance = String(lr.loan_type).toLowerCase().includes("advance");
        if (isAdvance) {
          loanMap[eid].advance += Number(lr.monthly_installment) || 0;
        } else {
          loanMap[eid].loan += Number(lr.monthly_installment) || 0;
        }
      }

      // ── 4. Fetch paycodes ─────────────────────────────────────────────────────
      const paycodes = await sql\`SELECT * FROM paycodes WHERE is_active = true ORDER BY sort_order\`;

      // ── 5. Create payroll run header ──────────────────────────────────────────
      const [run] = await sql\`
        INSERT INTO payroll_runs (ref, period_label, period_month, period_year, employee_count, notes)
        VALUES (${ref}, ${periodLabel}, ${period_month}, ${period_year}, ${employees.length}, ${notes || ""})
        RETURNING *
      \`;

      let totalGross = 0, totalDeductions = 0, totalGosiEmp = 0, totalGosioEr = 0;

      // ── 6. Build payroll lines per employee ───────────────────────────────────
      for (const emp of employees) {
        const basic     = Number(emp.basic_salary)        || 0;
        const housing   = Number(emp.housing_allowance)   || 0;
        const transport = Number(emp.transport_allowance) || 0;

        // GOSI: nationality-aware rates
        const isSaudi   = String(emp.nationality || "").toLowerCase().includes("saudi");
        const insurable = Math.min(Math.max(basic + housing, minInsurable), maxInsurable);
        const gosiEmp   = isSaudi ? Math.round(insurable * gosiEmpRateSaudi) : 0;
        const gosiEr    = isSaudi
          ? Math.round(insurable * gosiErRateSaudi)
          : Math.round(insurable * gosiErRateNonSaudi);

        // Loan / advance deductions
        const loanDed    = loanMap[emp.id as string]?.loan    || 0;
        const advanceDed = loanMap[emp.id as string]?.advance || 0;

        // Accumulate run totals
        totalGross       += basic + housing + transport;
        totalGosiEmp     += gosiEmp;
        totalGosioEr     += gosiEr;
        totalDeductions  += gosiEmp + loanDed + advanceDed;

        // Map paycode codes → amounts for this employee
        const amountMap: Record<string, number> = {
          BASIC:     basic,
          HOUSING:   housing,
          TRANSPORT: transport,
          GOSI_EMP:  gosiEmp,
          GOSI_CO:   gosiEr,
          LOAN_DED:  loanDed,
          ADV_DED:   advanceDed,
        };

        for (const pc of paycodes) {
          const amount = amountMap[pc.code as string];
          if (amount === undefined || amount === 0) continue;
          await sql\`
            INSERT INTO payroll_lines
              (run_id, employee_id, employee_name, department, paycode_id, paycode_code,
               paycode_name, paycode_type, amount, gl_debit_account, gl_credit_account)
            VALUES
              (${run.id}, ${emp.id}, ${emp.name}, ${emp.department || ""},
               ${pc.id}, ${pc.code}, ${pc.name}, ${pc.paycode_type},
               ${amount}, ${pc.gl_debit_account || ""}, ${pc.gl_credit_account || ""})
          \`;
        }
      }

      // ── 7. Update run totals ──────────────────────────────────────────────────
      const totalNet = totalGross - totalDeductions;
      const [updated] = await sql\`
        UPDATE payroll_runs SET
          total_gross        = ${totalGross},
          total_deductions   = ${totalDeductions},
          total_net          = ${totalNet},
          total_gosi_employee = ${totalGosiEmp},
          total_gosi_employer = ${totalGosioEr},
          status             = 'draft'
        WHERE id = ${run.id}
        RETURNING *
      \`;

      return NextResponse.json(updated);
    }

'''

# Replace lines start..end-1 with new block
new_lines = lines[:start] + [NEW_BLOCK] + lines[end:]

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"Replaced lines {start+1}–{end} with corrected run_payroll block")
print("Done!")
