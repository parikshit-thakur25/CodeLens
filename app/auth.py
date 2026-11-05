import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any, Dict, Optional
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

# Secret key for signing tokens
SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "codelens-auth-secret-key-2026-v2")


def hash_password(password: str) -> str:
    """Hash password using PBKDF2 HMAC SHA-256 with a unique random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"{salt}:{key}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify raw password against stored salt:hash string."""
    try:
        salt, key = stored_hash.split(":")
        check = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
        return hmac.compare_digest(key, check)
    except Exception:
        return False


def create_token(user_id: int, username: str, expires_in_days: int = 30) -> str:
    """Generate a tamper-proof signed session token."""
    payload = {
        "uid": user_id,
        "un": username,
        "exp": int(time.time()) + (expires_in_days * 86400),
    }
    raw_payload = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")
    sig = hmac.new(SECRET_KEY.encode("utf-8"), raw_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{raw_payload}.{sig}"


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify signature of token."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        raw_payload, sig = parts
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), raw_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        payload = json.loads(base64.urlsafe_b64decode(raw_payload.encode("utf-8")).decode("utf-8"))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None
