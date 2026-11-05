import os
import json
import urllib.request
import urllib.parse
from typing import Dict, Any


def dispatch_sms_otp(phone: str, otp: str) -> Dict[str, Any]:
    """
    Dispatches a real carrier cellular SMS OTP via:
    1. Fast2SMS (India direct SMS gateway) if FAST2SMS_API_KEY is configured
    2. Twilio (Global carrier SMS gateway) if TWILIO_ACCOUNT_SID is configured
    3. Fallback: logs OTP to server output and returns status
    """
    clean_digits = "".join(filter(str.isdigit, phone))

    # --- Provider 1: Fast2SMS (India) ---
    fast2sms_key = os.getenv("FAST2SMS_API_KEY")
    if fast2sms_key:
        try:
            target_number = clean_digits
            if target_number.startswith("91") and len(target_number) == 12:
                target_number = target_number[2:]

            payload = json.dumps({
                "route": "otp",
                "variables_values": otp,
                "numbers": target_number,
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://www.fast2sms.com/dev/bulkV2",
                data=payload,
                headers={
                    "authorization": fast2sms_key,
                    "Content-Type": "application/json",
                    "User-Agent": "CodeLens-SMS-Dispatcher/1.0",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_body = json.loads(resp.read().decode("utf-8"))
                if res_body.get("return") is True:
                    return {"delivered": True, "provider": "fast2sms", "message": "SMS delivered via Fast2SMS"}
        except Exception as e:
            print(f"[CodeLens SMS Error] Fast2SMS failure: {e}")

    # --- Provider 2: Twilio (Global) ---
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_PHONE_NUMBER")

    if twilio_sid and twilio_token and twilio_from:
        try:
            import base64
            auth_val = base64.b64encode(f"{twilio_sid}:{twilio_token}".encode("utf-8")).decode("utf-8")
            to_number = f"+{clean_digits}" if not phone.startswith("+") else phone

            payload = urllib.parse.urlencode({
                "To": to_number,
                "From": twilio_from,
                "Body": f"Your CodeLens Studio verification code is: {otp}. Valid for 10 minutes.",
            }).encode("utf-8")

            req = urllib.request.Request(
                f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json",
                data=payload,
                headers={
                    "Authorization": f"Basic {auth_val}",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "CodeLens-SMS-Dispatcher/1.0",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_body = json.loads(resp.read().decode("utf-8"))
                return {"delivered": True, "provider": "twilio", "sid": res_body.get("sid")}
        except Exception as e:
            print(f"[CodeLens SMS Error] Twilio failure: {e}")

    # If no gateway keys in env, log securely to server
    print(f"[CodeLens SMS Engine] Carrier OTP for {phone}: {otp} (No SMS gateway API keys set in Render env)")
    return {
        "delivered": False,
        "message": "Gateway API keys not found in environment (FAST2SMS_API_KEY or TWILIO_ACCOUNT_SID)",
    }
