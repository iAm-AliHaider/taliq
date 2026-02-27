# Taliq (تَلِيق) — Complete Feature Map

**Target:** Replace MRNA Intranet Portal (18 modules) with voice-first AI HR platform
**ERP Integration:** Microsoft Dynamics 365 Business Central v23.0 (ON-PREMISE, OData v4 + SOAP + AL API + Webhooks)
**Market:** Middle East / Saudi Arabia (GOSI, SIMAH, WPS, Hijri, bilingual AR+EN)

---

## Module 1: Employee Self-Service (ESS) — P0 ✅ Partially Built

### 1.1 Leave Management ✅ Built
- View leave balance (annual, sick, emergency, study, etc.)
- Apply for leave with date picker + document upload
- Leave approval status tracking
- Leave resumption (early/late)
- Leave encashment request
- Leave adjustment request
- **Voice:** "What's my leave balance?" / "Apply for 5 days annual leave starting Sunday"

### 1.2 Pay Slip ✅ Built
- View monthly pay slip (basic, allowances, deductions, net)
- Download PDF
- Historical pay slips
- **Voice:** "Show me my pay slip" / "Download January salary"

### 1.3 Employee Profile ✅ Built
- View/update personal information
- Emergency contacts
- Bank details (IBAN)
- Dependents
- **Voice:** "Show my profile" / "Update my phone number"

### 1.4 Attendance & Time Recording — P1
- Clock in/out (mobile + portal)
- View daily/weekly/monthly attendance
- Exception alerts (late, early departure, absent)
- Overtime request and tracking
- Shift schedule view
- Location-based check-in (geofencing)
- **Voice:** "Clock me in" / "Show my attendance this week" / "Request 2 hours overtime for yesterday"
- **BC Integration:** Sync attendance records, overtime → payroll

### 1.5 Loan Application — P1
- Interest-free loan request (max 2x basic, 12 months)
- Interest-bearing loan request (per credit policy)
- Advance salary request
- Loan balance and repayment schedule
- Eligibility auto-check (service period, eval score, existing loans)
- **Voice:** "Apply for a loan" / "What's my loan balance?" / "Am I eligible for advance salary?"
- **BC Integration:** Loan disbursement, payroll deduction setup

### 1.6 Document Requests — P1
- Request salary certificate
- Request experience certificate
- Request job salary certificate
- Other HR document requests
- Digital document download
- **Voice:** "I need a salary certificate" / "Request experience letter"

### 1.7 Expense Claims — P2
- Submit expense report with receipt upload
- Categorize expenses
- Track reimbursement status
- **Voice:** "Submit expense claim for 500 SAR" / "Check my expense claim status"
- **BC Integration:** Expense reimbursement processing

### 1.8 Self Permissions & Work Permissions — P2
- Request permission to leave early / arrive late
- Work from home requests
- **Voice:** "Request permission to leave at 3 PM today"

### 1.9 Digital Signature — P2
- Sign documents digitally within portal
- Track pending signatures

### 1.10 Surveys & KPI Review — P2
- Participate in employee surveys
- View KPI targets and self-evaluate
- Accept/review KPI scores
- **Voice:** "Show my KPIs" / "What's my performance rating?"

---

## Module 2: AI Interviewer — P1 🔨 80% Built

### 2.1 Interview Management
- AI-powered voice interviews with live scoring
- Timer-based question flow
- Competency-based questioning
- Behavioral assessment
- Multi-stage: HR screening → Technical → Hiring manager → Leadership
- Standardized evaluation forms and rating matrices
- **Voice:** Full voice-driven interview experience

### 2.2 Candidate Pipeline
- Track candidates through stages
- Auto-screening (qualification matching, CV parsing)
- Interview scheduling
- Candidate comparison dashboard

---

## Module 3: Manager Dashboard — P2

### 3.1 Team Attendance
- Real-time team attendance view
- Exception handling (approve late arrivals, absences)
- Overtime approval
- **Voice:** "Show team attendance" / "Approve Ahmed's overtime"

### 3.2 Approval Queue ✅ Built
- Pending leave approvals
- Pending loan approvals
- Pending expense claims
- Pending status changes
- Pending travel requests
- **Voice:** "Show pending approvals" / "Approve Fatima's leave"

### 3.3 Performance Management
- Conduct probation evaluations (90/180 days)
- Annual performance evaluations with KPIs
- Department CAP enforcement
- Rating calibration
- **Voice:** "Start evaluation for Mohammed" / "Show team performance scores"

### 3.4 Team Overview
- Org chart and reporting structure
- Department headcount
- Leave calendar (team availability)
- **Voice:** "Who's on leave this week?" / "Show department headcount"

### 3.5 Manpower Planning
- Annual manpower request (December workflow)
- New position justification
- Budget allocation
- **Voice:** "Create manpower request for 2 developers"

---

## Module 4: HR Admin — P2

### 4.1 Employee Onboarding
- Pre-boarding checklist (automatic):
  - AML inquiry, SIMAH check
  - IT equipment preparation
  - Email/accounts creation
  - Medical checkup scheduling
  - Contract generation
  - Insurance registration (life + medical)
  - GOSI registration
  - Code of Conduct + NDA + Cyber NDA
  - AMN Clearance Certificate
  - Access card preparation
- First day orientation program
- Training assignment (AML, Anti-fraud, Credit advisor mandatory)
- Probation tracking (90/180 days)
- Auto-announcement for C-Level joins
- **Voice:** "Start onboarding for new hire Ahmed" / "What's the onboarding status for Fatima?"
- **BC Integration:** Create employee record, payroll setup

### 4.2 Employee Exit (Offboarding)
- Resignation/termination processing
- Knowledge transfer checklist
- Auto-notifications:
  - HR: bank commitment check
  - Compliance: C-Level exits
  - Security: revoke access card
  - Cyber Security: notify
  - Risk Department: notify
  - IT: close email, accounts, attendance
  - Operations: collect phones/SIM cards
- Auto Exit Interview Survey
- Auto-announcement for C-Level departures
- Clearance letter (only after all tasks complete)
- Final settlement calculation (salary + EOS + leave + notice - deductions)
- GOSI & GIWA removal
- **Voice:** "Start exit process for employee 1234" / "What's the clearance status?"
- **BC Integration:** Final settlement processing, remove from payroll

### 4.3 Employee Status Changes
- Promotions (with salary scale compliance)
- Transfers (inter-department, inter-branch)
- Contract modifications
- Grade changes
- Family status updates
- Location changes
- Auto-notify when employee reaches position time limit for promotion
- **Voice:** "Process promotion for Sarah" / "Transfer Ahmed to Riyadh branch"
- **BC Integration:** Update employee record, payroll adjustments

### 4.4 Salary Change & Pay Management
- Salary change requests (promotion, market adjustment)
- Pay stoppage requests
- Bonus generation
- Advance salary processing
- **BC Integration:** Payroll updates, salary scale sync

### 4.5 Announcements Management
- Create announcements with templates
- 2-level approval workflow
- Multi-channel distribution (portal + email + messaging)
- Employee acknowledgment tracking (95% target in 48h)
- Mandatory reading with reminders/escalation
- **Voice:** "Create announcement about new policy" / "How many acknowledged the last announcement?"

---

## Module 5: Performance & Compensation — P2

### 5.1 KPI & Evaluation
- Probation evaluation (auto-triggered at 2 months)
- Annual evaluation cycle:
  - Mid-Nov: Portal notifies HODs to prepare KPIs
  - Employee KPI acceptance
  - Dec: Portal notifies HODs to conduct evaluations
- Department CAP enforcement
- 360° evaluation for succession planning
- Rating scale: Excellence (90%+), Very Good (75-89%), Good (60-74%), Poor (<60%)
- **BC Integration:** Sync evaluation scores, trigger compensation changes

### 5.2 Compensation Processing
- Auto-increment based on rating:
  - Excellence: 10% cap, 7% increment
  - Very Good: 20% cap, 5% increment
  - Good: 3% increment
  - Poor: 0%
- Bonus calculation and distribution
- Sales & Collection commission processing
- **BC Integration:** Salary adjustments, bonus disbursement

### 5.3 Salary Scale Management
- Grades 30-40, Levels 3-7
- Promotion timeline tracking:
  - Clerk→Officer (4yr), Officer→Sr Officer (3yr), Sr Officer→Supervisor (4yr), etc.
- Auto-notification when employee reaches position time limit
- **BC Integration:** Grade/level sync, salary scale tables

---

## Module 6: Recruitment & Talent — P2

### 6.1 Manpower Planning
- Annual planning (Dec 1 notification to all HODs)
- Position justification and budget
- Approval: HOD → CHRO → MD
- Vacant position auto-creation on resignation/termination

### 6.2 Job Posting & Distribution
- Auto-integration with company website
- Internal job board announcements
- External platform posting
- Employee referral program

### 6.3 Candidate Management
- CV search and parsing
- Multi-stage screening:
  - C-Level: Security background + SIMAH + Reputation
  - Standard: Qualification matching, skills assessment
