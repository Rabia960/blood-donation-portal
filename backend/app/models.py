from datetime import datetime, date
from sqlalchemy import String, Integer, DateTime, Date, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class Donor(Base):
    __tablename__ = "donors"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(30))
    blood_group: Mapped[str] = mapped_column(String(3), index=True)
    city: Mapped[str] = mapped_column(String(100), index=True)
    age: Mapped[int]
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Center(Base):
    __tablename__ = "centers"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100), index=True)
    phone: Mapped[str] = mapped_column(String(30), default="")
    opening_hours: Mapped[str] = mapped_column(String(100), default="Contact center")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    inventory = relationship("Inventory", back_populates="center", cascade="all, delete-orphan")

class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (UniqueConstraint("center_id", "blood_group"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    center_id: Mapped[int] = mapped_column(ForeignKey("centers.id", ondelete="CASCADE"), index=True)
    blood_group: Mapped[str] = mapped_column(String(3), index=True)
    units: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    center = relationship("Center", back_populates="inventory")

class BloodRequest(Base):
    __tablename__ = "blood_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    patient_name: Mapped[str] = mapped_column(String(120))
    blood_group: Mapped[str] = mapped_column(String(3), index=True)
    units: Mapped[int] = mapped_column(Integer)
    hospital: Mapped[str] = mapped_column(String(180))
    city: Mapped[str] = mapped_column(String(100), index=True)
    contact_phone: Mapped[str] = mapped_column(String(30))
    urgency: Mapped[str] = mapped_column(String(20), default="normal")
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "appointments"
    id: Mapped[int] = mapped_column(primary_key=True)
    donor_id: Mapped[int] = mapped_column(ForeignKey("donors.id"), index=True)
    center_id: Mapped[int] = mapped_column(ForeignKey("centers.id"), index=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[str] = mapped_column(String(20), default="booked")
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    donor = relationship("Donor")
    center = relationship("Center")

class Donation(Base):
    __tablename__ = "donations"
    id: Mapped[int] = mapped_column(primary_key=True)
    donor_id: Mapped[int] = mapped_column(ForeignKey("donors.id"), index=True)
    center_id: Mapped[int] = mapped_column(ForeignKey("centers.id"), index=True)
    blood_group: Mapped[str] = mapped_column(String(3))
    units: Mapped[int] = mapped_column(Integer, default=1)
    donated_on: Mapped[date] = mapped_column(Date, default=date.today)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    donor = relationship("Donor")
    center = relationship("Center")
