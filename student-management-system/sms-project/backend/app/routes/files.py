import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/files", tags=["Files"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_DOC_TYPES = {"application/pdf", "application/msword",
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}


def _validate_and_save(file: UploadFile, allowed_types: set, subfolder: str) -> str:
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")

    folder = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(folder, safe_name)

    with open(path, "wb") as f:
        content = file.file.read(settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024 + 1)
        if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large")
        f.write(content)

    return f"/api/files/download/{subfolder}/{safe_name}"


@router.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    url = _validate_and_save(file, ALLOWED_IMAGE_TYPES, "photos")
    return {"url": url}


@router.post("/upload/document")
async def upload_document(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    url = _validate_and_save(file, ALLOWED_DOC_TYPES, "documents")
    return {"url": url}


@router.get("/download/{subfolder}/{filename}")
async def download_file(subfolder: str, filename: str, current_user: dict = Depends(get_current_user)):
    # Prevent path traversal
    if ".." in subfolder or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid path")

    path = os.path.join(settings.UPLOAD_DIR, subfolder, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)
