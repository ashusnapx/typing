from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class SubscriptionCreate(BaseModel):
    plan: str
    provider: str
    provider_order_id: Optional[str] = None


class SubscriptionResponse(BaseModel):
    plan: str
    status: str
    start_date: str
    end_date: Optional[str]
    auto_renew: bool


class PaymentResponse(BaseModel):
    amount: float
    currency: str
    provider: str
    status: str
    gst_invoice_number: Optional[str]
    created_at: str


class AdminDashboard(BaseModel):
    dau: int
    wau: int
    mau: int
    total_users: int
    premium_users: int
    revenue_today: float
    revenue_month: float
    active_tests: int
    peak_concurrency: int
    error_rate: float
    infrastructure_health: str
