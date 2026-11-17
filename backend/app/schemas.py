from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field, field_validator

BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class DonorCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    phone: str = Field(min_length=7, max_length=30)
    blood_group: str
    city: str = Field(min_length=2, max_length=100)
    age: int = Field(ge=18, le=65)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("blood_group")
    @classmethod
    def valid_group(cls, v):
        v = v.upper().replace("−", "-")
        if v not in BLOOD_GROUPS:
            raise ValueError("Invalid blood group")
        return v


class DonorOut(ORMModel):
    id: int
    full_name: str
    email: str
    phone: str
    blood_group: str
    city: str
    age: int
    available: bool
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime


class CenterCreate(BaseModel):
    name: str
    address: str
    city: str
    phone: str = ""
    opening_hours: str = "Contact center"
    latitude: float | None = None
    longitude: float | None = None
    location_verified: bool = False
    location_source: str | None = None


class CenterOut(ORMModel):
    id: int
    name: str
    address: str
    city: str
    phone: str
    opening_hours: str
    active: bool
    latitude: float | None = None
    longitude: float | None = None
    location_verified: bool = False
    location_source: str | None = None


class InventoryUpdate(BaseModel):
    units: int = Field(ge=0, le=100000)


class InventoryOut(ORMModel):
    id: int
    center_id: int
    blood_group: str
    units: int
    updated_at: datetime


class BloodRequestCreate(BaseModel):
    patient_name: str = Field(min_length=2, max_length=120)
    blood_group: str
    units: int = Field(ge=1, le=20)
    hospital: str = Field(min_length=2, max_length=180)
    city: str
    contact_phone: str
    urgency: str = "normal"
    notes: str = ""
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("blood_group")
    @classmethod
    def valid_group(cls, v):
        v = v.upper().replace("−", "-")
        if v not in BLOOD_GROUPS:
            raise ValueError("Invalid blood group")
        return v

    @field_validator("urgency")
    @classmethod
    def valid_urgency(cls, v):
        if v not in {"normal", "urgent", "critical"}:
            raise ValueError("Urgency must be normal, urgent or critical")
        return v


class BloodRequestOut(ORMModel):
    id: int
    patient_name: str
    blood_group: str
    units: int
    hospital: str
    city: str
    contact_phone: str
    urgency: str
    status: str
    notes: str
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime


class RequestStatusUpdate(BaseModel):
    status: str


class AppointmentCreate(BaseModel):
    donor_id: int
    center_id: int
    scheduled_at: datetime
    notes: str = ""


class AppointmentOut(ORMModel):
    id: int
    donor_id: int
    center_id: int
    scheduled_at: datetime
    status: str
    notes: str
    created_at: datetime


class DonationCreate(BaseModel):
    donor_id: int
    center_id: int
    blood_group: str
    units: int = Field(default=1, ge=1, le=2)
    donated_on: date = Field(default_factory=date.today)


class DonationOut(ORMModel):
    id: int
    donor_id: int
    center_id: int
    blood_group: str
    units: int
    donated_on: date
    verified: bool
