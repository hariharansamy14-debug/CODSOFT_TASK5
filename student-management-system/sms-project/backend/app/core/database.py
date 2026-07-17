"""
Async MongoDB connection using Motor, plus index setup on startup.
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("sms.database")


class Database:
    client: AsyncIOMotorClient = None
    db = None


database = Database()


async def connect_to_mongo():
    database.client = AsyncIOMotorClient(settings.MONGO_URI)
    database.db = database.client[settings.MONGO_DB_NAME]
    logger.info("Connected to MongoDB at %s", settings.MONGO_DB_NAME)
    await create_indexes()


async def close_mongo_connection():
    if database.client:
        database.client.close()
        logger.info("MongoDB connection closed")


async def create_indexes():
    """Create indexes required for uniqueness and search performance."""
    db = database.db

    await db.users.create_index("email", unique=True)
    await db.students.create_index("student_id", unique=True)
    await db.students.create_index("email", unique=True)
    await db.students.create_index([("name", "text"), ("email", "text")])
    await db.teachers.create_index("teacher_id", unique=True)
    await db.teachers.create_index("email", unique=True)
    await db.departments.create_index("code", unique=True)
    await db.courses.create_index("code", unique=True)
    await db.attendance.create_index([("student_id", 1), ("date", 1)])
    await db.grades.create_index([("student_id", 1), ("course_id", 1), ("semester", 1)])
    await db.audit_logs.create_index([("timestamp", -1)])


def get_db():
    """Dependency for route handlers to access the database instance."""
    return database.db
