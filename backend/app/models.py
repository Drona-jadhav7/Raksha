from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(160), unique=True)
    role: Mapped[str] = mapped_column(String(30))
    password: Mapped[str] = mapped_column(String(100))


class Volunteer(Base):
    __tablename__ = "volunteers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    verified: Mapped[bool] = mapped_column(Boolean, default=True)
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    distance_km: Mapped[float] = mapped_column(Float, default=1.0)
    reliability: Mapped[int] = mapped_column(Integer, default=90)


class EmergencySession(Base):
    __tablename__ = "emergencies"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    emergency_id: Mapped[str] = mapped_column(String(40), unique=True)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")
    risk_level: Mapped[str] = mapped_column(String(20), default="LOW")
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    police_status: Mapped[str] = mapped_column(String(50), default="SIMULATED POLICE ALERT PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class EvidenceEvent(Base):
    __tablename__ = "evidence_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    emergency_id: Mapped[str] = mapped_column(String(40))
    event_type: Mapped[str] = mapped_column(String(60))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class VolunteerResponse(Base):
    __tablename__ = "volunteer_responses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    emergency_id: Mapped[str] = mapped_column(String(40))
    volunteer_id: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30), default="NOTIFIED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class AIAnalysis(Base):
    __tablename__ = "ai_analysis"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    emergency_id: Mapped[str] = mapped_column(String(40))
    risk_level: Mapped[str] = mapped_column(String(20))
    indicators: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
