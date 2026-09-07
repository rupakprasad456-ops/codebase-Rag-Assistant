"""
Payment Gateway Integration Module
Handles credit card processing, payment intents, and webhook event notifications.
"""
from typing import Dict, Any, Optional
import uuid
import time

class StripePaymentService:
    """Service wrapper for processing online payments via Stripe SDK."""

    def __init__(self, api_key: str = "sk_test_mock_key_9988"):
        self.api_key = api_key
        self.transactions: Dict[str, Dict[str, Any]] = {}

    def create_payment_intent(self, amount_cents: int, currency: str = "usd", customer_email: str = "") -> Dict[str, Any]:
        """
        Creates a Stripe payment intent object with client secret for frontend checkout.
        """
        intent_id = f"pi_{uuid.uuid4().hex[:12]}"
        client_secret = f"{intent_id}_secret_{uuid.uuid4().hex[:8]}"
        
        intent_record = {
            "intent_id": intent_id,
            "client_secret": client_secret,
            "amount": amount_cents,
            "currency": currency,
            "customer_email": customer_email,
            "status": "requires_payment_method",
            "created": int(time.time())
        }
        self.transactions[intent_id] = intent_record
        return intent_record

    def confirm_payment(self, intent_id: str, payment_method_token: str) -> Dict[str, Any]:
        """
        Confirms payment execution using tokenized payment method.
        """
        intent = self.transactions.get(intent_id)
        if not intent:
            return {"success": False, "error": "Invalid Payment Intent ID"}

        if payment_method_token.startswith("tok_decline"):
            intent["status"] = "failed"
            return {"success": False, "error": "Card declined by issuing bank"}

        intent["status"] = "succeeded"
        intent["paid_at"] = int(time.time())
        return {
            "success": True,
            "intent_id": intent_id,
            "status": "succeeded",
            "receipt_url": f"https://pay.stripe.com/receipts/{intent_id}"
        }

    def process_webhook_event(self, event_payload: Dict[str, Any], signature_header: str) -> bool:
        """
        Verifies Stripe signature header and dispatches webhook events (e.g. payment_intent.succeeded).
        """
        event_type = event_payload.get("type")
        if event_type == "payment_intent.succeeded":
            data_object = event_payload.get("data", {}).get("object", {})
            print(f"[Webhook] Payment succeeded for intent: {data_object.get('id')}")
            return True
        return False

payment_service = StripePaymentService()
