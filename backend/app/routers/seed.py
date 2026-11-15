"""Optional demo seed data. These records are fictional and must not be treated as live stock."""
from app.database import Base, engine, SessionLocal
from app import models as m
Base.metadata.create_all(bind=engine)
db=SessionLocal()
try:
    if db.query(m.Center).count()==0:
        centers=[m.Center(name="City General Hospital",address="Demo address, Bengaluru",city="Bengaluru",phone="080-00000000",opening_hours="Open 24 hours"),m.Center(name="Red Cross Donation Center",address="Demo address, Bengaluru",city="Bengaluru",phone="080-00000001",opening_hours="9:00 AM – 8:00 PM"),m.Center(name="St. Mary's Medical Center",address="Demo address, Bengaluru",city="Bengaluru",phone="080-00000002",opening_hours="8:00 AM – 10:00 PM")]
        db.add_all(centers); db.flush()
        stock=[{"A+":12,"A-":4,"B+":8,"B-":2,"AB+":6,"AB-":1,"O+":15,"O-":3},{"A+":5,"A-":2,"B+":4,"B-":1,"AB+":3,"AB-":0,"O+":8,"O-":2},{"A+":7,"A-":3,"B+":6,"B-":2,"AB+":2,"AB-":1,"O+":9,"O-":4}]
        for center,groups in zip(centers,stock):
            for group,units in groups.items(): db.add(m.Inventory(center_id=center.id,blood_group=group,units=units))
        db.commit()
    print("Seed complete. Demo stock is fictional; replace it with verified center data.")
finally: db.close()
