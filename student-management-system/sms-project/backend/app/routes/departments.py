from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.academic import DepartmentCreate, DepartmentUpdate
from app.utils.pagination import serialize_doc, paginate, log_audit

router = APIRouter(prefix="/api/departments", tags=["Departments"])


@router.get("")
async def list_departments(
    page: int = 1, limit: int = 20, search: Optional[str] = None,
    db=Depends(get_db), current_user: dict = Depends(get_current_user),
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}},
        ]
    return await paginate(db.departments, query, page, limit, sort_field="name", sort_dir=1)


@router.get("/{dept_id}")
async def get_department(dept_id: str, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    dept = await db.departments.find_one({"_id": ObjectId(dept_id)})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return serialize_doc(dept)


@router.post("", status_code=201)
async def create_department(
    payload: DepartmentCreate, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    if await db.departments.find_one({"code": payload.code}):
        raise HTTPException(status_code=400, detail="Department code already exists")

    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.departments.insert_one(doc)
    doc["_id"] = result.inserted_id

    await log_audit(db, current_user["_id"], "create", "department", {"code": payload.code})
    return serialize_doc(doc)


@router.put("/{dept_id}")
async def update_department(
    dept_id: str, payload: DepartmentUpdate, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.departments.update_one({"_id": ObjectId(dept_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")

    await log_audit(db, current_user["_id"], "update", "department", {"id": dept_id})
    dept = await db.departments.find_one({"_id": ObjectId(dept_id)})
    return serialize_doc(dept)


@router.delete("/{dept_id}")
async def delete_department(
    dept_id: str, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    result = await db.departments.delete_one({"_id": ObjectId(dept_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    await log_audit(db, current_user["_id"], "delete", "department", {"id": dept_id})
    return {"message": "Department deleted"}


@router.get("/{dept_id}/statistics")
async def department_statistics(dept_id: str, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    student_count = await db.students.count_documents({"department_id": dept_id})
    teacher_count = await db.teachers.count_documents({"department_id": dept_id})
    course_count = await db.courses.count_documents({"department_id": dept_id})
    return {
        "department_id": dept_id,
        "total_students": student_count,
        "total_teachers": teacher_count,
        "total_courses": course_count,
    }
