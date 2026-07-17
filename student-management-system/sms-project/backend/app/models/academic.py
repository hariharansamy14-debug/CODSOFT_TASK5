from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=10)
    name: str
    hod_teacher_id: Optional[str] = None
    description: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    hod_teacher_id: Optional[str] = None
    description: Optional[str] = None


class DepartmentOut(BaseModel):
    id: str
    code: str
    name: str
    hod_teacher_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime


class CourseCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=20)
    title: str
    credits: int = Field(..., ge=1, le=10)
    semester: int = Field(..., ge=1, le=12)
    department_id: str
    teacher_id: Optional[str] = None
    description: Optional[str] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    credits: Optional[int] = Field(None, ge=1, le=10)
    semester: Optional[int] = Field(None, ge=1, le=12)
    teacher_id: Optional[str] = None
    description: Optional[str] = None


class CourseOut(BaseModel):
    id: str
    code: str
    title: str
    credits: int
    semester: int
    department_id: str
    teacher_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