- Interview scheduling and management
- Evaluation forms and rating matrices
- Offer generation per salary scale
- Auto IT/Security prep on offer acceptance
- **Voice:** "Show candidates for the developer position" / "Schedule interview with Ahmed"

### 6.4 Succession Planning
- Applicable to 13+ C-Level positions
- Eligibility: Excellence eval + 360° + 1yr min + DM recommendation
- Gap analysis and training plan
- CHRO approval → MD final

---

## Module 7: Operations & Compliance — P2

### 7.1 Asset Management
- Full lifecycle: Acquisition → Assignment → Maintenance → Return → Disposal
- Asset types: IT Equipment, Vehicles, Office Equipment
- Digital custody forms with signatures
- Asset condition tracking
- Reports: Asset Type + Employee + Date + Acceptance
- **BC Integration:** Asset register sync, depreciation

### 7.2 Document Management (DMS)
- Classification: Public, Internal, Confidential, Restricted
- Version control and metadata
- Retention rules (ZATCA compliant):
  - Employee files: 10yr after termination
  - Payroll: 10yr, Training: 5yr, Accounting: 10yr
- Access control with audit trails
- Archival and disposal workflow
- **Voice:** "Find the latest attendance policy" / "Upload employee contract"

### 7.3 Training & Development
- Training Needs Analysis (annual)
- Course management:
  - Employee apply → HOD → HR → Course search → HOD check → CHRO → Procurement → Finance → CHRO final
- LMS integration
- Mandatory compliance training (AML, InfoSec, Code of Conduct, Labor Law)
- Certificate tracking
- Post-training evaluation and ROI
- **Voice:** "Apply for AML training course" / "Show my training certificates"

### 7.4 Grievance & Suggestion System
- Anonymous grievance reporting
- Suggestion box with evaluation framework
- Neutral investigation team
- Innovation reward mechanism
- KPI: <5 days grievance resolution, 20% suggestion implementation

---

## Module 8: Travel & Expense — P2

### 8.1 Travel Management
- Business travel request and approval
- Per diem by grade:
  - Chairman/MD: Intl 3500 SAR/day, Local 2000 SAR/day
  - C-Levels: Intl 1750 SAR/day, Local 1200 SAR/day
  - Others: Intl 1350 SAR/day, Local 900 SAR/day
- Max 5 days; >5 days = mission (accommodation + 200 SAR/day)
- Travel advance and settlement
- **Voice:** "Request business trip to Jeddah" / "Submit travel expenses"
- **BC Integration:** Travel advance, expense reimbursement

### 8.2 Visa Management
- Exit Re-Entry, Single Entry, Multiple Entry, Business Visit
- Auto eligibility check
- Department and HR approval workflow
- Document tracking
- **Voice:** "Request exit re-entry visa" / "Check visa status"

### 8.3 Vacation Travel
- Annual leave ticket entitlement (non-Saudi: employee + wife + 2 kids for >12 days)
- Coordination with leave management

---

## Module 9: Saudi-Specific & Integrations — P3

### 9.1 GOSI Integration
- Employee registration on hire
- Employee removal on exit
- Monthly contribution sync
- End of service calculation
- **BC Integration:** GOSI deduction sync

### 9.2 SIMAH Integration
- Credit checks for loan applications
- New hire screening (especially C-Levels)

### 9.3 WPS (Wage Protection System)
- Monthly WPS file generation for salary disbursement
- Bank format compliance (e.g., Riyad Bank WPS format)
- **BC Integration:** Payroll → WPS file generation

### 9.4 ZATCA Compliance
- Document retention per ZATCA guidelines
- VAT considerations on travel/expense

### 9.5 Bilingual Support (Arabic + English)
- Full RTL Arabic interface
- Arabic TTS for voice interactions
- Hijri calendar support alongside Gregorian
- Ramadan timing adjustments for attendance

### 9.6 Allowances Management
- Repeatable allowances: Vehicle, Mobile, Communication, Transportation, Meal, Housing
- Auto-calculation based on role/grade
- Prorated for partial periods
- Quarterly eligibility review
- **BC Integration:** Allowance disbursement through payroll

---

## Business Central Integration Strategy (ON-PREMISE)

> **Client runs BC On-Premise, NOT SaaS/Cloud.**
> No cloud API endpoints. Integration uses on-prem web services.

### Architecture Options

#### Option A: BC OData/SOAP Web Services (MVP)
- BC On-Premise exposes OData v4 and SOAP web services natively
- Admin publishes specific pages/codeunits as web services in BC
- Auth: NTLM (Windows) or NavUserPassword
- Requires VPN/tunnel if Taliq is cloud-hosted

