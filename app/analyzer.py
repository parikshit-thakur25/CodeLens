import ast
from typing import Any, Dict, List, Set, Tuple


def is_constant_range(iter_node: ast.AST) -> bool:
    """Check if a loop iterator is over a constant number of items, e.g. range(10) or [1, 2, 3]."""
    if isinstance(iter_node, ast.Call):
        if isinstance(iter_node.func, ast.Name) and iter_node.func.id == "range":
            if iter_node.args and all(isinstance(arg, ast.Constant) and isinstance(arg.value, (int, float)) for arg in iter_node.args):
                return True
    elif isinstance(iter_node, (ast.List, ast.Tuple, ast.Set)):
        if all(isinstance(elt, ast.Constant) for elt in iter_node.elts):
            return True
    return False


def is_logarithmic_loop(node: ast.AST) -> bool:
    """Detect if a while/for loop updates its counter geometrically (e.g. n //= 2, i *= 2, mid = (l+r)//2)."""
    for child in ast.walk(node):
        if isinstance(child, ast.AugAssign):
            if isinstance(child.op, (ast.FloorDiv, ast.Div, ast.Mult, ast.RShift, ast.LShift)):
                return True
        elif isinstance(child, ast.Assign):
            if isinstance(child.value, ast.BinOp):
                if isinstance(child.value.op, (ast.FloorDiv, ast.Div, ast.RShift)):
                    return True
    return False


def get_loop_analysis(node: ast.AST, current_depth: int = 0) -> Tuple[int, bool, List[Dict[str, Any]]]:
    """
    Recursively analyzes loop depth, logarithmic factors, and records bottleneck lines.
    Returns: (max_linear_depth, has_log_factor, bottlenecks)
    """
    max_linear = current_depth
    has_log = False
    bottlenecks: List[Dict[str, Any]] = []

    for child in ast.iter_child_nodes(node):
        if isinstance(child, (ast.For, ast.While)):
            is_constant = False
            if isinstance(child, ast.For) and is_constant_range(child.iter):
                is_constant = True

            is_log = is_logarithmic_loop(child)

            if is_constant:
                next_depth = current_depth
                bottlenecks.append({
                    "line": getattr(child, "lineno", 1),
                    "type": "Constant Loop",
                    "complexity": "O(1)",
                    "reason": "Loop runs over a fixed constant bound, does not scale with N.",
                })
            elif is_log:
                next_depth = current_depth
                has_log = True
                bottlenecks.append({
                    "line": getattr(child, "lineno", 1),
                    "type": "Logarithmic Loop",
                    "complexity": "O(log n)",
                    "reason": "Loop step halves or doubles input search space.",
                })
            else:
                next_depth = current_depth + 1
                bottlenecks.append({
                    "line": getattr(child, "lineno", 1),
                    "type": "Linear Loop",
                    "complexity": f"O(n^{next_depth})",
                    "reason": f"Loop scales linearly with input size (nesting depth: {next_depth}).",
                })

            sub_linear, sub_log, sub_bottlenecks = get_loop_analysis(child, next_depth)
            max_linear = max(max_linear, sub_linear)
            if sub_log:
                has_log = True
            bottlenecks.extend(sub_bottlenecks)
        else:
            sub_linear, sub_log, sub_bottlenecks = get_loop_analysis(child, current_depth)
            max_linear = max(max_linear, sub_linear)
            if sub_log:
                has_log = True
            bottlenecks.extend(sub_bottlenecks)

    return max_linear, has_log, bottlenecks


def count_recursive_calls(node: ast.AST, function_name: str) -> List[int]:
    """Returns list of line numbers for recursive calls to function_name."""
    lines: List[int] = []
    for child in ast.walk(node):
        if isinstance(child, ast.Call) and isinstance(child.func, ast.Name):
            if child.func.id == function_name:
                lines.append(getattr(child, "lineno", getattr(node, "lineno", 1)))
    return lines


def check_builtin_sorting_or_scans(tree: ast.AST) -> Tuple[bool, bool, List[Dict[str, Any]]]:
    """Checks for built-in operations like sorted(), .sort(), min(), max(), sum()."""
    has_sort = False
    has_linear_builtin = False
    bottlenecks: List[Dict[str, Any]] = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in ("sorted",):
                    has_sort = True
                    bottlenecks.append({
                        "line": getattr(node, "lineno", 1),
                        "type": "Built-in Sort",
                        "complexity": "O(n log n)",
                        "reason": f"Built-in '{node.func.id}()' uses Timsort with O(n log n) average & worst case.",
                    })
                elif node.func.id in ("min", "max", "sum"):
                    has_linear_builtin = True
            elif isinstance(node.func, ast.Attribute) and node.func.attr == "sort":
                has_sort = True
                bottlenecks.append({
                    "line": getattr(node, "lineno", 1),
                    "type": "List Sort",
                    "complexity": "O(n log n)",
                    "reason": "List.sort() in-place uses Timsort with O(n log n) complexity.",
                })

    return has_sort, has_linear_builtin, bottlenecks


def analyze_python_detailed(code: str, tree: ast.AST) -> Tuple[str, str, str, List[Dict[str, Any]]]:
    """
    Returns (time_complexity, space_complexity, explanation, bottlenecks).
    """
    linear_depth, has_log, loop_bottlenecks = get_loop_analysis(tree)
    has_sort, has_linear_builtin, builtin_bottlenecks = check_builtin_sorting_or_scans(tree)

    all_bottlenecks = loop_bottlenecks + builtin_bottlenecks

    # Recursion detection
    recursive_calls_count = 0
    recursion_lines: List[int] = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            rec_lines = count_recursive_calls(node, node.name)
            if len(rec_lines) > recursive_calls_count:
                recursive_calls_count = len(rec_lines)
                recursion_lines = rec_lines

    if recursive_calls_count >= 2:
        all_bottlenecks.append({
            "line": recursion_lines[0] if recursion_lines else 1,
            "type": "Multiple Recursion",
            "complexity": "O(2^n)",
            "reason": f"Function makes {recursive_calls_count} recursive calls per activation without memoization.",
        })
        time_comp = "O(2^n)"
        space_comp = "O(n)"
        explanation = f"Detected exponential branching recursion ({recursive_calls_count} calls per stack frame). Call stack requires O(n) space."
        return time_comp, space_comp, explanation, all_bottlenecks

    effective_depth = linear_depth
    if recursive_calls_count == 1:
        effective_depth += 1
        all_bottlenecks.append({
            "line": recursion_lines[0] if recursion_lines else 1,
            "type": "Single Recursion",
            "complexity": "O(n)",
            "reason": "Linear recursive call chain adds O(n) calls to call stack.",
        })

    # Time complexity derivation
    if effective_depth == 0:
        if has_sort:
            time_comp = "O(n log n)"
            explanation = "Built-in O(n log n) sorting dominates runtime."
        elif has_log:
            time_comp = "O(log n)"
            explanation = "Loop condition partitions or halves search space (e.g. Binary Search)."
        elif has_linear_builtin:
            time_comp = "O(n)"
            explanation = "Linear scan via built-in function (min/max/sum) over input collection."
        else:
            time_comp = "O(1)"
            explanation = "Constant time operations with no scalable loops or unbounded recursion."
    elif effective_depth == 1:
        if has_log or has_sort:
            time_comp = "O(n log n)"
            explanation = "Single outer linear loop combined with internal sorting or logarithmic division."
        else:
            time_comp = "O(n)"
            explanation = "Single loop over input elements scaling proportionally to N."
    elif effective_depth == 2:
        if has_log:
            time_comp = "O(n^2 log n)"
            explanation = "Nested loops with logarithmic inner step."
        else:
            time_comp = "O(n^2)"
            explanation = "Two nested loops scaling quadratically with input size N."
    else:
        time_comp = f"O(n^{effective_depth})"
        explanation = f"Detected {effective_depth} nested loops creating polynomial O(n^{effective_depth}) complexity."

    # Space complexity estimation
    has_dynamic_collections = False
    has_comprehensions = False

    for node in ast.walk(tree):
        if isinstance(node, (ast.For, ast.While)):
            for inner in ast.walk(node):
                if isinstance(inner, (ast.List, ast.Dict, ast.Set)):
                    has_dynamic_collections = True
                if isinstance(inner, ast.Call) and isinstance(inner.func, ast.Attribute):
                    if inner.func.attr in ("append", "add", "insert", "extend"):
                        has_dynamic_collections = True

        if isinstance(node, (ast.ListComp, ast.DictComp, ast.SetComp)):
            has_comprehensions = True

    if effective_depth >= 2 and has_dynamic_collections:
        space_comp = "O(n^2)"
        explanation += " Dynamic 2D structure creation inside nested loops requires O(n²) space."
    elif has_dynamic_collections or has_comprehensions or recursive_calls_count >= 1:
        space_comp = "O(n)"
        explanation += " Auxiliary memory allocation or call stack grows linearly with input."
    else:
        space_comp = "O(1)"
        explanation += " In-place memory usage with O(1) auxiliary space."

    unique_bottlenecks = []
    seen = set()
    for b in sorted(all_bottlenecks, key=lambda x: x["line"]):
        key = (b["line"], b["type"])
        if key not in seen:
            seen.add(key)
            unique_bottlenecks.append(b)

    return time_comp, space_comp, explanation, unique_bottlenecks


# Backward compatibility methods
def get_max_loop_depth(node, current_depth=0):
    linear_depth, _, _ = get_loop_analysis(node, current_depth)
    return linear_depth


def estimate_time_complexity(code: str, tree: ast.AST) -> str:
    time_c, _, _, _ = analyze_python_detailed(code, tree)
    return time_c


def estimate_space_complexity(tree: ast.AST) -> str:
    _, space_c, _, _ = analyze_python_detailed("", tree)
    return space_c


def estimate_complexity(code: str) -> str:
    tree = ast.parse(code)
    return estimate_time_complexity(code, tree)
