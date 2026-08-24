from pathlib import Path
from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db, SessionLocal
from .models import User, Volunteer, EmergencySession, EvidenceEvent, VolunteerResponse, AIAnalysis
from .schemas import EmergencyCreate, LocationUpdate, StatusUpdate, LoginRequest
from .services import create_demo_emergency, create_event, serialize_emergency
from .websocket import manager

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    if db.query(User).count() == 0:
        db.add_all([
            User(name="Demo Woman", email="woman@raksha.demo", role="woman", password="demo123"),
            User(name="Demo Volunteer", email="volunteer@raksha.demo", role="volunteer", password="demo123"),
            User(name="Demo Operator", email="operator@raksha.demo", role="operator", password="demo123"),
        ])
    if db.query(Volunteer).count() == 0:
        db.add_all([
            Volunteer(name="Aarohi Sharma", distance_km=0.8, reliability=96),
            Volunteer(name="Neha Patil", distance_km=1.4, reliability=93),
            Volunteer(name="Kavya Joshi", distance_km=2.1, reliability=91),
            Volunteer(name="Meera Kulkarni", distance_km=3.0, reliability=88, available=False),
        ])
    db.commit()
    db.close()


seed()

app = FastAPI(
    title="Raksha Prototype API",
    description="SIH prototype emergency-response API. Government integrations are simulated.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "prototype": True}


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or user.password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid demo credentials")
    return {"name": user.name, "email": user.email, "role": user.role}


@app.post("/api/emergencies")
async def create_emergency(payload: EmergencyCreate, db: Session = Depends(get_db)):
    emergency = create_demo_emergency(db, payload.latitude, payload.longitude)
    data = serialize_emergency(emergency)
    await manager.broadcast({"type": "EMERGENCY_CREATED", "emergency": data})
    return data


@app.get("/api/emergencies")
def emergencies(db: Session = Depends(get_db)):
    rows = db.query(EmergencySession).order_by(EmergencySession.id.desc()).all()
    return [serialize_emergency(x) for x in rows]


@app.get("/api/emergencies/{emergency_id}")
def get_emergency(emergency_id: str, db: Session = Depends(get_db)):
    emergency = db.query(EmergencySession).filter(EmergencySession.emergency_id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    events = db.query(EvidenceEvent).filter(
        EvidenceEvent.emergency_id == emergency_id
    ).order_by(EvidenceEvent.id).all()

    responses = db.query(VolunteerResponse).filter(
        VolunteerResponse.emergency_id == emergency_id
    ).all()

    volunteers = []
    for r in responses:
        v = db.query(Volunteer).filter(Volunteer.id == r.volunteer_id).first()
        volunteers.append({
            "id": v.id,
            "name": v.name,
            "distance_km": v.distance_km,
            "reliability": v.reliability,
            "status": r.status,
            "verified": v.verified,
        })

    ai = db.query(AIAnalysis).filter(AIAnalysis.emergency_id == emergency_id).first()

    return {
        "emergency": serialize_emergency(emergency),
        "timeline": [
            {"type": e.event_type, "message": e.message, "created_at": e.created_at.isoformat()}
            for e in events
        ],
        "volunteers": volunteers,
        "ai": None if not ai else {
            "risk_level": ai.risk_level,
            "indicators": __import__("json").loads(ai.indicators),
            "confidence": ai.confidence,
            "experimental": True,
        },
    }


@app.patch("/api/emergencies/{emergency_id}/location")
async def update_location(emergency_id: str, payload: LocationUpdate, db: Session = Depends(get_db)):
    e = db.query(EmergencySession).filter(EmergencySession.emergency_id == emergency_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Emergency not found")
    e.latitude, e.longitude = payload.latitude, payload.longitude
    db.commit()
    create_event(db, emergency_id, "LOCATION_UPDATED", "Live location updated.")
    data = serialize_emergency(e)
    await manager.broadcast({"type": "LOCATION_UPDATED", "emergency": data})
    return data


@app.patch("/api/emergencies/{emergency_id}/status")
async def update_status(emergency_id: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    allowed = {"ACTIVE", "RESOLVED", "CANCELLED"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported status")
    e = db.query(EmergencySession).filter(EmergencySession.emergency_id == emergency_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Emergency not found")
    e.status = payload.status
    db.commit()
    create_event(db, emergency_id, "STATUS_CHANGED", f"Emergency status changed to {payload.status}.")
    data = serialize_emergency(e)
    await manager.broadcast({"type": "STATUS_UPDATED", "emergency": data})
    return data


@app.patch("/api/emergencies/{emergency_id}/volunteers/{volunteer_id}")
async def volunteer_status(
    emergency_id: str,
    volunteer_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
):
    allowed = {"ACCEPTED", "ON_THE_WAY", "REACHED", "DECLINED"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported volunteer status")
    r = db.query(VolunteerResponse).filter(
        VolunteerResponse.emergency_id == emergency_id,
        VolunteerResponse.volunteer_id == volunteer_id,
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Volunteer response not found")
    r.status = payload.status
    db.commit()
    create_event(db, emergency_id, "VOLUNTEER_UPDATE", f"Volunteer {volunteer_id}: {payload.status}.")
    await manager.broadcast({
        "type": "VOLUNTEER_UPDATED",
        "emergency_id": emergency_id,
        "volunteer_id": volunteer_id,
        "status": payload.status,
    })
    return {"ok": True, "status": payload.status}


@app.get("/api/analytics")
def analytics(db: Session = Depends(get_db)):
    return {
        "prototype": True,
        "areas": [
            {"name": "College Road", "risk": "HIGH", "incidents": 28},
            {"name": "Gangapur Road", "risk": "MODERATE", "incidents": 17},
            {"name": "Panchavati", "risk": "LOW", "incidents": 8},
            {"name": "Indira Nagar", "risk": "MODERATE", "incidents": 14},
        ],
        "categories": [
            {"name": "Harassment", "count": 24},
            {"name": "Unsafe transit", "count": 18},
            {"name": "Theft", "count": 9},
            {"name": "Other", "count": 16},
        ],
        "note": "All analytics shown here are simulated demo data, not real crime statistics.",
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
