"""
Database Access Layer and Data Models
Defines ORM abstractions for User, Product, and Order tables.
"""
from typing import List, Dict, Optional, Any
import time

class DatabaseSession:
    """Mock Database Session managing connections and entity CRUD operations."""
    
    def __init__(self):
        self._users: Dict[str, Dict[str, Any]] = {
            "usr_101": {"id": "usr_101", "email": "alice@example.com", "role": "admin", "created_at": time.time()},
            "usr_102": {"id": "usr_102", "email": "bob@example.com", "role": "user", "created_at": time.time()}
        }
        self._products: Dict[str, Dict[str, Any]] = {
            "prd_001": {"id": "prd_001", "title": "Wireless Headset", "price": 99.99, "stock": 42},
            "prd_002": {"id": "prd_002", "title": "Mechanical Keyboard", "price": 149.50, "stock": 18}
        }
        self._orders: List[Dict[str, Any]] = []

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Retrieve user profile matching email address."""
        for user in self._users.values():
            if user["email"].lower() == email.lower():
                return user
        return None

    def create_order(self, user_id: str, product_id: str, quantity: int) -> Dict[str, Any]:
        """
        Creates a new transaction order after checking inventory stock.
        """
        product = self._products.get(product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found in inventory")
            
        if product["stock"] < quantity:
            raise ValueError("Insufficient product stock available")
            
        # Deduct stock
        product["stock"] -= quantity
        
        order = {
            "order_id": f"ord_{len(self._orders) + 1:04d}",
            "user_id": user_id,
            "product_id": product_id,
            "quantity": quantity,
            "total_amount": round(product["price"] * quantity, 2),
            "status": "COMPLETED",
            "timestamp": time.time()
        }
        self._orders.append(order)
        return order

db_session = DatabaseSession()
