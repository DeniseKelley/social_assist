# SocialAssist — Omnichannel Automated DM & Live Strategy Studio

A ManyChat-style Multi-Platform Automated Reply/DM studio + Live Creator Analytics & AI Strategy engine built with **Python (FastAPI)**, **Vercel Serverless Functions**, and **React (Vite + Tailwind CSS)**.

## Features
- **6-Platform 1-Button Connect Hub**: Connect **Instagram**, **TikTok**, **YouTube**, **Facebook**, **X**, and **Threads** with a single button that redirects to sign in and pulls live audience & post metrics into your isolated workspace.
- **ManyChat-Style Automated Reply & DM Studio**: Comment-to-DM keyword flows, Story Reply triggers, Direct DM keyword auto-replies, per-platform or omnichannel targeting, and a live interactive simulator.
- **Omnichannel Statistics & OpenClaw Strategy Engine**: Switch between individual platforms or an **`All Platforms`** combined overview tracking followers/subscribers, views, likes, engagement rates, US scroll windows, and AI growth strategies.

## Quick Start

### 1. Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.
