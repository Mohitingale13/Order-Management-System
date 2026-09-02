from datetime import datetime, timedelta, timezone
from decimal import Decimal
import os
import sys
from pathlib import Path

# Ensure backend root is in sys.path when script is executed directly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models.customer import Customer
from app.models.order import Order, OrderStatus


def run_seed():
    db = SessionLocal()
    try:
        # Reset tables for deterministic repeatability
        db.query(Order).delete()
        db.query(Customer).delete()
        db.commit()

        base_time = datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc)

        # 10 Customers
        customers_data = [
            {"name": "Acme Corporation", "email": "contact@acme.com", "days_ago": 30},
            {"name": "Horizon Retail", "email": "operations@horizonretail.com", "days_ago": 28},
            {"name": "Nexus Logistics", "email": "info@nexuslogistics.com", "days_ago": 25},
            {"name": "Apex Global", "email": "support@apexglobal.com", "days_ago": 22},
            {"name": "Sterling Partners", "email": "team@sterlingpartners.com", "days_ago": 20},
            {"name": "Beacon Enterprises", "email": "billing@beaconent.com", "days_ago": 18},
            {"name": "Vertex Tech", "email": "admin@vertextech.io", "days_ago": 15},
            {"name": "Pinnacle Ventures", "email": "contact@pinnacle.com", "days_ago": 12},
            {"name": "Vanguard Media", "email": "hello@vanguardmedia.com", "days_ago": 10},
            {"name": "Solstice Systems", "email": "accounts@solsticesys.com", "days_ago": 8},
        ]

        customers = []
        for item in customers_data:
            cust = Customer(
                name=item["name"],
                email=item["email"],
                created_at=base_time + timedelta(days=item["days_ago"]),
            )
            db.add(cust)
            customers.append(cust)

        db.flush()  # Generates customer IDs

        # 40 Deterministic Orders (18 Completed, 14 Pending, 8 Cancelled)
        # Distributed across the 10 customers
        orders_spec = [
            # Customer 0: Acme Corp (4 orders: 2 completed, 1 pending, 1 cancelled)
            (0, "1250.00", OrderStatus.COMPLETED, 25),
            (0, "450.50", OrderStatus.COMPLETED, 20),
            (0, "3200.00", OrderStatus.PENDING, 5),
            (0, "150.00", OrderStatus.CANCELLED, 2),

            # Customer 1: Horizon Retail (5 orders: 3 completed, 1 pending, 1 cancelled)
            (1, "890.00", OrderStatus.COMPLETED, 24),
            (1, "2100.75", OrderStatus.COMPLETED, 18),
            (1, "640.20", OrderStatus.COMPLETED, 12),
            (1, "1450.00", OrderStatus.PENDING, 4),
            (1, "300.00", OrderStatus.CANCELLED, 1),

            # Customer 2: Nexus Logistics (4 orders: 2 completed, 2 pending)
            (2, "4300.00", OrderStatus.COMPLETED, 22),
            (2, "1200.00", OrderStatus.COMPLETED, 14),
            (2, "980.50", OrderStatus.PENDING, 7),
            (2, "560.00", OrderStatus.PENDING, 3),

            # Customer 3: Apex Global (6 orders: 3 completed, 2 pending, 1 cancelled)
            (3, "750.00", OrderStatus.COMPLETED, 21),
            (3, "1820.00", OrderStatus.COMPLETED, 16),
            (3, "990.00", OrderStatus.COMPLETED, 9),
            (3, "2400.00", OrderStatus.PENDING, 6),
            (3, "310.40", OrderStatus.PENDING, 2),
            (3, "120.00", OrderStatus.CANCELLED, 1),

            # Customer 4: Sterling Partners (3 orders: 1 completed, 1 pending, 1 cancelled)
            (4, "3500.00", OrderStatus.COMPLETED, 17),
            (4, "1150.00", OrderStatus.PENDING, 8),
            (4, "420.00", OrderStatus.CANCELLED, 3),

            # Customer 5: Beacon Enterprises (4 orders: 2 completed, 1 pending, 1 cancelled)
            (5, "620.00", OrderStatus.COMPLETED, 15),
            (5, "1890.50", OrderStatus.COMPLETED, 11),
            (5, "450.00", OrderStatus.PENDING, 5),
            (5, "210.00", OrderStatus.CANCELLED, 2),

            # Customer 6: Vertex Tech (5 orders: 2 completed, 2 pending, 1 cancelled)
            (6, "5100.00", OrderStatus.COMPLETED, 13),
            (6, "2300.00", OrderStatus.COMPLETED, 7),
            (6, "1400.00", OrderStatus.PENDING, 4),
            (6, "880.00", OrderStatus.PENDING, 2),
            (6, "750.00", OrderStatus.CANCELLED, 1),

            # Customer 7: Pinnacle Ventures (3 orders: 1 completed, 1 pending, 1 cancelled)
            (7, "2750.00", OrderStatus.COMPLETED, 10),
            (7, "1600.00", OrderStatus.PENDING, 3),
            (7, "500.00", OrderStatus.CANCELLED, 1),

            # Customer 8: Vanguard Media (4 orders: 2 completed, 1 pending, 1 cancelled)
            (8, "1320.00", OrderStatus.COMPLETED, 8),
            (8, "940.00", OrderStatus.COMPLETED, 5),
            (8, "2150.00", OrderStatus.PENDING, 2),
            (8, "380.00", OrderStatus.CANCELLED, 1),

            # Customer 9: Solstice Systems (2 orders: 0 completed, 2 pending)
            (9, "1800.00", OrderStatus.PENDING, 4),
            (9, "720.00", OrderStatus.PENDING, 1),
        ]

        counts = {"completed": 0, "pending": 0, "cancelled": 0}

        for cust_idx, amount_str, status_enum, day_offset in orders_spec:
            order = Order(
                customer_id=customers[cust_idx].id,
                amount=Decimal(amount_str),
                status=status_enum.value,
                created_at=base_time + timedelta(days=day_offset),
            )
            db.add(order)
            counts[status_enum.value] += 1

        db.commit()

        print("Seed completed successfully.\n")
        print(f"Customers: {len(customers)}")
        print(f"Orders: {len(orders_spec)}")
        print(f"Completed: {counts['completed']}")
        print(f"Pending: {counts['pending']}")
        print(f"Cancelled: {counts['cancelled']}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
