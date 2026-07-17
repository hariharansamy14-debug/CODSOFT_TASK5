from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.academic import CourseCreate, CourseUpdate
from app.utils.pagination import serialize_doc, paginate, log_audit

router = APIRouter(prefix="/api/courses", tags=["Courses"])


@router.get("")
async def list_courses(
    page: int = 1, limit: int = 20, search: Optional[str] = None,
    department_id: Optional[str] = None, semester: Optional[int] = None,
    db=Depends(get_db), current_user: dict = Depends(get_current_user),
):
    query = {}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}},
        ]
    if department_id:
        query["department_id"] = department_id
    if semester:
        query["semester"] = semester
    return await paginate(db.courses, query, page, limit, sort_field="code", sort_dir=1)


@router.get("/{course_id}")
async def get_course(course_id: str, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return serialize_doc(course)


@router.post("", status_code=201)
async def create_course(
    payload: CourseCreate, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    if await db.courses.find_one({"code": payload.code}):
        raise HTTPException(status_code=400, detail="Course code already exists")

    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.courses.insert_one(doc)
    doc["_id"] = result.inserted_id

    await log_audit(db, current_user["_id"], "create", "course", {"code": payload.code})
    return serialize_doc(doc)


@router.put("/{course_id}")
async def update_course(
    course_id: str, payload: CourseUpdate, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.courses.update_one({"_id": ObjectId(course_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")

    await log_audit(db, current_user["_id"], "update", "course", {"id": course_id})
    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    return serialize_doc(course)


@router.delete("/{course_id}")
async def delete_course(
    course_id: str, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    result = await db.courses.delete_one({"_id": ObjectId(course_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    await log_audit(db, current_user["_id"], "delete", "course", {"id": course_id})
    return {"message": "Course deleted"}


@router.post("/{course_id}/assign-teacher/{teacher_id}")
async def assign_teacher(
    course_id: str, teacher_id: str, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    teacher = await db.teachers.find_one({"_id": ObjectId(teacher_id)})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    result = await db.courses.update_one(
        {"_id": ObjectId(course_id)}, {"$set": {"teacher_id": teacher_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")

    await log_audit(db, current_user["_id"], "assign_teacher", "course", {"course_id": course_id, "teacher_id": teacher_id})
    return {"message": "Teacher assigned to course"}


@router.post("/{course_id}/enroll/{student_id}")
async def enroll_student(
    course_id: str, student_id: str, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    student = await db.students.find_one({"_id": ObjectId(student_id)})
    if not course or not student:
        raise HTTPException(status_code=404, detail="Course or student not found")

    existing = await db.enrollments.find_one({"course_id": course_id, "student_id": student_id})
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled")

    await db.enrollments.insert_one({
        "course_id": course_id,
        "student_id": student_id,
        "enrolled_at": datetime.now(timezone.utc),
    })
    await log_audit(db, current_user["_id"], "enroll", "course", {"course_id": course_id, "student_id": student_id})
    return {"message": "Student enrolled in course"}
