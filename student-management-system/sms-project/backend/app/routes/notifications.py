from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.utils.pagination import serialize_doc, paginate, log_audit

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


class NotificationCreate(BaseModel):
    title: str
    message: str
    target_role: Optional[str] = None   # "student" | "teacher" | None (broadcast to all)
    target_user_ids: Optional[List[str]] = None  # specific recipients


@router.post("", status_code=201)
async def create_notification(
    payload: NotificationCreate, db=Depends(get_db),
    current_user: dict = Depends(require_role("admin", "teacher")),
):
    doc = payload.model_dump()
    doc.update({
        "sender_id": current_user["_id"],
        "sender_role": current_user["role"],
        "created_at": datetime.now(timezone.utc),
        "read_by": [],
    })
    result = await db.notifications.insert_one(doc)
    doc["_id"] = result.inserted_id

    await log_audit(db, current_user["_id"], "create", "notification", {"title": payload.title})
    return serialize_doc(doc)


@router.get("")
async def list_notifications(
    page: int = 1, limit: int = 20,
    db=Depends(get_db), current_user: dict = Depends(get_current_user),
):
    query = {
        "$or": [
            {"target_role": current_user["role"]},
            {"target_role": None},
            {"target_user_ids": current_user["_id"]},
        ]
    }
    return await paginate(db.notifications, query, page, limit)


@router.post("/{notif_id}/read")
async def mark_read(notif_id: str, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"_id": ObjectId(notif_id)},
        {"$addToSet": {"read_by": current_user["_id"]}},
    )
    return {"message": "Marked as read"}
