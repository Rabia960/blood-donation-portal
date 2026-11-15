# LifeFlow backend

FastAPI + SQLAlchemy backend for the supplied React/Vite blood donation portal.

## Run locally (Windows PowerShell)

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python seed.py       # optional: creates fictional demo centers and inventory
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs for interactive API documentation. The database file `lifeflow.db` is created automatically on first run. Do not commit `.env`, `.venv`, or the database file.

## API

- `GET /health`, `GET /api/dashboard?city=Bengaluru`
- `POST/GET /api/donors`, `GET /api/donors/{id}`, `PATCH /api/donors/{id}/availability?available=true`
- `POST/GET /api/centers`, `GET /api/centers/{id}`
- `GET /api/inventory?city=Bengaluru&blood_group=O-`, `PUT /api/centers/{id}/inventory/{blood_group}`
- `POST/GET /api/requests`, `PATCH /api/requests/{id}/status`
- `POST/GET /api/appointments`, `PATCH /api/appointments/{id}/cancel`
- `POST/GET /api/donations`

All request/response bodies are documented in Swagger at `/docs`.

## Important limitations before public launch

This is a functional development backend, not a production blood-bank system. It intentionally does not claim that seeded inventory is live or medically verified. It has no login/role-based authorization, OTP verification, audit trail, rate limiting, consent workflow, hospital verification, donor eligibility assessment, notification/SMS integration, or deployment configuration. Add these and use PostgreSQL + HTTPS before handling real patient/donor data. Never expose donor contact details publicly. Blood compatibility and transfusion decisions must be made by qualified medical staff; this API does not determine clinical suitability.
