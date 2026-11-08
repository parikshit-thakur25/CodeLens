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

# Supported compiler mappings on Wandbox (Tier 3 fallback)
COMPILER_MAPPING = {
    "python": "cpython-3.12.7",
    "c": "gcc-13.2.0",
    "cpp": "gcc-13.2.0",
    "c++": "gcc-13.2.0",
    "java": "openjdk-jdk-21+35",
}

WANDBOX_API_URL = "https://wandbox.org/api/compile.json"

# Supported language mappings on Judge0 CE (Tier 2 fast cloud runner)
JUDGE0_LANG_MAPPING = {
    "java": 91,    # Java (JDK 17.0.6)
    "c": 103,      # C (GCC 14.1.0)
    "cpp": 105,    # C++ (GCC 14.1.0)
    "c++": 105,
    "python": 100, # Python (3.12.5)
}

JUDGE0_API_URL = "https://ce.judge0.com/submissions?wait=true"


def prepare_code(code: str, language: str) -> str:
    lang = language.lower()
    if lang == "java":
        # Wandbox saves code to prog.java.
        # Removing 'public' modifier allows any class name to compile.
        cleaned = re.sub(r"\bpublic\s+class\b", "class", code)
        return cleaned
    return code


def prepare_code_judge0(code: str, language: str) -> str:
    lang = language.lower()
    if lang == "java":
        # Judge0 executes 'java Main'.
        # If code contains a public class not named Main, rename it to Main.
        m = re.search(r"\bpublic\s+class\s+([A-Za-z0-9_]+)", code)
        if m and m.group(1) != "Main":
            target = m.group(1)
            code = re.sub(rf"\bpublic\s+class\s+{target}\b", "public class Main", code)
        elif not m and re.search(r"\bpublic\s+static\s+void\s+main\b", code):
            m2 = re.search(r"\bclass\s+([A-Za-z0-9_]+)", code)
            if m2 and m2.group(1) != "Main":
                target = m2.group(1)
                code = re.sub(rf"\bclass\s+{target}\b", "class Main", code, count=1)
    return code


