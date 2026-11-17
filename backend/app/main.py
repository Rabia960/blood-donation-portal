from contextlib import asynccontextmanager
from datetime import datetime
from math import radians, sin, cos, asin, sqrt
import os
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from .database import Base, engine, get_db
from . import models as m, schemas as s

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="LifeFlow Blood Network API", version="1.0.0", description="Backend API for donor registration, blood inventory, emergency requests, appointments and donation history.", lifespan=lifespan)
origins = [x.strip() for x in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root(): return {"name":"LifeFlow API", "status":"running", "docs":"/docs"}
@app.get("/health")
def health(): return {"status":"ok"}

@app.post("/api/donors", response_model=s.DonorOut, status_code=201)
def create_donor(data:s.DonorCreate, db:Session=Depends(get_db)):
    if db.query(m.Donor).filter(func.lower(m.Donor.email)==data.email.lower()).first(): raise HTTPException(409,"A donor with this email already exists")
    donor=m.Donor(**data.model_dump()); db.add(donor); db.commit(); db.refresh(donor); return donor
@app.get("/api/donors", response_model=list[s.DonorOut])
def list_donors(blood_group:str|None=None, city:str|None=None, available:bool|None=None, limit:int=Query(100,ge=1,le=500), offset:int=Query(0,ge=0), db:Session=Depends(get_db)):
    q=db.query(m.Donor)
    if blood_group: q=q.filter(m.Donor.blood_group==blood_group.upper().replace("−","-"))
    if city: q=q.filter(func.lower(m.Donor.city)==city.lower())
    if available is not None: q=q.filter(m.Donor.available==available)
    return q.order_by(m.Donor.created_at.desc()).offset(offset).limit(limit).all()

@app.get("/api/donors/nearby")
def nearby_donors(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(10, gt=0, le=500),
    blood_group: str | None = None,
    db: Session = Depends(get_db),
):
    donors = db.query(m.Donor).filter(
        m.Donor.available == True,
        m.Donor.latitude.isnot(None),
        m.Donor.longitude.isnot(None),
    )

    if blood_group:
        group = blood_group.upper().replace("−", "-")
        if group not in s.BLOOD_GROUPS:
            raise HTTPException(422, "Invalid blood group")
        donors = donors.filter(m.Donor.blood_group == group)

    results = []
    for donor in donors.all():
        lat1, lon1 = radians(latitude), radians(longitude)
        lat2, lon2 = radians(donor.latitude), radians(donor.longitude)
        dlat, dlon = lat2 - lat1, lon2 - lon1
        value = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        distance = 6371 * 2 * asin(sqrt(value))

        if distance <= radius_km:
            results.append({
                "id": donor.id,
                "full_name": donor.full_name,
                "blood_group": donor.blood_group,
                "city": donor.city,
                "distance_km": round(distance, 2),
            })

    return sorted(results, key=lambda item: item["distance_km"])

@app.get("/api/donors/{donor_id}",response_model=s.DonorOut)
def get_donor(donor_id:int,db:Session=Depends(get_db)):
    obj=db.get(m.Donor,donor_id)
    if not obj: raise HTTPException(404,"Donor not found")
    return obj
@app.patch("/api/donors/{donor_id}/availability",response_model=s.DonorOut)
def donor_availability(donor_id:int,available:bool,db:Session=Depends(get_db)):
    obj=db.get(m.Donor,donor_id)
    if not obj: raise HTTPException(404,"Donor not found")
    obj.available=available; db.commit(); db.refresh(obj); return obj

@app.post("/api/centers",response_model=s.CenterOut,status_code=201)
def create_center(data:s.CenterCreate,db:Session=Depends(get_db)):
    if db.query(m.Center).filter(func.lower(m.Center.name)==data.name.lower()).first(): raise HTTPException(409,"Center already exists")
    obj=m.Center(**data.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return obj
@app.get("/api/centers",response_model=list[s.CenterOut])
def list_centers(city:str|None=None,active:bool=True,db:Session=Depends(get_db)):
    q=db.query(m.Center).filter(m.Center.active==active)
    if city: q=q.filter(func.lower(m.Center.city)==city.lower())
    return q.order_by(m.Center.name).all()
@app.get("/api/centers/{center_id}",response_model=s.CenterOut)
def get_center(center_id:int,db:Session=Depends(get_db)):
    obj=db.get(m.Center,center_id)
    if not obj: raise HTTPException(404,"Center not found")
    return obj

@app.get("/api/inventory")
def inventory(blood_group:str|None=None,city:str|None=None,db:Session=Depends(get_db)):
    q=db.query(m.Inventory,m.Center).join(m.Center).filter(m.Center.active==True)
    if blood_group: q=q.filter(m.Inventory.blood_group==blood_group.upper().replace("−","-"))
    if city: q=q.filter(func.lower(m.Center.city)==city.lower())
    rows=q.order_by(m.Center.name,m.Inventory.blood_group).all()
    return [{"id":i.id,"center_id":c.id,"center_name":c.name,"city":c.city,"blood_group":i.blood_group,"units":i.units,"status":"Critical" if i.units<=2 else "Low stock" if i.units<=4 else "Available","updated_at":i.updated_at} for i,c in rows]
@app.put("/api/centers/{center_id}/inventory/{blood_group}")
def set_inventory(center_id:int,blood_group:str,data:s.InventoryUpdate,db:Session=Depends(get_db)):
    group=blood_group.upper().replace("−","-")
    if group not in s.BLOOD_GROUPS: raise HTTPException(422,"Invalid blood group")
    if not db.get(m.Center,center_id): raise HTTPException(404,"Center not found")
    obj=db.query(m.Inventory).filter_by(center_id=center_id,blood_group=group).first()
    if not obj: obj=m.Inventory(center_id=center_id,blood_group=group,units=data.units); db.add(obj)
    else: obj.units=data.units
    db.commit(); db.refresh(obj)
    return {"id":obj.id,"center_id":obj.center_id,"blood_group":obj.blood_group,"units":obj.units,"updated_at":obj.updated_at}

@app.post("/api/requests",response_model=s.BloodRequestOut,status_code=201)
def create_request(data:s.BloodRequestCreate,db:Session=Depends(get_db)):
    obj=m.BloodRequest(**data.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return obj
@app.get("/api/requests",response_model=list[s.BloodRequestOut])
def list_requests(status:str|None=None,city:str|None=None,blood_group:str|None=None,db:Session=Depends(get_db)):
    q=db.query(m.BloodRequest)
    if status: q=q.filter(m.BloodRequest.status==status)
    if city: q=q.filter(func.lower(m.BloodRequest.city)==city.lower())
    if blood_group: q=q.filter(m.BloodRequest.blood_group==blood_group.upper().replace("−","-"))
    return q.order_by(m.BloodRequest.created_at.desc()).all()
@app.get("/api/requests/{request_id}/nearby-donors")
def nearby_donors_for_request(
    request_id: int,
    radius_km: float = Query(25, gt=0, le=500),
    db: Session = Depends(get_db),
):
    blood_request = db.get(m.BloodRequest, request_id)
    if not blood_request:
        raise HTTPException(404, "Blood request not found")

    if blood_request.latitude is None or blood_request.longitude is None:
        raise HTTPException(422, "This blood request has no saved GPS location")

    donors = db.query(m.Donor).filter(
        m.Donor.available == True,
        m.Donor.blood_group == blood_request.blood_group,
        m.Donor.latitude.isnot(None),
        m.Donor.longitude.isnot(None),
    ).all()

    results = []
    request_lat = radians(blood_request.latitude)
    request_lon = radians(blood_request.longitude)

    for donor in donors:
        donor_lat = radians(donor.latitude)
        donor_lon = radians(donor.longitude)

        dlat = donor_lat - request_lat
        dlon = donor_lon - request_lon

        value = (
            sin(dlat / 2) ** 2
            + cos(request_lat) * cos(donor_lat) * sin(dlon / 2) ** 2
        )
        distance = 6371 * 2 * asin(sqrt(min(1, value)))

        if distance <= radius_km:
            results.append({
                "id": donor.id,
                "full_name": donor.full_name,
                "blood_group": donor.blood_group,
                "city": donor.city,
                "distance_km": round(distance, 2),
            })

    return sorted(results, key=lambda item: item["distance_km"])


@app.patch("/api/requests/{request_id}/status",response_model=s.BloodRequestOut)
def update_request_status(request_id:int,data:s.RequestStatusUpdate,db:Session=Depends(get_db)):
    if data.status not in {"pending","matched","fulfilled","cancelled"}: raise HTTPException(422,"Invalid request status")
    obj=db.get(m.BloodRequest,request_id)
    if not obj: raise HTTPException(404,"Request not found")
    obj.status=data.status; db.commit(); db.refresh(obj); return obj

@app.post("/api/appointments",response_model=s.AppointmentOut,status_code=201)
def create_appointment(data:s.AppointmentCreate,db:Session=Depends(get_db)):
    if not db.get(m.Donor,data.donor_id): raise HTTPException(404,"Donor not found")
    if not db.get(m.Center,data.center_id): raise HTTPException(404,"Center not found")
    if data.scheduled_at < datetime.now(): raise HTTPException(422,"Appointment must be in the future")
    obj=m.Appointment(**data.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return obj
@app.get("/api/appointments",response_model=list[s.AppointmentOut])
def list_appointments(donor_id:int|None=None,status:str|None=None,db:Session=Depends(get_db)):
    q=db.query(m.Appointment)
    if donor_id: q=q.filter(m.Appointment.donor_id==donor_id)
    if status: q=q.filter(m.Appointment.status==status)
    return q.order_by(m.Appointment.scheduled_at).all()
@app.patch("/api/appointments/{appointment_id}/cancel",response_model=s.AppointmentOut)
def cancel_appointment(appointment_id:int,db:Session=Depends(get_db)):
    obj=db.get(m.Appointment,appointment_id)
    if not obj: raise HTTPException(404,"Appointment not found")
    if obj.status!="booked": raise HTTPException(409,"Only booked appointments can be cancelled")
    obj.status="cancelled"; db.commit(); db.refresh(obj); return obj

@app.post("/api/donations",response_model=s.DonationOut,status_code=201)
def record_donation(data:s.DonationCreate,db:Session=Depends(get_db)):
    if not db.get(m.Donor,data.donor_id): raise HTTPException(404,"Donor not found")
    if not db.get(m.Center,data.center_id): raise HTTPException(404,"Center not found")
    group=data.blood_group.upper().replace("−","-")
    if group not in s.BLOOD_GROUPS: raise HTTPException(422,"Invalid blood group")
    obj=m.Donation(**{**data.model_dump(),"blood_group":group}); db.add(obj); db.commit(); db.refresh(obj); return obj
@app.get("/api/donations",response_model=list[s.DonationOut])
def list_donations(donor_id:int|None=None,db:Session=Depends(get_db)):
    q=db.query(m.Donation)
    if donor_id: q=q.filter(m.Donation.donor_id==donor_id)
    return q.order_by(m.Donation.donated_on.desc()).all()

@app.get("/api/dashboard")
def dashboard(city:str|None=None,db:Session=Depends(get_db)):
    donors=db.query(m.Donor).filter(m.Donor.available==True)
    centers=db.query(m.Center).filter(m.Center.active==True)
    requests=db.query(m.BloodRequest)
    inv=db.query(m.Inventory).join(m.Center).filter(m.Center.active==True)
    if city:
        donors=donors.filter(func.lower(m.Donor.city)==city.lower()); centers=centers.filter(func.lower(m.Center.city)==city.lower()); requests=requests.filter(func.lower(m.BloodRequest.city)==city.lower()); inv=inv.filter(func.lower(m.Center.city)==city.lower())
    totals={g:0 for g in sorted(s.BLOOD_GROUPS)}
    for group,units in inv.with_entities(m.Inventory.blood_group,func.sum(m.Inventory.units)).group_by(m.Inventory.blood_group).all(): totals[group]=units or 0
    return {"available_donors":donors.count(),"active_centers":centers.count(),"pending_requests":requests.filter(m.BloodRequest.status=="pending").count(),"total_inventory_units":sum(totals.values()),"inventory_by_blood_group":totals}
