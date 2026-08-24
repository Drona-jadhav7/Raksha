# API

## GET /api/health
Health check.

## POST /api/auth/login
Prototype login.

## POST /api/emergencies
Creates a simulated emergency.

## GET /api/emergencies
Lists prototype emergencies.

## GET /api/emergencies/{id}
Returns emergency details, timeline, volunteers and experimental AI analysis.

## PATCH /api/emergencies/{id}/location
Updates emergency coordinates.

## PATCH /api/emergencies/{id}/status
Accepts `ACTIVE`, `RESOLVED`, or `CANCELLED`.

## PATCH /api/emergencies/{id}/volunteers/{volunteer_id}
Accepts `ACCEPTED`, `ON_THE_WAY`, `REACHED`, or `DECLINED`.

## GET /api/analytics
Returns simulated safety analytics.

## WebSocket /ws
Broadcasts:
- EMERGENCY_CREATED
- LOCATION_UPDATED
- STATUS_UPDATED
- VOLUNTEER_UPDATED