#### Option B: On-Prem API Gateway (Production)
- Deploy lightweight API gateway (Node.js/Python) on-premise alongside BC
- Gateway exposes REST endpoints, translates to BC OData/SOAP
- Taliq Cloud <-> Gateway (HTTPS) <-> BC On-Premise
- Decouples auth, enables caching, rate limiting

#### Option C: Custom AL API Pages (Best Long-Term)
- AL extensions with custom API pages per integration point
- Clean REST: /api/taliq/v1.0/employees
- Full control over data shape + business logic
- Requires BC/AL developer

### Network Topology
`
Taliq Cloud (Vercel) <--HTTPS/VPN--> On-Prem Gateway (Node.js)
                                          |
                                     OData/SOAP
                                          |
                                   BC On-Premise (SQL Server)
`

### On-Premise BC Endpoints
`
OData v4: https://{bc-server}:{port}/{instance}/ODataV4/Company(MRNA)/
SOAP:     https://{bc-server}:{port}/{instance}/WS/MRNA/
Custom:   https://{bc-server}:{port}/{instance}/api/taliq/v1.0/
Ports:    7048 (OData), 7047 (SOAP), 7046 (Client)
`

### Authentication (On-Premise)
- NTLM (Windows Auth) — most common
- NavUserPassword — BC-specific credentials
- Basic Auth over HTTPS — simplest
- Service account recommended for integration

### Read Operations (from BC)
- Employee master data (name, ID, grade, department, position)
- Salary scale and grade structure
- Leave balances and history
- Loan balances and repayment schedules
- Attendance records
- Asset register
- Payroll data (pay slips)
- Allowance configurations

### Write Operations (to BC)
- New employee creation (onboarding)
- Employee updates (status changes, promotions, transfers)
- Leave requests and approvals
- Loan applications and disbursements
- Expense claims and reimbursements
- Attendance records sync
- Salary adjustments
- Final settlement processing (exit)
- Asset assignments and returns

### Event Sync (BC23 supports webhooks!)
- **BC Subscription Webhooks**: Register webhook subscriptions via /api/v2.0/subscriptions — BC pushes change notifications to Taliq endpoint
- **BC Job Queue**: Scheduled AL codeunit for custom event triggers
- **Polling (fallback)**: Gateway polls OData if webhooks unreliable

### Deployment Requirements
- Gateway on same network as BC server (or VPN)
- HTTPS certificate required
- Firewall: gateway -> BC on port 7048/7047
- Azure Relay/Hybrid Connection if Taliq must stay cloud-only
- BC service account with read/write on published pages

---

## Priority Matrix

| Priority | Module | Status | Effort |
|----------|--------|--------|--------|
| **P0** | ESS (Leave, PaySlip, Profile) | ✅ Built | Done |
| **P1** | AI Interviewer | 🔨 80% | 1 week |
| **P1** | Attendance & Time Recording | 📋 Planned | 2 weeks |
| **P1** | Loan Management | 📋 Planned | 1 week |
| **P1** | Document Requests | 📋 Planned | 3 days |
| **P2** | Manager Dashboard | 📋 Planned | 2 weeks |
| **P2** | HR Admin (Onboarding/Exit) | 📋 Planned | 3 weeks |
| **P2** | Performance & Compensation | 📋 Planned | 2 weeks |
| **P2** | Recruitment & Talent | 📋 Planned | 2 weeks |
| **P2** | Operations & Compliance | 📋 Planned | 3 weeks |
| **P2** | Travel & Expense | 📋 Planned | 2 weeks |
| **P3** | BC Integration Layer | 📋 Planned | 3 weeks |
| **P3** | Saudi-Specific (GOSI, WPS, SIMAH) | 📋 Planned | 2 weeks |
| **P3** | Bilingual + Hijri | 📋 Planned | 1 week |

---

## Competitive Advantage Over MRNA Portal

1. **Voice-First**: Every feature accessible via voice — nobody else has this
2. **AI Interviewer**: Voice + visual interview — unique in the market
3. **Generative UI**: Dynamic cards/forms appear based on voice context
4. **Mobile-First PWA**: No app install needed
5. **BC Integration**: Same ERP backend, better UX
6. **Real-time**: WebSocket-driven, instant updates
7. **Smart Automation**: AI-powered workflows vs manual routing

---

*Updated: 2026-02-27*
*Source: MRNA Intranet Portal BBP Document (138 pages)*
