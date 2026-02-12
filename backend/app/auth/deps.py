from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.security import decode_access_token
from app.services import mongodb_service

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    token = credentials.credentials

    try:
        payload = decode_access_token(token)

        # 🔑 JWT subject (Google / OAuth / your auth)
        user_sub = payload.get("sub")

        if not user_sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        # 🔎 Fetch user from DB
        user = mongodb_service.get_user_by_id(user_sub)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        # ✅ NORMALIZED USER OBJECT (IMPORTANT)
        return {
            "id": str(user["_id"]),      # internal DB id (if needed)
            "sub": user_sub,             # auth / OAuth id (primary)
            "email": user.get("email"),
            "name": user.get("name"),
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )