from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription, Payment
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse, PaymentResponse
from app.api.deps import get_current_user
from uuid import uuid4
from datetime import datetime, timedelta

router = APIRouter()


PLAN_PRICES = {
    "premium_monthly": 299,
    "premium_quarterly": 799,
    "premium_yearly": 2499,
}

PLAN_DURATIONS = {
    "premium_monthly": 30,
    "premium_quarterly": 90,
    "premium_yearly": 365,
}


@router.post("/create-order", response_model=dict)
async def create_subscription_order(
    data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")

    amount = PLAN_PRICES[data.plan]
    return {
        "order_id": str(uuid4()),
        "amount": amount,
        "currency": "INR",
        "plan": data.plan,
    }


@router.post("/verify", response_model=SubscriptionResponse)
async def verify_payment(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plan = data.get("plan", "premium_monthly")
    provider_payment_id = data.get("provider_payment_id", "")

    duration = PLAN_DURATIONS.get(plan, 30)
    now = datetime.utcnow()

    subscription = Subscription(
        id=uuid4(),
        user_id=current_user.id,
        plan=plan,
        status="active",
        start_date=now,
        end_date=now + timedelta(days=duration),
        auto_renew=True,
    )
    db.add(subscription)

    payment = Payment(
        id=uuid4(),
        user_id=current_user.id,
        subscription_id=subscription.id,
        amount=PLAN_PRICES.get(plan, 299),
        currency="INR",
        provider=data.get("provider", "razorpay"),
        provider_payment_id=provider_payment_id,
        status="completed",
        gst_invoice_number=f"GST-{now.strftime('%Y%m')}-{uuid4().hex[:8].upper()}",
        gst_amount=PLAN_PRICES.get(plan, 299) * 0.18,
    )
    db.add(payment)

    current_user.is_premium = True
    current_user.premium_expiry = now + timedelta(days=duration)

    await db.flush()

    return SubscriptionResponse(
        plan=plan,
        status="active",
        start_date=now.isoformat(),
        end_date=(now + timedelta(days=duration)).isoformat(),
        auto_renew=True,
    )


@router.get("/status", response_model=SubscriptionResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.created_at.desc())
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        return SubscriptionResponse(
            plan="free",
            status="active",
            start_date=datetime.utcnow().isoformat(),
            auto_renew=False,
        )

    return SubscriptionResponse(
        plan=subscription.plan,
        status=subscription.status,
        start_date=subscription.start_date.isoformat(),
        end_date=subscription.end_date.isoformat() if subscription.end_date else None,
        auto_renew=subscription.auto_renew,
    )


@router.get("/payments", response_model=list)
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment).where(Payment.user_id == current_user.id).order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    return [
        PaymentResponse(
            amount=p.amount,
            currency=p.currency,
            provider=p.provider,
            status=p.status,
            gst_invoice_number=p.gst_invoice_number,
            created_at=p.created_at.isoformat(),
        )
        for p in payments
    ]
