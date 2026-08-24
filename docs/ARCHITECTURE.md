# Raksha Architecture

## Layers

### Frontend
React + Vite + Tailwind CSS provides:
- Woman App
- Volunteer Dashboard
- Response Dashboard
- Analytics

Leaflet/OpenStreetMap provides map visualization.

### Backend
FastAPI provides REST APIs and WebSocket events.

Services:
- Emergency lifecycle
- Volunteer matching/status
- Mock AI analysis
- Evidence timeline
- Analytics

### Persistence
SQLite stores prototype records.

## Event flow

```text
Woman App
   |
POST /api/emergencies
   |
FastAPI
   |
SQLite
   |
WebSocket broadcast
   +--------------------+
   |                    |
Volunteer Dashboard   Response Dashboard
   |                    |
status update ---------+
```

## Integration boundaries

Real police APIs, CCTV systems, private surveillance, and government databases are deliberately not connected. These are future authorized integration points only.
