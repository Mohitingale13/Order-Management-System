from decimal import Decimal
from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_orders: int
    total_completed_order_value: Decimal
    total_customers: int
