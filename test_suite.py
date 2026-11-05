import ast
import sys
import unittest

sys.path.insert(0, ".")

from app.analyzer import analyze_python_detailed
from app.analyzer_multilang import analyze_code_multilang_detailed
from app.runner import execute_code
from app.auth import hash_password, verify_password, create_token, decode_token


class TestCodeLensEngine(unittest.TestCase):
    def test_auth_system(self):
        pw = "SuperSecure123"
        hashed = hash_password(pw)
        self.assertTrue(verify_password(pw, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

        token = create_token(42, "coder_dev")
        payload = decode_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["uid"], 42)
        self.assertEqual(payload["un"], "coder_dev")

    def test_c_binary_search(self):
        code = """
        int binarySearch(int arr[], int l, int r, int x) {
            while (l <= r) {
                int m = l + (r - l) / 2;
                if (arr[m] == x) return m;
                if (arr[m] < x) l = m + 1;
                else r = m - 1;
            }
            return -1;
        }
        """
        time_c, space_c, _, bottlenecks = analyze_code_multilang_detailed(code, "c")
        self.assertEqual(time_c, "O(log n)")
        self.assertEqual(space_c, "O(1)")

    def test_c_runner(self):
        code = '#include <stdio.h>\nint main() { printf("C_RUNNER_OK\\n"); return 0; }'
        res = execute_code(code, "c")
        self.assertTrue(res["success"])
        self.assertIn("C_RUNNER_OK", res["stdout"])

    def test_python_constant_loop(self):
        code = "def f(arr):\n    for x in arr:\n        for i in range(10):\n            pass"
        tree = ast.parse(code)
        time_c, space_c, _, bottlenecks = analyze_python_detailed(code, tree)
        self.assertEqual(time_c, "O(n)")
        self.assertEqual(space_c, "O(1)")
        self.assertTrue(any(b["type"] == "Constant Loop" for b in bottlenecks))

    def test_python_binary_search(self):
        code = "def bs(arr, target):\n    l, r = 0, len(arr)-1\n    while l <= r:\n        m = (l+r)//2\n        if arr[m] == target: return m\n        elif arr[m] < target: l = m + 1\n        else: r = m - 1\n    return -1"
        tree = ast.parse(code)
        time_c, space_c, _, bottlenecks = analyze_python_detailed(code, tree)
        self.assertEqual(time_c, "O(log n)")
        self.assertEqual(space_c, "O(1)")

    def test_python_fibonacci_recursion(self):
        code = "def fib(n):\n    if n <= 1: return n\n    return fib(n-1) + fib(n-2)"
        tree = ast.parse(code)
        time_c, space_c, _, _ = analyze_python_detailed(code, tree)
        self.assertEqual(time_c, "O(2^n)")
        self.assertEqual(space_c, "O(n)")

    def test_java_binary_search(self):
        code = "public int bs(int[] a, int t) { int l = 0, r = a.length - 1; while (l <= r) { int m = (l+r)/2; if (a[m] == t) return m; if (a[m] < t) l = m + 1; else r = m - 1; } return -1; }"
        time_c, space_c, _, _ = analyze_code_multilang_detailed(code, "java")
        self.assertEqual(time_c, "O(log n)")

    def test_cpp_constant_inner_loop(self):
        code = "int f(vector<int>& v) { for (int i = 0; i < v.size(); i++) { for (int j = 0; j < 10; j++) {} } return 0; }"
        time_c, space_c, _, _ = analyze_code_multilang_detailed(code, "cpp")
        self.assertEqual(time_c, "O(n)")

    def test_google_and_phone_auth(self):
        from app.main import google_auth, send_phone_otp, verify_phone_otp, GoogleAuthRequest, PhoneSendOtpRequest, PhoneVerifyOtpRequest
        from app.database import SessionLocal

        db = SessionLocal()
        try:
            # Test Google sign-in
            g_res = google_auth(GoogleAuthRequest(email="coder_test@gmail.com", name="Coder Test"), db=db)
            self.assertIn("token", g_res)
            self.assertEqual(g_res["user"]["email"], "coder_test@gmail.com")

            # Test Phone OTP send & verify with real random OTP and password setting
            test_phone = "+919999988888"
            p_send = send_phone_otp(PhoneSendOtpRequest(phone=test_phone))
            self.assertTrue(p_send["success"])

            from app.main import PHONE_OTP_STORE
            generated_otp = PHONE_OTP_STORE[test_phone]["otp"]
            self.assertEqual(len(generated_otp), 6)

            p_verify = verify_phone_otp(
                PhoneVerifyOtpRequest(phone=test_phone, otp=generated_otp, password="MySecurePassword123"),
                db=db
            )
            self.assertIn("token", p_verify)
            self.assertEqual(p_verify["user"]["phone"], test_phone)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
