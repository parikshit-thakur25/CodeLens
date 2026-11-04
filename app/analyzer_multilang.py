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
}


def get_function_name(node):
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


def get_max_loop_depth(node, loop_types, current_depth=0):
    max_depth = current_depth

    for child in node.children:
        if child.type in loop_types:
            child_depth = get_max_loop_depth(child, loop_types, current_depth + 1)
        else:
            child_depth = get_max_loop_depth(child, loop_types, current_depth)

        max_depth = max(max_depth, child_depth)

    return max_depth


def count_recursive_calls(node, function_name, call_type, call_name_field):
    count = 0

    if node.type == call_type:
        name_node = node.child_by_field_name(call_name_field)
        if name_node:
            called_name = name_node.text.decode("utf8")
            if called_name == function_name:
                count += 1

    for child in node.children:
        count += count_recursive_calls(child, function_name, call_type, call_name_field)

    return count


def has_new_object_in_loop(node, loop_types, new_object_types, inside_loop=False):
    found = False

    for child in node.children:
        child_inside_loop = inside_loop or node.type in loop_types

        if child_inside_loop and child.type in new_object_types:
            found = True

        if has_new_object_in_loop(child, loop_types, new_object_types, child_inside_loop):
            found = True

    return found


def analyze_code_multilang(code: str, language: str):
    config = LANGUAGE_CONFIG[language]

    parser = Parser(config["language"])
    tree = parser.parse(bytes(code, "utf8"))
    root = tree.root_node

    loop_depth = get_max_loop_depth(root, config["loop_types"])

    recursive_calls = 0
    has_recursion = False

    def find_functions(node):
        nonlocal recursive_calls, has_recursion
        if node.type in config["function_types"]:
            function_name = get_function_name(node)
            if function_name:
                calls = count_recursive_calls(
                    node, function_name, config["call_type"], config["call_name_field"]
                )
                if calls >= 1:
                    has_recursion = True
                recursive_calls = max(recursive_calls, calls)
        for child in node.children:
            find_functions(child)

    find_functions(root)

    if recursive_calls >= 2:
        time_complexity = "O(2^n)"
    else:
        depth = loop_depth
        if recursive_calls == 1:
            depth += 1

        if depth == 0:
            time_complexity = "O(1)"
        elif depth == 1:
            time_complexity = "O(n)"
        elif depth == 2:
            time_complexity = "O(n^2)"
        else:
            time_complexity = f"O(n^{depth})"

    new_obj_in_loop = has_new_object_in_loop(root, config["loop_types"], config["new_object_types"])

    if new_obj_in_loop or has_recursion:
        space_complexity = "O(n)"
    else:
        space_complexity = "O(1)"

    return time_complexity, space_complexity