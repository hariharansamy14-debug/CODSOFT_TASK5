from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.security import hash_password
from app.models.teacher import TeacherCreate, TeacherUpdate
from app.utils.pagination import serialize_doc, paginate, log_audit

router = APIRouter(prefix="/api/teachers", tags=["Teachers"])


@router.get("")
async def list_teachers(
    page: int = 1, limit: int = 20, search: Optional[str] = None,
    department_id: Optional[str] = None,
    db=Depends(get_db), current_user: dict = Depends(get_current_user),
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"teacher_id": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    if department_id:
        query["department_id"] = department_id
    return await paginate(db.teachers, query, page, limit)


@router.get("/{teacher_id}")
async def get_teacher(teacher_id: str, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    teacher = await db.teachers.find_one({"_id": ObjectId(teacher_id)})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return serialize_doc(teacher)


@router.post("", status_code=201)
async def create_teacher(
    payload: TeacherCreate, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    if await db.teachers.find_one({"$or": [{"teacher_id": payload.teacher_id}, {"email": payload.email}]}):
        raise HTTPException(status_code=400, detail="Teacher ID or email already exists")

    data = payload.model_dump(exclude={"password"})
    data["created_at"] = datetime.now(timezone.utc)
    result = await db.teachers.insert_one(data)
    data["_id"] = result.inserted_id

    await db.users.insert_one({
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": "teacher",
        "is_active": True,
        "teacher_ref": str(result.inserted_id),
        "created_at": datetime.now(timezone.utc),
    })

    await log_audit(db, current_user["_id"], "create", "teacher", {"teacher_id": payload.teacher_id})
    return serialize_doc(data)


@router.put("/{teacher_id}")
async def update_teacher(
    teacher_id: str, payload: TeacherUpdate, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.teachers.update_one({"_id": ObjectId(teacher_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")

    await log_audit(db, current_user["_id"], "update", "teacher", {"id": teacher_id})
    teacher = await db.teachers.find_one({"_id": ObjectId(teacher_id)})
    return serialize_doc(teacher)


@router.delete("/{teacher_id}")
async def delete_teacher(
    teacher_id: str, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    result = await db.teachers.delete_one({"_id": ObjectId(teacher_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    await db.users.delete_one({"teacher_ref": teacher_id})
    await log_audit(db, current_user["_id"], "delete", "teacher", {"id": teacher_id})
    return {"message": "Teacher deleted"}


@router.get("/{teacher_id}/courses")
async def get_teacher_courses(teacher_id: str, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    cursor = db.courses.find({"teacher_id": teacher_id})
    courses = [serialize_doc(c) async for c in cursor]
    return {"items": courses, "total": len(courses)}
