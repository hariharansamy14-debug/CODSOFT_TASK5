from fastapi import APIRouter, Depends
from app.core.database import get_db
from app.core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
async def overview(db=Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    total_students = await db.students.count_documents({})
    total_teachers = await db.teachers.count_documents({})
    total_courses = await db.courses.count_documents({})
    total_departments = await db.departments.count_documents({})

    total_attendance = await db.attendance.count_documents({})
    present_attendance = await db.attendance.count_documents({"status": "present"})
    attendance_pct = round((present_attendance / total_attendance) * 100, 2) if total_attendance else 0.0

    total_grades = await db.grades.count_documents({})
    passed = await db.grades.count_documents({"grade_letter": {"$ne": "F"}})
    failed = total_grades - passed

    # Grade distribution
    pipeline = [{"$group": {"_id": "$grade_letter", "count": {"$sum": 1}}}]
    grade_dist_cursor = db.grades.aggregate(pipeline)
    grade_distribution = {doc["_id"]: doc["count"] async for doc in grade_dist_cursor}

    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_courses": total_courses,
        "total_departments": total_departments,
        "attendance_percentage": attendance_pct,
        "pass_count": passed,
        "fail_count": failed,
        "grade_distribution": grade_distribution,
    }


@router.get("/department-performance")
async def department_performance(db=Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    departments = await db.departments.find({}).to_list(length=None)
    results = []
    for dept in departments:
        dept_id = str(dept["_id"])
        student_ids = [str(s["_id"]) async for s in db.students.find({"department_id": dept_id}, {"_id": 1})]
        if not student_ids:
            avg_gpa = 0.0
        else:
            pipeline = [
                {"$match": {"student_id": {"$in": student_ids}}},
                {"$group": {"_id": None, "avg_gpa": {"$avg": "$grade_point"}}},
            ]
            agg = await db.grades.aggregate(pipeline).to_list(length=1)
            avg_gpa = round(agg[0]["avg_gpa"], 2) if agg else 0.0

        results.append({
            "department": dept["name"],
            "code": dept["code"],
            "student_count": len(student_ids),
            "avg_gpa": avg_gpa,
        })
    return {"departments": results}
