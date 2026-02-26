# Taliq — تَلِيق — Voice-First HR Platform

> **Taliq** (تَلِيق) means "eloquent" in Arabic. Your HR department, reimagined as a voice conversation.

![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-Next.js%20%2B%20LiveKit%20%2B%20Python-blue)

## What is Taliq?

Taliq is a voice-first HR platform where employees, managers, and candidates interact with HR through natural conversation. No portals, no ticket systems — just talk.

The agent **speaks** AND **shows interactive UI** simultaneously. Say "I need leave next Thursday" and a pre-filled leave form appears on screen while Taliq confirms verbally.

## Features

### 🧑‍💼 Employee Self-Service
- Check leave balance (annual, sick, emergency)
- Apply for leave with voice — form auto-fills
- View profile and personal details
- View pay slips

### 🎤 AI Interviewer
- Conducts structured interviews based on job type
- Real-time scoring rubric on screen
- Timer per question
- Generates evaluation summary

### 👔 Manager Dashboard
- Team attendance (present, late, remote, on leave)
- Pending approval queue with approve/reject actions
- Leave management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4 |
| **Voice** | LiveKit (real-time audio) |
| **STT** | Deepgram Nova-3 |
| **LLM** | GPT-4o-mini |
| **TTS** | Kokoro via Speaches (local, free) |
| **Agent** | Python, LiveKit Agents SDK v1.4 |

## Quick Start

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local  # Add your LiveKit keys
npm run dev
```

### Agent
```bash
cd agent
pip install -r requirements.txt
cp .env.example .env  # Add API keys
python agent.py dev
```

## Architecture

```
User speaks → LiveKit → Deepgram STT → GPT-4o-mini + HR Tools
                                           ↓           ↓
                                     TTS (voice)  Data Channel (UI)
                                           ↓           ↓
                                     User hears    Screen renders
                                     response      HR widget
```

## Design

- **Colors:** Emerald (#10B981) + Gold (#F59E0B) on dark navy (#0A0F1A)
- **Arabic vibes:** Geometric patterns, RTL text support, Arabic typography
- **Mobile-first:** PWA-ready, responsive, glassmorphism widgets
- **8 HR Components:** LeaveRequestForm, LeaveBalanceCard, EmployeeProfileCard, InterviewPanel, ApprovalQueue, AttendanceDashboard, PaySlipCard, StatusBanner

## License

MIT

---

*Built with ⚡ by [MiddleMind](https://middlemind-vercel.vercel.app)*
