import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import csv

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.utils.pagination import serialize_doc

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/students/csv")
async def export_students_csv(db=Depends(get_db), current_user: dict = Depends(require_role("admin", "teacher"))):
    students = [serialize_doc(s) async for s in db.students.find({})]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID", "Name", "Email", "Phone", "Department", "Semester", "Status"])
    for s in students:
        writer.writerow([s.get("student_id"), s.get("name"), s.get("email"), s.get("phone"),
                          s.get("department_id"), s.get("semester"), s.get("status")])
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students_report.csv"},
    )


@router.get("/students/excel")
async def export_students_excel(db=Depends(get_db), current_user: dict = Depends(require_role("admin", "teacher"))):
    from openpyxl import Workbook

    students = [serialize_doc(s) async for s in db.students.find({})]

    wb = Workbook()
    ws = wb.active
    ws.title = "Students"
    ws.append(["Student ID", "Name", "Email", "Phone", "Department", "Semester", "Status"])
    for s in students:
        ws.append([s.get("student_id"), s.get("name"), s.get("email"), s.get("phone"),
                   s.get("department_id"), s.get("semester"), s.get("status")])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=students_report.xlsx"},
    )


@router.get("/students/pdf")
async def export_students_pdf(db=Depends(get_db), current_user: dict = Depends(require_role("admin", "teacher"))):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

    students = [serialize_doc(s) async for s in db.students.find({})]

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    data = [["Student ID", "Name", "Department", "Semester", "Status"]]
    for s in students:
        data.append([s.get("student_id"), s.get("name"), s.get("department_id"),
                     str(s.get("semester")), s.get("status")])

    table = Table(data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
    ]))
    doc.build([table])
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=students_report.pdf"},
    )


@router.get("/attendance/csv")
async def export_attendance_csv(db=Depends(get_db), current_user: dict = Depends(require_role("admin", "teacher"))):
    records = [serialize_doc(r) async for r in db.attendance.find({})]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID", "Course ID", "Date", "Status"])
    for r in records:
        writer.writerow([r.get("student_id"), r.get("course_id"), r.get("date"), r.get("status")])
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"},
    )
