from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.customer import CustomerListResponse, CustomerResponse
from app.schemas.order import PaginatedOrdersResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=CustomerListResponse)
def list_customers(db: Session = Depends(get_db)):
    return CustomerService.get_customers(db=db)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return CustomerService.get_customer_by_id(db=db, customer_id=customer_id)


@router.get("/{customer_id}/orders", response_model=PaginatedOrdersResponse)
def get_customer_orders(
    customer_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    return CustomerService.get_customer_orders(
        db=db,
        customer_id=customer_id,
        page=page,
        page_size=page_size,
    )
