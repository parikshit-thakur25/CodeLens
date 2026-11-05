import json
import re
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

# Supported compiler mappings on Wandbox
COMPILER_MAPPING = {
    "python": "cpython-3.12.7",
    "c": "gcc-13.2.0",
    "cpp": "gcc-13.2.0",
    "c++": "gcc-13.2.0",
    "java": "openjdk-jdk-21+35",
}

WANDBOX_API_URL = "https://wandbox.org/api/compile.json"


def prepare_code(code: str, language: str) -> str:
    lang = language.lower()
    if lang == "java":
        # Wandbox saves code to prog.java.
        # If user declares 'public class Foo', javac fails with:
        # 'class Foo is public, should be declared in a file named Foo.java'.
        # Removing the 'public' modifier allows any class name to compile.
        cleaned = re.sub(r"\bpublic\s+class\b", "class", code)
        return cleaned
    return code


def execute_code(code: str, language: str, stdin: str = "") -> Dict[str, Any]:
    lang = language.lower()
    compiler = COMPILER_MAPPING.get(lang)

    if not compiler:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution currently unsupported for language: {language}",
            "execution_time_ms": 0,
        }

    formatted_code = prepare_code(code, lang)
    payload = {
        "compiler": compiler,
        "code": formatted_code,
        "stdin": stdin or "",
    }

    start_time = time.perf_counter()

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            WANDBOX_API_URL,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "CodeLens-Studio/2.0",
            },
        )

        with urllib.request.urlopen(req, timeout=12) as response:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000)
            res_json = json.loads(response.read().decode("utf-8"))

            status = res_json.get("status", "0")
            compiler_err = (
                res_json.get("compiler_error", "")
                or res_json.get("compiler_message", "")
                or ""
            )
            program_out = res_json.get("program_output", "") or ""
            program_err = res_json.get("program_error", "") or ""

            # Check if compilation failed
            if status != "0" and compiler_err:
                return {
                    "success": False,
                    "stdout": program_out,
                    "stderr": compiler_err.strip(),
                    "exit_code": status,
                    "execution_time_ms": elapsed_ms,
                }

            is_success = status == "0" and not program_err

            return {
                "success": is_success,
                "stdout": program_out,
                "stderr": program_err.strip(),
                "exit_code": status,
                "execution_time_ms": elapsed_ms,
            }

    except urllib.error.HTTPError as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000)
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution Service HTTP Error {e.code}: {e.reason}",
            "execution_time_ms": elapsed_ms,
        }
    except urllib.error.URLError as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000)
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution Service Network Error: {e.reason}",
            "execution_time_ms": elapsed_ms,
        }
    except Exception as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000)
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution failed: {str(e)}",
            "execution_time_ms": elapsed_ms,
        }

