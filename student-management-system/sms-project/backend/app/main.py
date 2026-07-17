import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes import (
    auth, departments, courses, students, teachers,
    attendance, grades, notifications, analytics, files, reports, admin,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sms.main")

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])

app = FastAPI(
    title="Student Management System API",
    description="Cloud-based Student Management System — FastAPI + MongoDB Atlas",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "message": "Validation error"},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Internal server error"},
    )


@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "env": settings.ENV}


app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(courses.router)
app.include_router(students.router)
app.include_router(teachers.router)
app.include_router(attendance.router)
app.include_router(grades.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(files.router)
app.include_router(reports.router)
app.include_router(admin.router)
