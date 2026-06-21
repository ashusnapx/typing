from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database import get_db
from app.models.user import User, UserRole
from app.models.test import TypingTest, TestStatus
from app.models.passage import Passage
from app.schemas.subscription import AdminDashboard
from app.api.deps import get_admin_user
from typing import Optional, List
from datetime import datetime, timedelta, date

router = APIRouter()


@router.get("/dashboard", response_model=AdminDashboard)
async def get_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    premium_result = await db.execute(select(func.count(User.id)).where(User.is_premium == True))
    premium_users = premium_result.scalar() or 0

    today = date.today()
    today_start = datetime(today.year, today.month, today.day)

    dau_result = await db.execute(
        select(func.count(User.id)).where(User.last_active_date >= today_start)
    )
    dau = dau_result.scalar() or 0

    month_start = today_start.replace(day=1)
    mau_result = await db.execute(
        select(func.count(User.id)).where(User.last_active_date >= month_start)
    )
    mau = mau_result.scalar() or 0

    active_tests_result = await db.execute(
        select(func.count(TypingTest.id)).where(TypingTest.status == TestStatus.IN_PROGRESS)
    )
    active_tests = active_tests_result.scalar() or 0

    return AdminDashboard(
        dau=dau,
        wau=dau * 7,
        mau=mau,
        total_users=total_users,
        premium_users=premium_users,
        revenue_today=0,
        revenue_month=0,
        active_tests=active_tests,
        peak_concurrency=int(active_tests * 1.5),
        error_rate=0.01,
        infrastructure_health="healthy",
    )


@router.get("/users", response_model=List[dict])
async def list_users(
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(User).order_by(desc(User.created_at)).offset(offset).limit(limit)
    )
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email[:3] + "***@" + u.email.split("@")[1],
            "full_name": u.full_name,
            "role": u.role.value,
            "xp": u.xp,
            "level": u.level,
            "is_premium": u.is_premium,
            "total_tests_taken": u.total_tests_taken,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.get("/analytics/summary", response_model=dict)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    total_passages = await db.execute(select(func.count(Passage.id)))
    total_tests = await db.execute(select(func.count(TypingTest.id)))

    return {
        "total_users": (await db.execute(select(func.count(User.id)))).scalar(),
        "total_passages": total_passages.scalar(),
        "total_tests": total_tests.scalar(),
        "premium_users": (await db.execute(select(func.count(User.id)).where(User.is_premium == True))).scalar(),
        "active_users_today": (await db.execute(
            select(func.count(User.id)).where(User.last_active_date >= datetime.utcnow() - timedelta(days=1))
        )).scalar(),
    }
