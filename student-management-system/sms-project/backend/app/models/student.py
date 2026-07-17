from datetime import date, datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class StudentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    GRADUATED = "graduated"
    SUSPENDED = "suspended"


class ParentDetails(BaseModel):
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[EmailStr] = None


class StudentCreate(BaseModel):
    student_id: str = Field(..., description="Unique roll/admission number")
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str
    department_id: str
    semester: int = Field(..., ge=1, le=12)
    date_of_birth: date
    gender: Gender
    address: str
    parent_details: Optional[ParentDetails] = None
    status: StudentStatus = StudentStatus.ACTIVE
    password: str = Field(..., min_length=8, description="Initial login password")


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=12)
    address: Optional[str] = None
    parent_details: Optional[ParentDetails] = None
    status: Optional[StudentStatus] = None
    photo_url: Optional[str] = None


class StudentOut(BaseModel):
    id: str
    student_id: str
    name: str
    email: EmailStr
    phone: str
    department_id: str
    semester: int
    date_of_birth: date
    gender: Gender
    address: str
    parent_details: Optional[ParentDetails] = None
    status: StudentStatus
    photo_url: Optional[str] = None
    created_at: datetime
