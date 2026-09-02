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
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, le=100, description="Page size")
    total: int = Field(..., ge=0, description="Total matching items")
    total_pages: int = Field(..., ge=0, description="Total pages available")


class OrderCreateRequest(BaseModel):
    customer_id: int = Field(..., ge=1, description="Customer ID must be a positive integer")
    amount: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
        description="Order monetary amount must be greater than 0 with at most 2 decimal places",
    )
    status: OrderStatus = Field(
        default=OrderStatus.PENDING,
        description="Initial order status (defaults to pending)",
    )


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatus = Field(
        ...,
        description="Target order status (pending, completed, or cancelled)",
    )


class OrderStatusUpdateResponse(BaseModel):
    id: int
    status: OrderStatus

    model_config = ConfigDict(from_attributes=True)