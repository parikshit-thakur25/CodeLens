import ast


def get_max_loop_depth(node, current_depth=0):
    max_depth = current_depth

    for child in ast.iter_child_nodes(node):
        if isinstance(child, (ast.For, ast.While)):
            child_depth = get_max_loop_depth(child, current_depth + 1)
        else:
            child_depth = get_max_loop_depth(child, current_depth)

        max_depth = max(max_depth, child_depth)

    return max_depth


def count_recursive_calls(node, function_name):
    count = 0

    for child in ast.walk(node):
        if isinstance(child, ast.Call) and isinstance(child.func, ast.Name):
            if child.func.id == function_name:
                count += 1

    return count


def estimate_complexity(code: str) -> str:
    tree = ast.parse(code)

    loop_depth = get_max_loop_depth(tree)

    recursive_calls = 0
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            calls = count_recursive_calls(node, node.name)
            recursive_calls = max(recursive_calls, calls)

    if recursive_calls >= 2:
        return "O(2^n)"

    depth = loop_depth
    if recursive_calls == 1:
        depth += 1

    if depth == 0:
        return "O(1)"
    elif depth == 1:
        return "O(n)"
    elif depth == 2:
        return "O(n^2)"
    else:
        return f"O(n^{depth})"
    