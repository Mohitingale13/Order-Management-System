from datetime import datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel, ConfigDict


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerSummaryResponse(BaseModel):
    id: int
    name: str
    email: str
    completed_orders: int
    completed_order_value: Decimal

    model_config = ConfigDict(from_attributes=True)


class CustomerListResponse(BaseModel):
    items: List[CustomerSummaryResponse]
    total: int
