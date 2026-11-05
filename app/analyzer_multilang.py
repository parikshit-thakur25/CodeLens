import re
from typing import Any, Dict, List, Optional, Tuple
from tree_sitter import Language, Parser
import tree_sitter_java as tsjava
import tree_sitter_cpp as tscpp

JAVA_LANGUAGE = Language(tsjava.language())
CPP_LANGUAGE = Language(tscpp.language())

LANGUAGE_CONFIG = {
    "java": {
        "language": JAVA_LANGUAGE,
        "loop_types": {"for_statement", "while_statement", "enhanced_for_statement", "do_statement"},
        "function_types": {"method_declaration", "constructor_declaration"},
        "call_type": "method_invocation",
        "call_name_field": "name",
        "new_object_types": {"object_creation_expression", "array_creation_expression"},
    },
    "cpp": {
        "language": CPP_LANGUAGE,
        "loop_types": {"for_statement", "while_statement", "for_range_loop", "do_statement"},
        "function_types": {"function_definition"},
        "call_type": "call_expression",
        "call_name_field": "function",
        "new_object_types": {"new_expression"},
    },
    "c": {
        "language": CPP_LANGUAGE,
        "loop_types": {"for_statement", "while_statement", "do_statement"},
        "function_types": {"function_definition"},
        "call_type": "call_expression",
        "call_name_field": "function",
        "new_object_types": {"call_expression"},
    },
}


def get_function_name(node) -> Optional[str]:
    name_node = node.child_by_field_name("name")
    if name_node:
        return name_node.text.decode("utf8")

    declarator = node.child_by_field_name("declarator")
    if declarator:
        def find_identifier(n):
            if n.type == "identifier":
                return n.text.decode("utf8")
            for child in n.children:
                result = find_identifier(child)
                if result:
                    return result
            return None

        return find_identifier(declarator)

    return None


def is_constant_c_or_java_loop(node) -> bool:
    """Checks if a for/while loop condition is constant, e.g. i < 10."""
    cond = node.child_by_field_name("condition")
    if cond:
        cond_text = cond.text.decode("utf8", errors="ignore").strip()
        if re.search(r"^[a-zA-Z0-9_.]+\s*[<>!=]=?\s*\d+$", cond_text):
            return True
    return False


def is_logarithmic_c_or_java_loop(node) -> bool:
    """Checks if loop body contains halving or doubling: /= 2, *= 2, >> 1, (low + high) / 2."""
    text = node.text.decode("utf8", errors="ignore")
    if re.search(r"/\s*2|\b>>\s*1|\*=\s*2|/=\s*2|\b(low|high)\s*=\s*mid", text):
        return True
    return False


def analyze_multilang_loops(node, loop_types, current_depth=0) -> Tuple[int, bool, List[Dict[str, Any]]]:
    max_linear = current_depth
    has_log = False
    bottlenecks: List[Dict[str, Any]] = []

    for child in node.children:
        if child.type in loop_types:
            line_num = child.start_point[0] + 1
            is_const = is_constant_c_or_java_loop(child)
            is_log = is_logarithmic_c_or_java_loop(child)

            if is_const:
                next_depth = current_depth
                bottlenecks.append({
                    "line": line_num,
                    "type": "Constant Loop",
                    "complexity": "O(1)",
                    "reason": "Loop bound is a fixed integer literal, does not scale with input size.",
                })
            elif is_log:
                next_depth = current_depth
                has_log = True
                bottlenecks.append({
                    "line": line_num,
                    "type": "Logarithmic Loop",
                    "complexity": "O(log n)",
                    "reason": "Loop condition or counter halves/doubles search space (e.g. Binary Search).",
                })
            else:
                next_depth = current_depth + 1
                bottlenecks.append({
                    "line": line_num,
                    "type": "Linear Loop",
                    "complexity": f"O(n^{next_depth})",
                    "reason": f"Loop scales linearly with input size (depth: {next_depth}).",
                })

            sub_linear, sub_log, sub_bottlenecks = analyze_multilang_loops(child, loop_types, next_depth)
            max_linear = max(max_linear, sub_linear)
            if sub_log:
                has_log = True
            bottlenecks.extend(sub_bottlenecks)
        else:
            sub_linear, sub_log, sub_bottlenecks = analyze_multilang_loops(child, loop_types, current_depth)
            max_linear = max(max_linear, sub_linear)
            if sub_log:
                has_log = True
            bottlenecks.extend(sub_bottlenecks)

    return max_linear, has_log, bottlenecks


