import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

# Supported compiler mappings on Wandbox (Cloud fallback)
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
        # Removing 'public' modifier allows any class name to compile.
        cleaned = re.sub(r"\bpublic\s+class\b", "class", code)
        return cleaned
    return code


def execute_local(code: str, language: str, stdin: str = "") -> Optional[Dict[str, Any]]:
    """
    Tier-1 Ultra-Fast Native Sandbox Execution.
    Executes in 15ms - 150ms directly on the host with strict timeouts.
    Returns None if the local compiler is missing so it seamlessly falls back to Wandbox.
    """
    lang = language.lower()
    start_time = time.perf_counter()

    try:
        # 1. Native Python Sandbox (Ultra-fast: ~25ms)
        if lang == "python":
            with tempfile.TemporaryDirectory() as tmpdir:
                script_path = os.path.join(tmpdir, "main.py")
                with open(script_path, "w", encoding="utf-8") as f:
                    f.write(code)

                try:
                    run_res = subprocess.run(
                        [sys.executable, "-u", script_path],
                        input=stdin or "",
                        capture_output=True,
                        text=True,
                        timeout=7,
                    )
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000)
                    is_success = run_res.returncode == 0
                    return {
                        "success": is_success,
                        "stdout": run_res.stdout,
                        "stderr": run_res.stderr.strip(),
                        "exit_code": str(run_res.returncode),
                        "execution_time_ms": elapsed_ms,
                    }
                except subprocess.TimeoutExpired:
                    return {
                        "success": False,
                        "stdout": "",
                        "stderr": "Execution timed out (7s limit exceeded). Possible infinite loop or recursion.",
                        "exit_code": "124",
                        "execution_time_ms": 7000,
                    }

        # 2. Native C Sandbox (GCC / Clang)
        elif lang == "c":
            cc = shutil.which("gcc") or shutil.which("clang")
            if not cc:
                return None

            with tempfile.TemporaryDirectory() as tmpdir:
                src_path = os.path.join(tmpdir, "main.c")
                bin_path = os.path.join(tmpdir, "main.out")
                with open(src_path, "w", encoding="utf-8") as f:
                    f.write(code)

                # Compile with optimization
                compile_res = subprocess.run(
                    [cc, "-O2", "-pipe", src_path, "-o", bin_path, "-lm"],
                    capture_output=True,
                    text=True,
                    timeout=5,
                )

                if compile_res.returncode != 0:
                    if "Unable to locate a Java Runtime" in compile_res.stderr or "No Java runtime present" in compile_res.stderr:
                        return None
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000)
                    return {
                        "success": False,
                        "stdout": "",
                        "stderr": compile_res.stderr.strip(),
                        "exit_code": str(compile_res.returncode),
                        "execution_time_ms": elapsed_ms,
                    }

                try:
                    run_res = subprocess.run(
                        [bin_path],
                        input=stdin or "",
                        capture_output=True,
                        text=True,
                        timeout=5,
                    )
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000)
                    is_success = run_res.returncode == 0 and not run_res.stderr.strip()
                    return {
                        "success": is_success,
                        "stdout": run_res.stdout,
                        "stderr": run_res.stderr.strip(),
                        "exit_code": str(run_res.returncode),
                        "execution_time_ms": elapsed_ms,
                    }
                except subprocess.TimeoutExpired:
                    return {
                        "success": False,
                        "stdout": "",
                        "stderr": "Execution timed out (5s limit exceeded). Possible infinite loop or recursion.",
                        "exit_code": "124",
                        "execution_time_ms": 5000,
                    }

        # 3. Native C++ Sandbox (G++ / Clang++)
        elif lang in ("cpp", "c++"):
            cxx = shutil.which("g++") or shutil.which("clang++")
            if not cxx:
                return None

            with tempfile.TemporaryDirectory() as tmpdir:
                src_path = os.path.join(tmpdir, "main.cpp")
                bin_path = os.path.join(tmpdir, "main.out")
                with open(src_path, "w", encoding="utf-8") as f:
                    f.write(code)

                # Try C++20, fallback to C++17
                compile_res = subprocess.run(
                    [cxx, "-std=c++20", "-O2", "-pipe", src_path, "-o", bin_path],
                    capture_output=True,
                    text=True,
                    timeout=6,
                )
                if compile_res.returncode != 0:
                    compile_res = subprocess.run(
                        [cxx, "-std=c++17", "-O2", "-pipe", src_path, "-o", bin_path],
                        capture_output=True,
                        text=True,
                        timeout=6,
                    )

                if compile_res.returncode != 0:
                    if "Unable to locate a Java Runtime" in compile_res.stderr or "No Java runtime present" in compile_res.stderr:
                        return None
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000)
                    return {
                        "success": False,
                        "stdout": "",
                        "stderr": compile_res.stderr.strip(),
                        "exit_code": str(compile_res.returncode),
                        "execution_time_ms": elapsed_ms,
                    }

                try:
                    run_res = subprocess.run(
                        [bin_path],
                        input=stdin or "",
                        capture_output=True,
                        text=True,
                        timeout=5,
                    )
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000)
                    is_success = run_res.returncode == 0 and not run_res.stderr.strip()
                    return {
                        "success": is_success,
                        "stdout": run_res.stdout,
                        "stderr": run_res.stderr.strip(),
                        "exit_code": str(run_res.returncode),
                        "execution_time_ms": elapsed_ms,
                    }
                except subprocess.TimeoutExpired:
                    return {
                        "success": False,
                        "stdout": "",
                        "stderr": "Execution timed out (5s limit exceeded). Possible infinite loop or recursion.",
                        "exit_code": "124",
                        "execution_time_ms": 5000,
                    }

        # 4. Native Java Sandbox (JDK)
        elif lang == "java":
            javac = shutil.which("javac")
            java_bin = shutil.which("java")
            if not javac or not java_bin:
                return None

            match = re.search(r"class\s+([A-Za-z0-9_]+)", code)
            classname = match.group(1) if match else "Main"

            with tempfile.TemporaryDirectory() as tmpdir:
                src_path = os.path.join(tmpdir, f"{classname}.java")
                with open(src_path, "w", encoding="utf-8") as f:
                    f.write(code)

                compile_res = subprocess.run(
                    [javac, src_path],
                    capture_output=True,
                    text=True,
                    timeout=6,
                )

                if compile_res.returncode != 0:
                    if "Unable to locate a Java Runtime" in compile_res.stderr or "No Java runtime present" in compile_res.stderr:
                        return None
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000)
                    return {
                        "success": False,
                        "stdout": "",
                        "stderr": compile_res.stderr.strip(),
                        "exit_code": str(compile_res.returncode),
                        "execution_time_ms": elapsed_ms,
                    }

                try:
                    run_res = subprocess.run(
                        [java_bin, "-cp", tmpdir, classname],
                        input=stdin or "",
                        capture_output=True,
                        text=True,
                        timeout=5,
                    )
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000)
                    is_success = run_res.returncode == 0 and not run_res.stderr.strip()
                    return {
                        "success": is_success,
                        "stdout": run_res.stdout,
                        "stderr": run_res.stderr.strip(),
                        "exit_code": str(run_res.returncode),
                        "execution_time_ms": elapsed_ms,
                    }
                except subprocess.TimeoutExpired:
                    return {
                        "success": False,
                        "stdout": "",
                        "stderr": "Execution timed out (5s limit exceeded). Possible infinite loop or recursion.",
                        "exit_code": "124",
                        "execution_time_ms": 5000,
                    }

    except Exception:
        # Fall back to Wandbox on any unexpected local execution failure
        return None

    return None


def execute_wandbox(code: str, language: str, stdin: str = "") -> Dict[str, Any]:
    """Tier-2 Cloud Isolated Sandbox Fallback via Wandbox"""
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

        with urllib.request.urlopen(req, timeout=20) as response:
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


def execute_code(code: str, language: str, stdin: str = "") -> Dict[str, Any]:
    """
    Dual-Tier Execution Strategy:
    1. Try ultra-fast native sandbox first (< 100ms response)
    2. Seamlessly fall back to Wandbox cloud sandbox if local run is unavailable
    """
    local_result = execute_local(code, language, stdin)
    if local_result is not None:
        return local_result

    return execute_wandbox(code, language, stdin)
