# Raksha — Women's Safety Emergency Response Prototype

> **SIH College-Level Prototype / Simulation**
>
> Raksha demonstrates an end-to-end emergency-response workflow. It is **not a production emergency service**.

## What is implemented

- Woman mobile-first emergency app
- Demo emergency flow
- Browser geolocation with permission, plus demo location fallback
- WebSocket real-time emergency updates
- Volunteer dashboard with simulated volunteers
- Response/operator dashboard
- Simulated police notification
- Evidence/event timeline
- Experimental/mock AI distress analysis
- Leaflet + OpenStreetMap safety map
- Simulated live-location route
- Safety analytics
- SQLite database
- Demo authentication
- Privacy and simulation labels

## Architecture

```text
React/Vite/Tailwind
      |
      | REST + WebSocket
      v
FastAPI
      |
      +-- Emergency service
      +-- Volunteer service
      +-- Demo/Simulation service
      +-- Mock AI analysis
      +-- Analytics
      |
      v
SQLite
```

### Prototype boundaries

| Component | Status |
|---|---|
| Emergency activation | Real prototype functionality |
| Browser geolocation | Real browser API with permission |
| WebSocket updates | Real prototype functionality |
| Volunteer matching | Simulated data |
| Police notification | Prototype/Simulation |
| AI distress analysis | Experimental deterministic simulation |
| Incident statistics | Simulated demo dataset |
| CCTV/police systems | Not connected |
| Production authentication | Not implemented |

## Requirements

- Python 3.10+
- Node.js 18+
- npm

## Backend

```bash
cd backend
python -m venv .venv
```

Windows Git Bash:

```bash
source .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API: http://127.0.0.1:8000  
Swagger: http://127.0.0.1:8000/docs

## Frontend

Open another Git Bash:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173.

## Demo accounts

These are fictional prototype accounts:

- Woman: `woman@raksha.demo` / `demo123`
- Volunteer: `volunteer@raksha.demo` / `demo123`
- Operator: `operator@raksha.demo` / `demo123`

## SIH demo flow

1. Open the Woman App.
2. Login as the demo woman.
3. Click **Start Demo Emergency**.
4. Watch the emergency become active.
5. Open the Volunteer Dashboard in another browser tab.
6. Accept the demo request.
7. Mark the volunteer **On the way**.
8. Open the Response Dashboard.
9. Observe live WebSocket updates.
10. Start the simulated route.
11. Mark the volunteer **Reached**.
12. Resolve the emergency.
13. Open Analytics to see the simulated incident added.

## Safety note

Raksha must never be presented as proof that a crime has occurred. AI analysis only demonstrates possible audio/distress indicators and does not determine whether a crime, rape, harassment, or other offence has occurred.