def count_recursive_calls(node, function_name, call_type, call_name_field) -> List[int]:
    lines: List[int] = []

    if node.type == call_type:
        name_node = node.child_by_field_name(call_name_field)
        if name_node:
            called_name = name_node.text.decode("utf8")
            if called_name == function_name:
                lines.append(node.start_point[0] + 1)

    for child in node.children:
        lines.extend(count_recursive_calls(child, function_name, call_type, call_name_field))

    return lines


def has_new_object_in_loop(node, loop_types, new_object_types, inside_loop=False) -> bool:
    for child in node.children:
        child_inside_loop = inside_loop or node.type in loop_types
        if child_inside_loop and child.type in new_object_types:
            return True
        if has_new_object_in_loop(child, loop_types, new_object_types, child_inside_loop):
            return True
    return False


def analyze_code_multilang_detailed(code: str, language: str) -> Tuple[str, str, str, List[Dict[str, Any]]]:
    config = LANGUAGE_CONFIG[language]

    parser = Parser(config["language"])
    tree = parser.parse(bytes(code, "utf8"))
    root = tree.root_node

    loop_depth, has_log, loop_bottlenecks = analyze_multilang_loops(root, config["loop_types"])

    all_bottlenecks = list(loop_bottlenecks)
    recursive_calls_count = 0
    recursion_lines: List[int] = []

    def find_functions(node):
        nonlocal recursive_calls_count, recursion_lines
        if node.type in config["function_types"]:
            function_name = get_function_name(node)
            if function_name:
                calls = count_recursive_calls(
                    node, function_name, config["call_type"], config["call_name_field"]
                )
                if len(calls) > recursive_calls_count:
                    recursive_calls_count = len(calls)
                    recursion_lines = calls
        for child in node.children:
            find_functions(child)

    find_functions(root)

    if recursive_calls_count >= 2:
        all_bottlenecks.append({
            "line": recursion_lines[0] if recursion_lines else 1,
            "type": "Multiple Recursion",
            "complexity": "O(2^n)",
            "reason": f"Function makes {recursive_calls_count} recursive calls per activation without memoization.",
        })
        time_comp = "O(2^n)"
        space_comp = "O(n)"
        explanation = f"Detected exponential branching recursion ({recursive_calls_count} recursive calls per stack frame)."
        return time_comp, space_comp, explanation, all_bottlenecks

    effective_depth = loop_depth
    if recursive_calls_count == 1:
        effective_depth += 1
        all_bottlenecks.append({
            "line": recursion_lines[0] if recursion_lines else 1,
            "type": "Single Recursion",
            "complexity": "O(n)",
            "reason": "Linear recursive call chain adds O(n) activation records to stack.",
        })

    if effective_depth == 0:
        if has_log:
            time_comp = "O(log n)"
            explanation = "Loop partitions or halves the problem space (e.g. Binary Search pattern)."
        else:
            time_comp = "O(1)"
            explanation = "Constant time operations with no unbounded loops or recursion."
    elif effective_depth == 1:
        if has_log:
            time_comp = "O(n log n)"
            explanation = "Linear iteration combined with logarithmic division."
        else:
            time_comp = "O(n)"
            explanation = "Single loop over input elements scaling proportionally to N."
    elif effective_depth == 2:
        if has_log:
            time_comp = "O(n^2 log n)"
            explanation = "Nested loops with inner logarithmic partition."
        else:
            time_comp = "O(n^2)"
            explanation = "Two nested loops scaling quadratically with input size N."
    else:
        time_comp = f"O(n^{effective_depth})"
        explanation = f"Detected {effective_depth} nested loops creating polynomial O(n^{effective_depth}) complexity."

    new_obj_in_loop = has_new_object_in_loop(root, config["loop_types"], config["new_object_types"])
    if new_obj_in_loop or recursive_calls_count >= 1:
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


def analyze_code_multilang(code: str, language: str) -> Tuple[str, str]:
    time_c, space_c, _, _ = analyze_code_multilang_detailed(code, language)
    return time_c, space_c
