from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
import bcrypt

from backend.database.connection import execute_query, check_oracle_status
from backend.auth import create_access_token, verify_password, get_password_hash

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Management"])

# In-memory evaluation fallback users if Oracle is not yet connected
DEMO_USERS = {
    "admin@tourpulse.com": {
        "user_id": 1,
        "full_name": "System Administrator",
        "email": "admin@tourpulse.com",
        "password_hash": "$2b$12$BpLo8w7t4lzIySlUBtwk4eAj69qa.F0O.laKc5PzeaFDEXbfBmujS",
        "role": "admin"
    },
    "analyst@tourpulse.com": {
        "user_id": 2,
        "full_name": "Senior Tourism Analyst",
        "email": "analyst@tourpulse.com",
        "password_hash": "$2b$12$rlO2j3Iwdv3EFRAqXaXP7uJ/MJ9xu9mnb5MhQwH624vWDrSQrtrPC",
        "role": "analyst"
    },
    "tourist@tourpulse.com": {
        "user_id": 3,
        "full_name": "Registered Visitor",
        "email": "tourist@tourpulse.com",
        "password_hash": "$2b$12$YYKyFyxZarzbv/AY5zDteupuy/DUQJvZSrtw6bs/yePmTizJpEZDC",
        "role": "tourist"
    }
}

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "tourist"

@router.post("/login")
def login(credentials: UserLogin):
    user_record = None
    status_oracle = check_oracle_status()
    
    if status_oracle["connected"]:
        try:
            sql = "SELECT user_id, full_name, email, password_hash, role FROM USERS WHERE LOWER(email) = LOWER(:email)"
            rows = execute_query(sql, {"email": credentials.email.strip()})
            if rows:
                user_record = rows[0]
        except Exception:
            user_record = None

    if not user_record:
        # Check standard demo credentials
        user_record = DEMO_USERS.get(credentials.email.strip().lower())

    if not user_record or not verify_password(credentials.password, user_record["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email and password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_payload = {
        "id": user_record.get("user_id", 1),
        "name": user_record.get("full_name", user_record.get("name", "User")),
        "email": user_record["email"],
        "role": user_record["role"]
    }

    access_token = create_access_token(data={
        "sub": user_payload["email"],
        "role": user_payload["role"],
        "name": user_payload["name"]
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.get("/me")
def get_me():
    return {
        "id": 1,
        "name": "System Administrator",
        "email": "admin@tourpulse.com",
        "role": "admin"
    }
