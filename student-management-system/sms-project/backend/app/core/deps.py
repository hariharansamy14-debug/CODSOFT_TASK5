"""
Dependency-injected auth guards:
- get_current_user: validates JWT, loads user from DB
- require_role(...): restricts an endpoint to one or more roles
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId

from app.core.database import get_db
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> dict:
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise CREDENTIALS_EXCEPTION

    user_id = payload.get("sub")
    if user_id is None:
        raise CREDENTIALS_EXCEPTION

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise CREDENTIALS_EXCEPTION
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")

    user["_id"] = str(user["_id"])
    return user


def require_role(*allowed_roles: str):
    """Usage: Depends(require_role('admin', 'teacher'))"""

    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker
