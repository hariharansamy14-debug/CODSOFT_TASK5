"""
Seed the database with sample data for local development / demos.
Run with: python -m app.seed  (from the backend/ directory, with .env configured)
"""
import asyncio
import random
from datetime import datetime, timezone, date

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import hash_password

FIRST_NAMES = ["Aditi", "Rahul", "Priya", "Karthik", "Sneha", "Arjun", "Divya", "Vikram",
               "Ananya", "Rohan", "Meera", "Sanjay", "Neha", "Kiran", "Pooja", "Amit",
               "Deepa", "Suresh", "Kavya", "Manoj"]
LAST_NAMES = ["Sharma", "Iyer", "Reddy", "Nair", "Gupta", "Menon", "Rao", "Kumar",
              "Pillai", "Verma", "Joshi", "Patel"]
DEPARTMENTS = [
    ("CSE", "Computer Science & Engineering"),
    ("ECE", "Electronics & Communication"),
    ("MECH", "Mechanical Engineering"),
    ("CIVIL", "Civil Engineering"),
    ("EEE", "Electrical & Electronics"),
    ("IT", "Information Technology"),
    ("CHEM", "Chemical Engineering"),
    ("BIOTECH", "Biotechnology"),
    ("MBA", "Business Administration"),
    ("MCA", "Computer Applications"),
]


def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


async def seed():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]

    print("Clearing existing collections...")
    for coll in ["users", "students", "teachers", "departments", "courses",
                 "attendance", "grades", "notifications", "enrollments", "audit_logs"]:
        await db[coll].delete_many({})

    print("Seeding admin user...")
    await db.users.insert_one({
        "name": "System Admin",
        "email": "admin@sms.local",
        "password_hash": hash_password("Admin@12345"),
        "role": "admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    })

    print("Seeding departments...")
    dept_ids = []
    for code, name in DEPARTMENTS:
        result = await db.departments.insert_one({
            "code": code, "name": name, "hod_teacher_id": None,
            "description": f"Department of {name}",
            "created_at": datetime.now(timezone.utc),
        })
        dept_ids.append(str(result.inserted_id))

    print("Seeding teachers...")
    teacher_ids = []
    for i in range(1, 21):
        name = random_name()
        email = f"teacher{i}@sms.local"
        dept_id = random.choice(dept_ids)
        result = await db.teachers.insert_one({
            "teacher_id": f"T{1000 + i}",
            "name": name, "email": email,
            "department_id": dept_id,
            "qualification": random.choice(["M.Tech", "Ph.D", "M.Sc", "MBA"]),
            "experience_years": random.randint(1, 20),
            "subjects": ["Subject A", "Subject B"],
            "phone": f"98765{40000 + i}",
            "photo_url": None,
            "created_at": datetime.now(timezone.utc),
        })
        teacher_ids.append(str(result.inserted_id))
        await db.users.insert_one({
            "name": name, "email": email,
            "password_hash": hash_password("Teacher@123"),
            "role": "teacher", "is_active": True,
            "teacher_ref": str(result.inserted_id),
            "created_at": datetime.now(timezone.utc),
        })

    print("Seeding courses...")
    course_ids = []
    for i in range(1, 26):
        dept_id = random.choice(dept_ids)
        result = await db.courses.insert_one({
            "code": f"C{100 + i}",
            "title": f"Course {i}",
            "credits": random.choice([2, 3, 4]),
            "semester": random.randint(1, 8),
            "department_id": dept_id,
            "teacher_id": random.choice(teacher_ids),
            "description": f"Description for Course {i}",
            "created_at": datetime.now(timezone.utc),
        })
        course_ids.append(str(result.inserted_id))

    print("Seeding students...")
    student_ids = []
    for i in range(1, 101):
        name = random_name()
        email = f"student{i}@sms.local"
        dept_id = random.choice(dept_ids)
        result = await db.students.insert_one({
            "student_id": f"S{2000 + i}",
            "name": name, "email": email,
            "phone": f"91234{50000 + i}",
            "department_id": dept_id,
            "semester": random.randint(1, 8),
            "date_of_birth": date(2003, random.randint(1, 12), random.randint(1, 28)).isoformat(),
            "gender": random.choice(["male", "female"]),
            "address": f"{random.randint(1,999)} Main Street, City",
            "parent_details": {
                "father_name": random_name(),
                "mother_name": random_name(),
                "guardian_phone": f"90000{i:05d}",
            },
            "status": "active",
            "photo_url": None,
            "created_at": datetime.now(timezone.utc),
        })
        student_ids.append(str(result.inserted_id))
        await db.users.insert_one({
            "name": name, "email": email,
            "password_hash": hash_password("Student@123"),
            "role": "student", "is_active": True,
            "student_ref": str(result.inserted_id),
            "created_at": datetime.now(timezone.utc),
        })

    print("Seeding attendance records...")
    for student_id in student_ids[:40]:
        course_id = random.choice(course_ids)
        for day in range(1, 21):
            await db.attendance.insert_one({
                "student_id": student_id, "course_id": course_id,
                "date": date(2026, 6, day).isoformat(),
                "status": random.choices(["present", "absent", "leave"], weights=[80, 15, 5])[0],
                "marked_by": "seed_script",
                "updated_at": datetime.now(timezone.utc),
            })

    print("Seeding grades...")
    for student_id in student_ids[:60]:
        for course_id in random.sample(course_ids, 3):
            assignment = random.uniform(50, 100)
            internal = random.uniform(50, 100)
            lab = random.uniform(50, 100)
            semester_marks = random.uniform(40, 100)
            final = round(assignment*0.1 + internal*0.2 + lab*0.2 + semester_marks*0.5, 2)
            grade_letter = "A+" if final >= 90 else "A" if final >= 80 else "B+" if final >= 70 else "B" if final >= 60 else "C+" if final >= 50 else "C" if final >= 40 else "F"
            grade_point = {"A+":10,"A":9,"B+":8,"B":7,"C+":6,"C":5,"D":4,"F":0}[grade_letter]
            await db.grades.insert_one({
                "student_id": student_id, "course_id": course_id, "semester": random.randint(1,8),
                "assignment_marks": round(assignment,2), "internal_marks": round(internal,2),
                "lab_marks": round(lab,2), "semester_marks": round(semester_marks,2),
                "final_marks": final, "grade_letter": grade_letter, "grade_point": grade_point,
                "updated_by": "seed_script", "updated_at": datetime.now(timezone.utc),
            })

    print("Seeding notifications...")
    await db.notifications.insert_many([
        {"title": "Welcome", "message": "Welcome to the new semester!", "target_role": None,
         "sender_id": "system", "sender_role": "admin", "created_at": datetime.now(timezone.utc), "read_by": []},
        {"title": "Exam Schedule Released", "message": "Check your dashboard for exam dates.",
         "target_role": "student", "sender_id": "system", "sender_role": "admin",
         "created_at": datetime.now(timezone.utc), "read_by": []},
    ])

    print("\nSeed complete!")
    print("Admin login:   admin@sms.local / Admin@12345")
    print("Teacher login: teacher1@sms.local / Teacher@123")
    print("Student login: student1@sms.local / Student@123")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
