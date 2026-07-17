from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.core.database import get_db
from app.core.deps import require_role
from app.utils.pagination import serialize_doc, paginate

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users")
async def list_users(page: int = 1, limit: int = 20, role: Optional[str] = None,
                      db=Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    query = {}
    if role:
        query["role"] = role
    result = await paginate(db.users, query, page, limit)
    for item in result["items"]:
        item.pop("password_hash", None)
    return result


@router.patch("/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, db=Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deactivated"}


@router.patch("/users/{user_id}/activate")
async def activate_user(user_id: str, db=Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_active": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User activated"}


@router.get("/audit-logs")
async def audit_logs(page: int = 1, limit: int = 50,
                      db=Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    return await paginate(db.audit_logs, {}, page, limit, sort_field="timestamp", sort_dir=-1)
