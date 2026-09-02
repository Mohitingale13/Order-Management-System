from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List
from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus


class OrderSortBy(str, Enum):
    CREATED_AT = "created_at"
    AMOUNT = "amount"
    STATUS = "status"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class OrderCustomerResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    customer: OrderCustomerResponse
    amount: Decimal
    status: OrderStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedOrdersResponse(BaseModel):
    items: List[OrderResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


class OrderCreateRequest(BaseModel):
    customer_id: int
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Monetary value greater than 0")
    status: OrderStatus = OrderStatus.PENDING


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatus


class OrderStatusUpdateResponse(BaseModel):
    id: int
    status: OrderStatus

    model_config = ConfigDict(from_attributes=True)
