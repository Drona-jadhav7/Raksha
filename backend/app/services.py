import json
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .models import EmergencySession, EvidenceEvent, Volunteer, VolunteerResponse, AIAnalysis


def create_event(db: Session, emergency_id: str, event_type: str, message: str):
    event = EvidenceEvent(
        emergency_id=emergency_id,
        event_type=event_type,
        message=message,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def create_demo_emergency(db: Session, latitude: float, longitude: float):
    eid = f"RK-{uuid.uuid4().hex[:8].upper()}"
    emergency = EmergencySession(
        emergency_id=eid,
        latitude=latitude,
        longitude=longitude,
        status="ACTIVE",
        risk_level="MEDIUM",
        police_status="SIMULATED POLICE ALERT SENT",
    )
    db.add(emergency)
    db.commit()

    create_event(db, eid, "EMERGENCY_ACTIVATED", "Emergency session activated.")
    create_event(db, eid, "RECORDING_STARTED", "Evidence recording simulation started.")
    create_event(db, eid, "POLICE_ALERT", "Prototype/Simulation police notification generated.")

    volunteers = db.query(Volunteer).filter(
        Volunteer.available == True,
        Volunteer.verified == True,
    ).order_by(Volunteer.distance_km).limit(3).all()

    for volunteer in volunteers:
        db.add(VolunteerResponse(
            emergency_id=eid,
            volunteer_id=volunteer.id,
            status="NOTIFIED",
        ))

    analysis = AIAnalysis(
        emergency_id=eid,
        risk_level="HIGH",
        indicators=json.dumps([
            "Possible shouting",
            "Possible distress sound",
            "Possible threatening/abusive language"
        ]),
        confidence=0.86,
    )
    db.add(analysis)
    emergency.risk_level = "HIGH"
    db.commit()

    create_event(db, eid, "AI_ANALYSIS", "Experimental AI analysis indicates possible distress indicators.")
    create_event(db, eid, "VOLUNTEERS_NOTIFIED", f"{len(volunteers)} verified demo volunteers notified.")
    return emergency


def serialize_emergency(e):
    return {
        "emergency_id": e.emergency_id,
        "status": e.status,
        "risk_level": e.risk_level,
        "latitude": e.latitude,
        "longitude": e.longitude,
        "police_status": e.police_status,
    }
