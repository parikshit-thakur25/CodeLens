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


def estimate_complexity(code: str) -> str:
    tree = ast.parse(code)
    depth = get_max_loop_depth(tree)

    if depth == 0:
        return "O(1)"
    elif depth == 1:
        return "O(n)"
    elif depth == 2:
        return "O(n^2)"
    else:
        return f"O(n^{depth})"