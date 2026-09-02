from datetime import datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel, ConfigDict, Field


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime
    completed_orders: int = 0
    completed_order_value: Decimal = Decimal("0.00")

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
    page: int = 1
    page_size: int = 10
    total_pages: int = 1