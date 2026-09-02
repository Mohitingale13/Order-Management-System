from decimal import Decimal
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order, OrderStatus
from app.schemas.dashboard import DashboardSummaryResponse


class DashboardService:
    @staticmethod
    def get_summary(db: Session) -> DashboardSummaryResponse:
        total_customers = db.query(func.count(Customer.id)).scalar() or 0

        order_stats = db.query(
            func.count(Order.id),
            func.coalesce(
                func.sum(
                    case((Order.status == OrderStatus.COMPLETED.value, Order.amount), else_=0)
                ),
                0,
            ),
        ).first()

        total_orders = order_stats[0] if order_stats else 0
        total_completed_order_value = Decimal(str(order_stats[1])) if order_stats else Decimal("0.00")

        return DashboardSummaryResponse(
            total_orders=total_orders,
            total_completed_order_value=total_completed_order_value,
            total_customers=total_customers,
        )
