from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.utils.pagination import serialize_doc, paginate, log_audit

router = APIRouter(prefix="/api/grades", tags=["Grades"])

GRADE_POINTS = {"A+": 10, "A": 9, "B+": 8, "B": 7, "C+": 6, "C": 5, "D": 4, "F": 0}


def marks_to_grade(marks: float) -> str:
    if marks >= 90: return "A+"
    if marks >= 80: return "A"
    if marks >= 70: return "B+"
    if marks >= 60: return "B"
    if marks >= 50: return "C+"
    if marks >= 40: return "C"
    if marks >= 33: return "D"
    return "F"


class GradeEntry(BaseModel):
    student_id: str
    course_id: str
    semester: int
    assignment_marks: float = Field(0, ge=0, le=100)
    internal_marks: float = Field(0, ge=0, le=100)
    lab_marks: float = Field(0, ge=0, le=100)
    semester_marks: float = Field(0, ge=0, le=100)


@router.post("/upload", status_code=201)
async def upload_grade(
    payload: GradeEntry, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin", "teacher")),
):
    final_marks = round(
        payload.assignment_marks * 0.1 + payload.internal_marks * 0.2 +
        payload.lab_marks * 0.2 + payload.semester_marks * 0.5, 2
    )
    grade_letter = marks_to_grade(final_marks)

    doc = payload.model_dump()
    doc.update({
        "final_marks": final_marks,
        "grade_letter": grade_letter,
        "grade_point": GRADE_POINTS[grade_letter],
        "updated_by": current_user["_id"],
        "updated_at": datetime.now(timezone.utc),
    })

    await db.grades.update_one(
        {"student_id": payload.student_id, "course_id": payload.course_id, "semester": payload.semester},
        {"$set": doc},
        upsert=True,
    )
    await log_audit(db, current_user["_id"], "upload_grade", "grades",
                     {"student_id": payload.student_id, "course_id": payload.course_id})
    return {"message": "Grade recorded", "final_marks": final_marks, "grade": grade_letter}


@router.get("/student/{student_id}")
async def get_student_grades(student_id: str, semester: Optional[int] = None,
                              db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {"student_id": student_id}
    if semester:
        query["semester"] = semester
    cursor = db.grades.find(query)
    grades = [serialize_doc(g) async for g in cursor]

    if grades:
        total_points = sum(g["grade_point"] for g in grades)
        gpa = round(total_points / len(grades), 2)
    else:
        gpa = 0.0

    return {"student_id": student_id, "grades": grades, "gpa": gpa}


@router.get("/rank-list")
async def rank_list(department_id: Optional[str] = None, semester: Optional[int] = None,
                     db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Simple CGPA-based rank list across students who have grades recorded."""
    match_stage = {}
    if semester:
        match_stage["semester"] = semester

    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {"$group": {"_id": "$student_id", "avg_gpa": {"$avg": "$grade_point"}, "subjects": {"$sum": 1}}},
        {"$sort": {"avg_gpa": -1}},
    ]
    results = await db.grades.aggregate(pipeline).to_list(length=None)

    ranked = []
    for i, r in enumerate(results, start=1):
        student = await db.students.find_one({"_id": ObjectId(r["_id"])}) if ObjectId.is_valid(r["_id"]) else None
        if department_id and student and student.get("department_id") != department_id:
            continue
        ranked.append({
            "rank": i,
            "student_id": r["_id"],
            "student_name": student["name"] if student else "Unknown",
            "cgpa": round(r["avg_gpa"], 2),
            "subjects_counted": r["subjects"],
        })

    return {"rank_list": ranked}
