from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.security import hash_password
from app.models.student import StudentCreate, StudentUpdate
from app.utils.pagination import serialize_doc, paginate, log_audit

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("")
async def list_students(
    page: int = 1, limit: int = 20, search: Optional[str] = None,
    department_id: Optional[str] = None, semester: Optional[int] = None,
    status: Optional[str] = None,
    db=Depends(get_db), current_user: dict = Depends(get_current_user),
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"student_id": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    if department_id:
        query["department_id"] = department_id
    if semester:
        query["semester"] = semester
    if status:
        query["status"] = status

    return await paginate(db.students, query, page, limit)


@router.get("/{student_id}")
async def get_student(student_id: str, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return serialize_doc(student)


@router.post("", status_code=201)
async def create_student(
    payload: StudentCreate, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    if await db.students.find_one({"$or": [{"student_id": payload.student_id}, {"email": payload.email}]}):
        raise HTTPException(status_code=400, detail="Student ID or email already exists")

    data = payload.model_dump(exclude={"password"})
    data["date_of_birth"] = data["date_of_birth"].isoformat()
    data["created_at"] = datetime.now(timezone.utc)
    result = await db.students.insert_one(data)
    data["_id"] = result.inserted_id

    # Create a linked login account with role=student
    await db.users.insert_one({
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": "student",
        "is_active": True,
        "student_ref": str(result.inserted_id),
        "created_at": datetime.now(timezone.utc),
    })

    await log_audit(db, current_user["_id"], "create", "student", {"student_id": payload.student_id})
    return serialize_doc(data)


@router.put("/{student_id}")
async def update_student(
    student_id: str, payload: StudentUpdate, db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Admin can update any student; a student can update their own profile
    if current_user["role"] == "student" and current_user.get("student_ref") != student_id:
        raise HTTPException(status_code=403, detail="Cannot update another student's profile")
    if current_user["role"] not in ("admin", "student"):
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.students.update_one({"_id": ObjectId(student_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")

    await log_audit(db, current_user["_id"], "update", "student", {"id": student_id})
    student = await db.students.find_one({"_id": ObjectId(student_id)})
    return serialize_doc(student)


@router.delete("/{student_id}")
async def delete_student(
    student_id: str, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    result = await db.students.delete_one({"_id": ObjectId(student_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    await db.users.delete_one({"student_ref": student_id})
    await log_audit(db, current_user["_id"], "delete", "student", {"id": student_id})
    return {"message": "Student deleted"}
