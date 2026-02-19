from datetime import timedelta,datetime

from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile,BackgroundTasks
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token



from app.auth.deps import get_current_user
from app.auth.security import create_access_token, get_password_hash, verify_password
from app.config import GOOGLE_CLIENT_ID
from app.models.schemas import (
    GoogleAuthIn,
    Token,
    UserCreate,
    UserLogin,
    UserOut,
)
from app.services import mongodb_service
from app.services.cloudinary_services import upload_image_bytes_to_cloudinary
import random
from app.services.redis_service import redis_client
from app.services.email_service import send_otp_email
from app.models.schemas import ForgotPasswordIn, VerifyOtpIn, ResetPasswordIn

router = APIRouter()


@router.post("/register", response_model=Token)
def register(user_in: UserCreate):
    existing = mongodb_service.get_user_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    password_hash = get_password_hash(user_in.password)
    user_id = mongodb_service.create_user(
        name=user_in.name or user_in.email.split("@")[0],
        email=user_in.email,
        password_hash=password_hash,
        auth_provider="local",
    )

    access_token = create_access_token(
    data={"sub": str(user_id)}
)


    user_out = UserOut(
        id=user_id,
        email=user_in.email,
        name=user_in.name,
        auth_provider="local",
    )
    return Token(access_token=access_token, user=user_out)


@router.post("/login", response_model=Token)
def login(credentials: UserLogin):
    user = mongodb_service.get_user_by_email(credentials.email)
    if not user or not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    user_id = user.get("id") or user.get("_id")
    access_token = create_access_token(
    data={"sub": str(user_id)}
)


    user_out = UserOut(
        id=str(user_id),
        email=user["email"],
        name=user.get("name"),
        auth_provider=user.get("auth_provider", "local"),
        picture=user.get("picture"),
    )
    return Token(access_token=access_token, user=user_out)


@router.post("/google", response_model=Token)
def google_login(payload: GoogleAuthIn):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google client ID not configured on server",
        )

    try:
        idinfo = id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google ID token",
        )

    email = idinfo.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token does not contain email",
        )

    name = idinfo.get("name") or email.split("@")[0]
    picture = idinfo.get("picture")
    google_sub = idinfo.get("sub")

    user = mongodb_service.upsert_google_user(
        email=email,
        name=name,
        google_id=google_sub,
        picture=picture,
    )

    user_id = user.get("id") or user.get("_id")
    access_token = create_access_token(data={"sub": user_id})

    user_out = UserOut(
        id=str(user_id),
        email=email,
        name=name,
        auth_provider="google",
        picture=picture,
    )
    return Token(access_token=access_token, user=user_out)

@router.get("/me", response_model=UserOut)
def get_me(current_user=Depends(get_current_user)):
    return UserOut(
        id=str(current_user.get("_id") or current_user.get("id")),
        email=current_user["email"],
        name=current_user.get("name"),
        auth_provider=current_user.get("auth_provider", "local"),
        picture=current_user.get("picture"),
    )





@router.put("/edit-profile", response_model=UserOut)
async def edit_profile(
    name: str = Form(None),
    email: str = Form(None),
    password: str = Form(None),
    picture: UploadFile = File(None),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user.get("_id") or current_user.get("id"))

    update_data = {}

    # ✅ Update name
    if name:
        update_data["name"] = name

    # ✅ Update email (check duplicate)
    if email and email != current_user["email"]:
        existing = mongodb_service.get_user_by_email(email)
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already in use",
            )
        update_data["email"] = email

    # ✅ Update password
    if password:
        update_data["password_hash"] = get_password_hash(password)

    # ✅ Upload new picture
    if picture:
        contents = await picture.read()

        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image exceeds 10MB limit")

        image_url = upload_image_bytes_to_cloudinary(contents, picture.filename)
        update_data["picture"] = image_url

    # 🚫 Nothing to update
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    # 🔥 Update user in DB
    updated_user = mongodb_service.update_user(user_id, update_data)

    return UserOut(
        id=user_id,
        email=updated_user["email"],
        name=updated_user.get("name"),
        auth_provider=updated_user.get("auth_provider", "local"),
        picture=updated_user.get("picture"),
    )

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordIn):
    user = mongodb_service.get_user_by_email(payload.email)

    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # Store in Redis (expire in 5 min = 300 seconds)
    redis_client.setex(f"otp:{payload.email}", 300, otp)

    # Send Email
    send_otp_email(payload.email, otp)

    return {"message": "OTP sent successfully"}

@router.post("/verify-otp")
def verify_otp(payload: VerifyOtpIn):
    stored_otp = redis_client.get(f"otp:{payload.email}")

    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP expired or not found")

    if stored_otp != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # OTP valid → allow reset (store reset flag for 10 min)
    redis_client.setex(f"reset_allowed:{payload.email}", 600, "true")

    return {"message": "OTP verified successfully"}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordIn):
    reset_flag = redis_client.get(f"reset_allowed:{payload.email}")

    if not reset_flag:
        raise HTTPException(
            status_code=400,
            detail="OTP verification required"
        )

    user = mongodb_service.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash new password
    hashed_password = get_password_hash(payload.new_password)

    # Update user
    mongodb_service.update_user(
        str(user.get("_id")),
        {"password_hash": hashed_password}
    )

    # Cleanup Redis
    redis_client.delete(f"otp:{payload.email}")
    redis_client.delete(f"reset_allowed:{payload.email}")

    return {"message": "Password reset successfully"}

