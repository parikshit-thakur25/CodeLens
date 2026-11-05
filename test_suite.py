import ast
import sys
import unittest

sys.path.insert(0, ".")

from app.analyzer import analyze_python_detailed
from app.analyzer_multilang import analyze_code_multilang_detailed
from app.runner import execute_code


class TestCodeLensEngine(unittest.TestCase):
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

    def test_python_nested_loop(self):
        code = "def f(arr):\n    for x in arr:\n        for y in arr:\n            pass"
        tree = ast.parse(code)
        time_c, space_c, _, _ = analyze_python_detailed(code, tree)
        self.assertEqual(time_c, "O(n^2)")

    def test_python_fibonacci_recursion(self):
        code = "def fib(n):\n    if n <= 1: return n\n    return fib(n-1) + fib(n-2)"
        tree = ast.parse(code)
        time_c, space_c, _, _ = analyze_python_detailed(code, tree)
        self.assertEqual(time_c, "O(2^n)")
        self.assertEqual(space_c, "O(n)")

    def test_python_built_in_sort(self):
        code = "def f(arr):\n    return sorted(arr)"
        tree = ast.parse(code)
        time_c, space_c, _, _ = analyze_python_detailed(code, tree)
        self.assertEqual(time_c, "O(n log n)")

    def test_java_binary_search(self):
        code = "public int bs(int[] a, int t) { int l = 0, r = a.length - 1; while (l <= r) { int m = (l+r)/2; if (a[m] == t) return m; if (a[m] < t) l = m + 1; else r = m - 1; } return -1; }"
        time_c, space_c, _, _ = analyze_code_multilang_detailed(code, "java")
        self.assertEqual(time_c, "O(log n)")

    def test_cpp_constant_inner_loop(self):
        code = "int f(vector<int>& v) { for (int i = 0; i < v.size(); i++) { for (int j = 0; j < 10; j++) {} } return 0; }"
        time_c, space_c, _, _ = analyze_code_multilang_detailed(code, "cpp")
        self.assertEqual(time_c, "O(n)")

    def test_python_runner(self):
        res = execute_code("print('Hello from Runner Test')", "python")
        self.assertTrue(res["success"])
        self.assertIn("Hello from Runner Test", res["stdout"])


if __name__ == "__main__":
    unittest.main()

