# Taliq — تَلِيق — Voice-First HR Platform

## Vision
An eloquent voice-first HR agent that **speaks** to employees and candidates while **rendering interactive UI** in real-time. No portals, no ticket systems — just talk.

Employee: "I need leave next Thursday" → Taliq shows pre-filled leave form → employee confirms → done.
Candidate joins → Taliq conducts structured interview → shows evaluation → generates report.
Manager: "Show me my team's attendance" → dashboard renders on screen.

## Brand
- **Name:** Taliq (تَلِيق — eloquent, articulate in Arabic)
- **Market:** Middle East, Arabic-first with English support
- **Colors:** Emerald (#10B981) + Gold (#F59E0B) on dark (#0A0F1A)
- **Vibe:** Professional, warm, Arabic geometric patterns, RTL support

## Modules

### 1. Employee Self-Service
- Leave requests (annual, sick, emergency)
- Leave balance check
- Personal info update
- Pay slip viewer
- Document requests (salary certificate, experience letter)

### 2. AI Interviewer
- Structured interview based on job description
- Behavioral + technical questions
- Real-time scoring rubric on screen
- Timer per question
- Evaluation report generation

### 3. Recruiter Dashboard
- Candidate pipeline view
- Job posting cards
- Interview scheduling
- Candidate comparison

### 4. HR Manager
- Team attendance dashboard
- Approval queue (leave, expenses, overtime)
- Headcount analytics
- Onboarding progress tracker

## Tech Stack
| Layer | Technology | Cost |
|-------|-----------|------|
| STT | Deepgram Nova-3 | Cloud (metered) |
| LLM | GPT-4o-mini | Cloud ($0.15/1M) |
| TTS (English) | Kokoro via Speaches | Local, $0 |
| TTS (Arabic) | Edge TTS (ar-SA-ZariyahNeural) | Free |
| Voice Transport | LiveKit Cloud | Free tier |
| Frontend | Next.js 16 + React 19 | Vercel free |
| Database | PocketBase or Postgres | Local |

## Architecture
```
User speaks → LiveKit → Deepgram STT → text
                              ↓
                     GPT-4o-mini + HR Tools
                         ↓           ↓
                   TTS (voice)  Data Channel (UI)
                         ↓           ↓
                   User hears    Screen renders
                   response      HR component
```

## HR Components (8 widgets)
1. **LeaveRequestForm** — Pre-filled leave application with calendar
2. **LeaveBalanceCard** — Annual/sick/emergency balance display
3. **EmployeeProfileCard** — Employee info summary
4. **InterviewPanel** — Question display + timer + scoring
5. **ApprovalQueue** — Stack of pending approvals for managers
6. **AttendanceDashboard** — Team grid with status indicators
7. **PaySlipCard** — Monthly salary breakdown
8. **StatusBanner** — Notifications, confirmations, errors

## Data Flow
1. User speaks → Deepgram STT → text
2. GPT-4o-mini processes with HR context + employee data
3. Tool calls → agent sends JSON via LiveKit Data Channel
4. Frontend renders matching HR component
5. Voice response confirms action
6. User interacts with visual form OR continues speaking

## Directory Structure
```
taliq/
├── frontend/               # Next.js 16 app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── api/token/route.ts
│   │   ├── components/
│   │   │   ├── taliq/          # HR components
│   │   │   │   ├── LeaveRequestForm.tsx
│   │   │   │   ├── LeaveBalanceCard.tsx
│   │   │   │   ├── EmployeeProfileCard.tsx
│   │   │   │   ├── InterviewPanel.tsx
│   │   │   │   ├── ApprovalQueue.tsx
│   │   │   │   ├── AttendanceDashboard.tsx
│   │   │   │   ├── PaySlipCard.tsx
│   │   │   │   └── StatusBanner.tsx
│   │   │   ├── VoiceAgent.tsx
│   │   │   ├── GenerativePanel.tsx
│   │   │   └── TaliqProvider.tsx
│   │   └── lib/
│   │       ├── data-channel.ts
│   │       └── livekit-config.ts
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── package.json
├── agent/                  # Python voice agent
│   ├── agent.py
│   ├── hr_tools.py
│   ├── hr_data.py          # Mock HR database
│   ├── requirements.txt
│   └── .env
└── ARCHITECTURE.md
```
