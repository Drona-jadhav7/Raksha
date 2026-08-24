from pydantic import BaseModel


class EmergencyCreate(BaseModel):
    latitude: float = 19.9975
    longitude: float = 73.7898
    demo: bool = True


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float


class StatusUpdate(BaseModel):
    status: str


class LoginRequest(BaseModel):
    email: str
    password: str


class EmergencyOut(BaseModel):
    emergency_id: str
    status: str
    risk_level: str
    latitude: float
    longitude: float
    police_status: str
