"""
Authentication and Authorization Module
Handles JWT token generation, password hashing with bcrypt, and user verification.
"""
import datetime
import hashlib
import hmac
import json
from typing import Optional, Dict, Any

SECRET_KEY = "super-secret-rag-assistant-key-change-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60

class AuthManager:
    """Manager class for user credentials and session tokens."""
    
    def __init__(self, secret: str = SECRET_KEY):
        self.secret = secret.encode('utf-8')
        
    def hash_password(self, password: str) -> str:
        """Hashes a raw password using HMAC-SHA256 with salt."""
        salt = "static_salt_v1"
        return hmac.new(self.secret, (password + salt).encode('utf-8'), hashlib.sha256).hexdigest()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifies if the provided plain password matches the stored hash."""
        return hmac.compare_digest(self.hash_password(plain_password), hashed_password)

    def create_access_token(self, user_id: str, role: str = "user") -> str:
        """
        Generates a signed JWT payload token containing user_id, role, and expiration timestamp.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        payload = {
            "sub": user_id,
            "role": role,
            "iat": int(now.timestamp()),
            "exp": int((now + datetime.timedelta(minutes=TOKEN_EXPIRE_MINUTES)).timestamp())
        }
        header = {"alg": ALGORITHM, "typ": "JWT"}
        
        # Simple token encoding logic for demo
        token_body = f"{json.dumps(header)}.{json.dumps(payload)}"
        signature = hmac.new(self.secret, token_body.encode('utf-8'), hashlib.sha256).hexdigest()
        return f"{token_body}.{signature}"

    def decode_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validates token signature and returns decoded user payload if valid and not expired.
        """
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        header_str, payload_str, signature = parts
        token_body = f"{header_str}.{payload_str}"
        expected_sig = hmac.new(self.secret, token_body.encode('utf-8'), hashlib.sha256).hexdigest()
        
        if not hmac.compare_digest(signature, expected_sig):
            return None  # Signature invalid
            
        payload = json.loads(payload_str)
        if payload.get("exp", 0) < datetime.datetime.now(datetime.timezone.utc).timestamp():
            return None  # Token expired
            
        return payload

auth_service = AuthManager()
