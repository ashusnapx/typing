from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserProfileUpdate
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.state is not None:
        current_user.state = data.state
    if data.district is not None:
        current_user.district = data.district
    if data.city is not None:
        current_user.city = data.city
    if data.college is not None:
        current_user.college = data.college

    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.get("/stats", response_model=dict)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {
        "total_tests": current_user.total_tests_taken,
        "total_time_spent": current_user.total_time_spent_seconds,
        "best_wpm": current_user.best_wpm,
        "best_accuracy": current_user.best_accuracy,
        "xp": current_user.xp,
        "level": current_user.level,
        "streak_days": current_user.streak_days,
        "is_premium": current_user.is_premium,
    }
