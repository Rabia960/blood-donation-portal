from sqlalchemy.orm import Session
from .models import BloodInventory, DonationCenter

DEFAULT_INVENTORY = [("A+",12),("A-",4),("B+",8),("B-",2),("AB+",6),("AB-",1),("O+",15),("O-",3)]
DEFAULT_CENTERS = [
    {"name":"City General Hospital","address":"Enter verified address","city":"Bengaluru","phone":"","hours":"Open 24 hours","needed_blood_type":"O-"},
    {"name":"Red Cross Donation Center","address":"Enter verified address","city":"Bengaluru","phone":"","hours":"Contact center for hours","needed_blood_type":"B-"},
    {"name":"St. Mary's Medical Center","address":"Enter verified address","city":"Bengaluru","phone":"","hours":"Contact center for hours","needed_blood_type":"AB-"},
]

def seed_database(db: Session):
    if db.query(BloodInventory).count() == 0:
        db.add_all([BloodInventory(blood_type=t, units=u) for t,u in DEFAULT_INVENTORY])
    if db.query(DonationCenter).count() == 0:
        db.add_all([DonationCenter(**center) for center in DEFAULT_CENTERS])
    db.commit()
