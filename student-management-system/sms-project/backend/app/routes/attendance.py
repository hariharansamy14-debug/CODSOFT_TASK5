from datetime import datetime, timezone, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.utils.pagination import serialize_doc, paginate, log_audit

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


class AttendanceStatus:
    PRESENT = "present"
    ABSENT = "absent"
    LEAVE = "leave"


class AttendanceEntry(BaseModel):
    student_id: str
    status: str = Field(..., pattern="^(present|absent|leave)$")


class MarkAttendanceRequest(BaseModel):
    course_id: str
    date: date
    entries: List[AttendanceEntry]


@router.post("/mark", status_code=201)
async def mark_attendance(
    payload: MarkAttendanceRequest, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin", "teacher")),
):
    date_str = payload.date.isoformat()
    inserted = 0
    for entry in payload.entries:
        await db.attendance.update_one(
            {"student_id": entry.student_id, "course_id": payload.course_id, "date": date_str},
            {"$set": {
                "student_id": entry.student_id,
                "course_id": payload.course_id,
                "date": date_str,
                "status": entry.status,
                "marked_by": current_user["_id"],
                "updated_at": datetime.now(timezone.utc),
            }},
            upsert=True,
        )
        inserted += 1

    await log_audit(db, current_user["_id"], "mark_attendance", "attendance",
                     {"course_id": payload.course_id, "date": date_str, "count": inserted})
    return {"message": f"Attendance marked for {inserted} students"}


@router.get("")
async def list_attendance(
    student_id: Optional[str] = None, course_id: Optional[str] = None,
    month: Optional[str] = None,  # format YYYY-MM
    page: int = 1, limit: int = 50,
    db=Depends(get_db), current_user: dict = Depends(get_current_user),
):
    query = {}
    if student_id:
        query["student_id"] = student_id
    if course_id:
        query["course_id"] = course_id
    if month:
        query["date"] = {"$regex": f"^{month}"}
    return await paginate(db.attendance, query, page, limit, sort_field="date", sort_dir=-1)


@router.get("/percentage/{student_id}")
async def attendance_percentage(
    student_id: str, course_id: Optional[str] = None,
    db=Depends(get_db), current_user: dict = Depends(get_current_user),
):
    query = {"student_id": student_id}
    if course_id:
        query["course_id"] = course_id

    total = await db.attendance.count_documents(query)
    present = await db.attendance.count_documents({**query, "status": "present"})
    percentage = round((present / total) * 100, 2) if total else 0.0

    return {
        "student_id": student_id,
        "course_id": course_id,
        "total_days": total,
        "present_days": present,
        "percentage": percentage,
    }
