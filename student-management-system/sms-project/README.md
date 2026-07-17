# Student Management System (Cloud-Based)

A simplified but fully working full-stack Student Management System.

**Stack:** React (Vite) + Bootstrap 5 + Chart.js frontend, FastAPI backend, MongoDB Atlas database, JWT auth with RBAC (Admin / Teacher / Student).

---

## What's included

- JWT authentication: register, login, logout, forgot/reset password, change password
- Role-based access control (admin / teacher / student)
- Admin: manage students, teachers, departments, courses (full CRUD), assign teachers to courses, enroll students, user management, audit logs, analytics dashboard
- Teacher: view assigned courses, mark attendance, upload/update grades, send notifications
- Student: view profile (edit contact info), view courses, attendance %, grades/GPA, notifications, change password
- Attendance: daily marking, percentage calculation, filtering by month/course
- Grades: weighted final marks calculation, letter grade + GPA, CGPA rank list
- Notifications: broadcast or role-targeted, read/unread tracking
- Reports: CSV, Excel (.xlsx), and PDF export for students and attendance
- File uploads: photos and documents, with type/size validation
- Security: bcrypt password hashing, JWT, input validation (Pydantic), rate limiting, CORS, path-traversal protection on file downloads, audit logging
- Seed script: 100 students, 20 teachers, 10 departments, 25 courses, sample attendance/grades/notifications
- Docker support for both backend and frontend + docker-compose

### Not included (out of scope for this simplified build)
QR code attendance, Google/OTP login, WebSocket real-time notifications, AI performance prediction, automated test suites, and full multi-diagram documentation set. These are straightforward to add later on top of this foundation — ask if you'd like any of them built out next.

---

## Project structure

```
sms-project/
├── backend/
│   ├── app/
│   │   ├── core/        # config, database, security, auth deps
│   │   ├── models/       # Pydantic schemas
│   │   ├── routes/       # API endpoints per module
│   │   ├── utils/        # pagination, audit logging
│   │   ├── main.py       # FastAPI app entrypoint
│   │   └── seed.py       # sample data generator
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # axios client with token refresh
│   │   ├── context/      # AuthContext
│   │   ├── components/   # AppLayout, DataTable
│   │   ├── pages/         # all screens
│   │   └── routes/        # ProtectedRoute
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 1. MongoDB Atlas setup

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user (username/password)
3. Under Network Access, allow your IP (or `0.0.0.0/0` for quick testing)
4. Copy the connection string from **Connect → Drivers** — looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

---

## 2. Backend setup (local, without Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: paste your MONGO_URI, set a strong JWT_SECRET_KEY

# Optional: populate sample data
python -m app.seed

# Run the API
uvicorn app.main:app --reload --port 8000
```

API docs (Swagger UI) will be available at `http://localhost:8000/docs`.

Seeded demo logins (after running `python -m app.seed`):
| Role    | Email               | Password     |
|---------|---------------------|--------------|
| Admin   | admin@sms.local      | Admin@12345  |
| Teacher | teacher1@sms.local   | Teacher@123  |
| Student | student1@sms.local   | Student@123  |

---

## 3. Frontend setup (local, without Docker)

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if your backend isn't on http://localhost:8000

npm run dev
```

App runs at `http://localhost:5173`.

---

## 4. Run everything with Docker Compose

```bash
# First, create backend/.env from backend/.env.example with your Mongo Atlas URI
docker compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

---

## 5. Cloud deployment

**Frontend → Vercel**
1. Push this repo to GitHub
2. Import the `frontend` folder as a new Vercel project
3. Set build command `npm run build`, output directory `dist`
4. Add environment variable `VITE_API_BASE_URL` pointing to your deployed backend URL

**Backend → Render**
1. Create a new Web Service on Render, point it at the `backend` folder
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env.example` (MONGO_URI, JWT_SECRET_KEY, CORS_ORIGINS — set this to your Vercel frontend URL, etc.)

**Database → MongoDB Atlas** (already cloud-hosted, see step 1)

---

## API overview

All endpoints are prefixed `/api`. Full interactive docs at `/docs` (Swagger) once the backend is running.

| Module | Base path |
|---|---|
| Auth | `/api/auth` |
| Students | `/api/students` |
| Teachers | `/api/teachers` |
| Departments | `/api/departments` |
| Courses | `/api/courses` |
| Attendance | `/api/attendance` |
| Grades | `/api/grades` |
| Notifications | `/api/notifications` |
| Analytics | `/api/analytics` |
| Reports | `/api/reports` |
| Files | `/api/files` |
| Admin | `/api/admin` |

Every list endpoint supports `page`, `limit`, and relevant `search`/filter query params, and returns `{ items, total, page, limit, pages }`.

---

## Security notes for production

- Change `JWT_SECRET_KEY` to a long random value (`openssl rand -hex 32`)
- Restrict `CORS_ORIGINS` to your actual frontend domain
- Restrict MongoDB Atlas Network Access to known IPs instead of `0.0.0.0/0`
- Put a real email provider behind `forgot-password` instead of the dev-only token currently returned in the response
- Consider disabling public self-registration as admin/teacher (currently anyone can register as any role — restrict this via an invite-only flow or remove the role selector from the register form)
