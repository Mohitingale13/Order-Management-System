from math import ceil
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.order import Order, OrderStatus
from app.schemas.order import (
    OrderCreateRequest,
    OrderCustomerResponse,
    OrderResponse,
    OrderSortBy,
    OrderStatusUpdateRequest,
    OrderStatusUpdateResponse,
    PaginatedOrdersResponse,
    SortOrder,
)


class OrderService:
    @staticmethod
    def get_orders(
        db: Session,
        customer_id: Optional[int] = None,
        search: Optional[str] = None,
        status_filter: Optional[OrderStatus] = None,
        sort_by: OrderSortBy = OrderSortBy.CREATED_AT,
        sort_order: SortOrder = SortOrder.DESC,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedOrdersResponse:
        query = db.query(Order).join(Order.customer).options(joinedload(Order.customer))

        if customer_id is not None:
            query = query.filter(Order.customer_id == customer_id)

        if search and search.strip():
            query = query.filter(Customer.name.ilike(f"%{search.strip()}%"))

        if status_filter:
            query = query.filter(Order.status == status_filter.value)

        total = query.count()
        total_pages = ceil(total / page_size) if total > 0 else 0

        sort_column_map = {
            OrderSortBy.CREATED_AT: Order.created_at,
            OrderSortBy.AMOUNT: Order.amount,
            OrderSortBy.STATUS: Order.status,
        }
        sort_col = sort_column_map[sort_by]
        order_fn = desc if sort_order == SortOrder.DESC else asc
        query = query.order_by(order_fn(sort_col), desc(Order.id))

        offset = (page - 1) * page_size
        orders = query.offset(offset).limit(page_size).all()

        items = [
            OrderResponse(
                id=order.id,
                customer=OrderCustomerResponse(
                    id=order.customer.id,
                    name=order.customer.name,
                ),
                amount=order.amount,
                status=OrderStatus(order.status),
                created_at=order.created_at,
            )
            for order in orders
        ]

        return PaginatedOrdersResponse(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    def create_order(db: Session, request: OrderCreateRequest) -> OrderResponse:
        customer = db.query(Customer).filter(Customer.id == request.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )

        order = Order(
            customer_id=request.customer_id,
            amount=request.amount,
            status=request.status.value,
        )
        try:
            db.add(order)
            db.commit()
            db.refresh(order)
        except Exception:
            db.rollback()
            raise

        return OrderResponse(
            id=order.id,
            customer=OrderCustomerResponse(
                id=customer.id,
                name=customer.name,
            ),
            amount=order.amount,
            status=OrderStatus(order.status),
            created_at=order.created_at,
        )

    @staticmethod
    def update_order_status(
        db: Session, order_id: int, request: OrderStatusUpdateRequest
    ) -> OrderStatusUpdateResponse:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        order.status = request.status.value
        try:
            db.commit()
            db.refresh(order)
        except Exception:
            db.rollback()
            raise

        return OrderStatusUpdateResponse(
            id=order.id,
            status=OrderStatus(order.status),
        )