"""
Shared helpers for list endpoints: pagination + basic filter building.
"""
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId


def serialize_doc(doc: dict) -> dict:
    """Convert Mongo ObjectId -> str for JSON responses."""
    if doc is None:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


async def paginate(collection, query: dict, page: int = 1, limit: int = 20, sort_field: str = "created_at", sort_dir: int = -1):
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    skip = (page - 1) * limit

    total = await collection.count_documents(query)
    cursor = collection.find(query).sort(sort_field, sort_dir).skip(skip).limit(limit)
    items = [serialize_doc(doc) async for doc in cursor]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit else 0,
    }


async def log_audit(db, user_id: str, action: str, resource: str, details: Optional[dict] = None):
    await db.audit_logs.insert_one({
        "user_id": user_id,
        "action": action,
        "resource": resource,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc),
    })
