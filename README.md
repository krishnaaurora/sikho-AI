# 🎓 Sikho-AI — AI-Powered Learning & Interview Prep Platform

> **Get interview-ready with AI.** Sikho-AI is an end-to-end learning platform that combines AI-driven interview preparation, resume intelligence, and blockchain-gated micropayments — built on the x402 HTTP payment protocol with Algorand.

---

## What is Sikho-AI?

Sikho-AI ("Sikho" means *learn* in Hindi) is a full-stack, AI-powered career development platform designed for students and developers preparing for tech interviews. It brings together:

- 🧠 **Interview Prep Studio** — AI-driven mock interviews, question banks, and real-time answer feedback powered by Groq LLMs
- 📄 **Resume Intelligence** — Upload your resume (PDF/DOCX) and get a detailed AI gap analysis, skill scoring, and improvement suggestions
- 💸 **x402 Micropayments** — Premium features are gated behind on-chain micropayments using the x402 HTTP protocol on Algorand TestNet (USDC), enabling pay-per-use without subscriptions
- 🏗️ **Build Studio** — A playground for developers to create and test their own payment-protected API endpoints
- 🔌 **API Playground** — Explore and call live x402-gated APIs directly from the browser

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite + TailwindCSS |
| Backend (Node) | Hono + TypeScript + MongoDB |
| Backend (Python) | FastAPI + Groq SDK + pypdf + python-docx |
| AI / LLM | Groq (Llama 3, Mixtral) — rotating API keys |
| Payments | x402 HTTP protocol + Algorand USDC (TestNet) |
| Auth | JWT + bcrypt |
| Email | Nodemailer (SMTP welcome emails) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Project Structure

```
sikho-AI/
│
├── X402-Usecase/projects/X402-Usecase/   # React frontend (Vercel)
│   ├── src/pages/
│   │   ├── InterviewPrep.tsx             # AI mock interviews + question bank
│   │   ├── ResumeIntelligence.tsx        # Resume upload + AI gap analysis
│   │   ├── LearnerDashboard.tsx          # User dashboard
│   │   ├── BuildStudio.tsx               # Developer API builder
│   │   └── ApiPlayground.tsx             # Live API explorer
│   └── vercel.json                       # Vercel SPA config
│
├── x402-demo-server/                     # Node.js backend (Render)
│   ├── routes/
│   │   ├── interview_pro.routes.ts       # Interview Prep API routes
│   │   └── x402.routes.ts               # x402 payment-gated routes
│   ├── controllers/interview/
│   │   └── interviewPro.controller.ts    # Interview & resume AI logic
│   ├── middlewares/x402.middleware.ts    # x402 payment verification
│   ├── services/auth/                    # JWT auth + registration emails
│   └── models/User.model.ts             # MongoDB user schema
│
├── interview_pro/backend/                # Python FastAPI backend (Render)
│   ├── main.py                           # Interview Prep API (Groq + file parsing)
│   ├── requirements.txt                  # Python dependencies
│   └── uploads/                         # Temporary resume uploads
│
└── render.yaml                           # Render auto-deploy config
```

---

## Key Features

### 🎤 Interview Prep Studio
- Generate interview questions by role, level, and tech stack
- Submit answers and receive instant AI feedback with scoring
- Track your mock interview history and progress
- Gated behind x402 micropayments — pay only for what you use

### 📄 Resume Intelligence
- Upload PDF or DOCX resumes
- AI extracts your skills and compares them against a target job description
- Returns a gap analysis, missing skills list, and actionable recommendations
- Powered by Groq LLMs with rotating API keys for rate-limit resilience

### 💳 x402 Micropayments (Algorand)
- Uses the open x402 HTTP payment protocol (HTTP 402 Payment Required)
- Payments are made in USDC on Algorand TestNet
- Connect with Pera or Defly wallet — no subscription, no account needed for payments
- Verified on-chain via the GoPlausible facilitator

---

## Deployment

### Frontend → Vercel
Connect the repo on [vercel.com](https://vercel.com), set the **Root Directory** to:
```
X402-Usecase/projects/X402-Usecase
```
Vercel auto-deploys on every push to the `career` branch.

Set these environment variables in Vercel:
```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_NETWORK=testnet
VITE_FACILITATOR_URL=https://facilitator.goplausible.xyz
```

### Backend → Render (auto-deploy via `render.yaml`)
Connect the repo on [render.com](https://render.com) → **New Blueprint** → Render will auto-detect `render.yaml` and deploy the Python FastAPI backend.

Set these environment variables in the Render dashboard:
```env
GROQ_API_KEY_20=...
GROQ_API_KEY_21=...
# ... up to GROQ_API_KEY_27
```

---

## Running Locally

**Python backend (Interview Prep API):**
```bash
cd interview_pro/backend
pip install -r requirements.txt
cp .env.example .env   # fill in your Groq keys
uvicorn main:app --reload --port 8000
```

**Node backend (x402 + Auth):**
```bash
cd x402-demo-server
npm install
cp .env.example .env   # fill in AVM_ADDRESS, MONGO_URI, etc.
npm run dev
```

**Frontend:**
```bash
cd X402-Usecase/projects/X402-Usecase
npm install
cp .env.template .env.local   # fill in API URLs
npm run dev
# → http://localhost:5173
```

---

## Contributing

Pull requests welcome. Please open an issue first for major changes.

---

**Built for the x402 Build & Arena Hackathon — AlgoBharat**
