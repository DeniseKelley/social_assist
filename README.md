# SocialAssist — Creator Instagram Automated DM & Strategy Studio

A ManyChat-style Instagram Automated DM studio + Instagram Analytics & AI Strategy engine built with **Python (FastAPI)** and **React (Vite + Tailwind CSS)**.

## Features
- **ManyChat-Style Automated DM Studio**: Comment-to-DM keyword flows, Story Reply triggers, Direct DM keyword auto-replies, public comment auto-replies, and a live mobile DM simulator.
- **1-Step Instagram Connection**: Connect your Instagram account and pull live profile & Reel metrics into your isolated workspace.
- **Instagram Statistics & AI Strategy Engine**: Tracks engagement rates, save-to-view ratios, comment lift multiplier, and generates actionable content & DM trigger strategies.

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
