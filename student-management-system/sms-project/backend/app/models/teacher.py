from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class TeacherCreate(BaseModel):
    teacher_id: str
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    department_id: str
    qualification: str
    experience_years: int = Field(..., ge=0)
    subjects: List[str] = []
    phone: str
    password: str = Field(..., min_length=8)


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    department_id: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0)
    subjects: Optional[List[str]] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None


class TeacherOut(BaseModel):
    id: str
    teacher_id: str
    name: str
    email: EmailStr
    department_id: str
    qualification: str
    experience_years: int
    subjects: List[str]
    phone: str
    photo_url: Optional[str] = None
    created_at: datetime
