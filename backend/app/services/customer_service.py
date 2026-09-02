from decimal import Decimal
from math import ceil
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order, OrderStatus
from app.schemas.customer import (
    CustomerListResponse,
    CustomerResponse,
    CustomerSummaryResponse,
)
from app.schemas.order import PaginatedOrdersResponse
from app.services.order_service import OrderService


class CustomerService:
    @staticmethod
    def get_customers(
        db: Session,
        page: int = 1,
        page_size: int = 10,
    ) -> CustomerListResponse:
        completed_count_expr = func.count(
            case((Order.status == OrderStatus.COMPLETED.value, Order.id), else_=None)
        ).label("completed_orders")

        completed_value_expr = func.coalesce(
            func.sum(
                case((Order.status == OrderStatus.COMPLETED.value, Order.amount), else_=0)
            ),
            0,
        ).label("completed_order_value")

        total = db.query(Customer).count()
        total_pages = ceil(total / page_size) if total > 0 else 0
        offset = (page - 1) * page_size

        results = (
            db.query(
                Customer.id,
                Customer.name,
                Customer.email,
                completed_count_expr,
                completed_value_expr,
            )
            .outerjoin(Order, Customer.id == Order.customer_id)
            .group_by(Customer.id, Customer.name, Customer.email)
            .order_by(Customer.id.asc())
            .offset(offset)
            .limit(page_size)
            .all()
        )

        items = [
            CustomerSummaryResponse(
                id=row[0],
                name=row[1],
                email=row[2],
                completed_orders=row[3],
                completed_order_value=Decimal(str(row[4])),
            )
            for row in results
        ]

        return CustomerListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    @staticmethod
    def get_customer_by_id(db: Session, customer_id: int) -> CustomerResponse:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )

        # Compute completed metrics directly in PostgreSQL
        completed_count_expr = func.count(
            case((Order.status == OrderStatus.COMPLETED.value, Order.id), else_=None)
        )
        completed_value_expr = func.coalesce(
            func.sum(
                case((Order.status == OrderStatus.COMPLETED.value, Order.amount), else_=0)
            ),
            0,
        )

        metrics = (
            db.query(completed_count_expr, completed_value_expr)
            .filter(Order.customer_id == customer_id)
            .first()
        )

        completed_orders = metrics[0] if metrics else 0
        completed_value = Decimal(str(metrics[1])) if metrics and metrics[1] is not None else Decimal("0.00")

        return CustomerResponse(
            id=customer.id,
            name=customer.name,
            email=customer.email,
            created_at=customer.created_at,
            completed_orders=completed_orders,
            completed_order_value=completed_value,
        )

    @staticmethod
    def get_customer_orders(
        db: Session,
        customer_id: int,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedOrdersResponse:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )

        return OrderService.get_orders(
            db=db,
            customer_id=customer_id,
            page=page,
            page_size=page_size,
        )