def execute_local(code: str, language: str, stdin: str = "") -> Optional[Dict[str, Any]]:
    """
    Tier-1 Ultra-Fast Native Sandbox Execution.
    Executes in 15ms - 150ms directly on the host with strict timeouts.
    Returns None if the local compiler is missing so it seamlessly falls back to Tier 2/3.
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
        return None

    return None


def execute_judge0(code: str, language: str, stdin: str = "") -> Optional[Dict[str, Any]]:
    """
    Tier-2 Fast Cloud Sandbox via Judge0 CE.
    Executes in 800ms - 2000ms (10x faster than Wandbox for Java/C/C++).
    """
    lang = language.lower()
    lang_id = JUDGE0_LANG_MAPPING.get(lang)
    if not lang_id:
        return None

    formatted_code = prepare_code_judge0(code, lang)
    payload = {
        "language_id": lang_id,
        "source_code": formatted_code,
        "stdin": stdin or "",
    }

    start_time = time.perf_counter()

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            JUDGE0_API_URL,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            },
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000)
            res_json = json.loads(response.read().decode("utf-8"))

            status_obj = res_json.get("status") or {}
            status_id = status_obj.get("id", 0)

            stdout = res_json.get("stdout") or ""
            stderr = res_json.get("stderr") or ""
            compile_output = res_json.get("compile_output") or ""

            # Check compilation error (Judge0 status id 6)
            if status_id == 6 and compile_output:
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": compile_output.strip(),
                    "exit_code": "1",
                    "execution_time_ms": elapsed_ms,
                }

            # Check runtime errors (NZEC, Time Limit Exceeded, etc.)
            if status_id in (5, 11, 12, 13) or stderr:
                err_msg = stderr.strip() or compile_output.strip() or status_obj.get("description", "Runtime Error")
                return {
                    "success": False,
                    "stdout": stdout,
                    "stderr": err_msg,
                    "exit_code": str(status_id),
                    "execution_time_ms": elapsed_ms,
                }

            is_success = status_id == 3  # Accepted
            return {
                "success": is_success,
                "stdout": stdout,
                "stderr": stderr.strip(),
                "exit_code": "0" if is_success else str(status_id),
                "execution_time_ms": elapsed_ms,
            }

    except Exception:
        # Silently fall back to Wandbox on Judge0 timeout / failure
        return None


def execute_wandbox(code: str, language: str, stdin: str = "") -> Dict[str, Any]:
    """Tier-3 Cloud Isolated Sandbox Fallback via Wandbox"""
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


def make_unbuffered_c_cpp(code: str) -> str:
    """Inject unbuffered stdout into main() so printf/cout flushes immediately."""
    if "setbuf" in code or "setvbuf" in code:
        return code
    pattern = r"(int\s+main\s*\([^)]*\)\s*\{)"
    if re.search(pattern, code):
        code = re.sub(pattern, r"\1 setbuf(stdout, NULL);", code, count=1)
    return code


async def execute_interactive_ws(websocket, code: str, language: str):
    import asyncio
    import signal

    lang = language.lower()
    if lang in ("c++", "cpp"):
        lang = "cpp"
    start_time = time.perf_counter()

    with tempfile.TemporaryDirectory() as tmpdir:
        cmd = []

        if lang == "python":
            script_path = os.path.join(tmpdir, "main.py")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)
            cmd = [sys.executable, "-u", script_path]

        elif lang == "c":
            c_code = make_unbuffered_c_cpp(code)
            src_path = os.path.join(tmpdir, "main.c")
            bin_path = os.path.join(tmpdir, "run_bin")
            with open(src_path, "w", encoding="utf-8") as f:
                f.write(c_code)
            gcc = shutil.which("gcc") or "gcc"
            comp = subprocess.run([gcc, "-O2", src_path, "-o", bin_path, "-lm"], capture_output=True, text=True)
            if comp.returncode != 0:
                await websocket.send_json({"type": "stderr", "data": comp.stderr})
                await websocket.send_json({"type": "exit", "code": comp.returncode, "execution_time_ms": 0})
                return
            cmd = [bin_path]

        elif lang == "cpp":
            cpp_code = make_unbuffered_c_cpp(code)
            src_path = os.path.join(tmpdir, "main.cpp")
            bin_path = os.path.join(tmpdir, "run_bin")
            with open(src_path, "w", encoding="utf-8") as f:
                f.write(cpp_code)
            gpp = shutil.which("g++") or "g++"
            comp = subprocess.run([gpp, "-O2", "-std=c++20", src_path, "-o", bin_path], capture_output=True, text=True)
            if comp.returncode != 0:
                await websocket.send_json({"type": "stderr", "data": comp.stderr})
                await websocket.send_json({"type": "exit", "code": comp.returncode, "execution_time_ms": 0})
                return
            cmd = [bin_path]

        elif lang == "java":
            m = re.search(r"class\s+([A-Za-z0-9_]+)", code)
            classname = m.group(1) if m else "Main"
            src_path = os.path.join(tmpdir, f"{classname}.java")
            with open(src_path, "w", encoding="utf-8") as f:
                f.write(code)
            javac = shutil.which("javac") or "javac"
            java_bin = shutil.which("java") or "java"
            comp = subprocess.run([javac, src_path], capture_output=True, text=True)
            if comp.returncode != 0:
                await websocket.send_json({"type": "stderr", "data": comp.stderr})
                await websocket.send_json({"type": "exit", "code": comp.returncode, "execution_time_ms": 0})
                return
            cmd = [java_bin, "-cp", tmpdir, classname]

        else:
            await websocket.send_json({"type": "stderr", "data": f"Unsupported language: {language}"})
            await websocket.send_json({"type": "exit", "code": 1, "execution_time_ms": 0})
            return

        # Check for PTY availability (Unix/Linux/macOS)
        try:
            import pty
            import termios
            import select

            master, slave = pty.openpty()
            # Disable local echo in PTY so typed input is echoed cleanly by client
            try:
                attrs = termios.tcgetattr(slave)
                attrs[3] = attrs[3] & ~termios.ECHO
                termios.tcsetattr(slave, termios.TCSANOW, attrs)
            except Exception:
                pass

            proc = subprocess.Popen(
                cmd,
                stdin=slave,
                stdout=slave,
                stderr=slave,
                close_fds=True,
                cwd=tmpdir,
                preexec_fn=os.setsid if hasattr(os, "setsid") else None,
            )
            os.close(slave)

            loop = asyncio.get_event_loop()
            stop_event = asyncio.Event()

            async def stream_output():
                try:
                    while not stop_event.is_set():
                        def do_read():
                            r, _, _ = select.select([master], [], [], 0.05)
                            if r:
                                try:
                                    return os.read(master, 2048)
                                except OSError:
                                    return b""
                            return None

                        chunk = await loop.run_in_executor(None, do_read)
                        if chunk is not None:
                            if chunk:
                                text_data = chunk.decode("utf-8", errors="replace")
                                await websocket.send_json({"type": "stdout", "data": text_data})
                            else:
                                break

                        if proc.poll() is not None:
                            # Flush remaining bytes
                            while True:
                                r, _, _ = select.select([master], [], [], 0.02)
                                if not r:
                                    break
                                try:
                                    extra = os.read(master, 2048)
                                    if not extra:
                                        break
                                    await websocket.send_json({"type": "stdout", "data": extra.decode("utf-8", errors="replace")})
                                except OSError:
                                    break
                            break
                except Exception:
                    pass
                finally:
                    stop_event.set()

            output_task = asyncio.create_task(stream_output())

            async def handle_input():
                try:
                    while not stop_event.is_set() and proc.poll() is None:
                        try:
                            msg = await asyncio.wait_for(websocket.receive_json(), timeout=0.1)
                            mtype = msg.get("type")
                            if mtype == "stdin":
                                inp = msg.get("data", "")
                                if inp:
                                    os.write(master, inp.encode("utf-8"))
                            elif mtype == "kill":
                                if hasattr(os, "killpg") and hasattr(os, "getpgid"):
                                    try: os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
                                    except Exception: pass
                                proc.terminate()
                                break
                        except asyncio.TimeoutError:
                            continue
                except Exception:
                    pass

            input_task = asyncio.create_task(handle_input())

            try:
                await asyncio.wait_for(output_task, timeout=60.0)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "stderr", "data": "\n[Execution Timed Out (60s limit)]\n"})
                if hasattr(os, "killpg") and hasattr(os, "getpgid"):
                    try: os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                    except Exception: pass
                proc.kill()
            finally:
                stop_event.set()
                input_task.cancel()
                try: proc.wait(timeout=1)
                except Exception: proc.kill()
                try: os.close(master)
                except Exception: pass

        except ImportError:
            # Fallback for systems without PTY
            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=0,
                cwd=tmpdir,
            )
            out, err = proc.communicate(timeout=10)
            if out:
                await websocket.send_json({"type": "stdout", "data": out})
            if err:
                await websocket.send_json({"type": "stderr", "data": err})

        elapsed_ms = round((time.perf_counter() - start_time) * 1000)
        await websocket.send_json({"type": "exit", "code": proc.returncode or 0, "execution_time_ms": elapsed_ms})


def execute_code(code: str, language: str, stdin: str = "") -> Dict[str, Any]:
    """
    3-Tier Execution Pipeline:
    1. Tier 1: Instant Native Host Sandbox (~25ms for Python, sub-second for C/C++)
    2. Tier 2: Judge0 CE Fast Cloud Sandbox (~1.5s for Java / Cloud C)
    3. Tier 3: Wandbox Cloud Sandbox (Reliable fallback)
    """
    # Try Tier 1: Local
    local_result = execute_local(code, language, stdin)
    if local_result is not None:
        return local_result

    # Try Tier 2: Judge0 Fast Cloud Engine
    judge0_result = execute_judge0(code, language, stdin)
    if judge0_result is not None:
        return judge0_result

    # Tier 3: Wandbox Fallback
    return execute_wandbox(code, language, stdin)
