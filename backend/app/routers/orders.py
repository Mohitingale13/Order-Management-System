from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import OrderStatus
from app.schemas.order import (
    OrderCreateRequest,
    OrderResponse,
    OrderSortBy,
    OrderStatusUpdateRequest,
    OrderStatusUpdateResponse,
    PaginatedOrdersResponse,
    SortOrder,
)
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=PaginatedOrdersResponse)
def list_orders(
    search: Optional[str] = Query(None, description="Search orders by customer name"),
    status: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    sort_by: OrderSortBy = Query(OrderSortBy.CREATED_AT, description="Field to sort by"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort order (asc/desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    return OrderService.get_orders(
        db=db,
        search=search,
        status_filter=status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    request: OrderCreateRequest,
    db: Session = Depends(get_db),
):
    return OrderService.create_order(db=db, request=request)


@router.patch("/{order_id}/status", response_model=OrderStatusUpdateResponse)
def update_order_status(
    order_id: int,
    request: OrderStatusUpdateRequest,
    db: Session = Depends(get_db),
):
    return OrderService.update_order_status(
        db=db,
        order_id=order_id,
        request=request,
    )
