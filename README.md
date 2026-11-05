cat << 'EOF' > /Users/parikshit/Desktop/CodeLens/README.md
<div align="center">

# 🔍 CodeLens Studio

### An online IDE that runs your code and explains its Big-O complexity.

[**Launch Live Studio**](https://codelens.parikshit07.tech) • [**Backend API Docs**](https://codelens-ijv2.onrender.com/docs) • [**Portfolio**](https://parikshit07.tech)

<br/>

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![C / C++](https://img.shields.io/badge/C%20%2F%20C%2B%2B-GCC%2013-00599C?style=flat-square&logo=c%2B%2B&logoColor=white)](https://gcc.gnu.org)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React%2019-Vite-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

<br/>

<p align="center">
  <img src="https://www.parikshit07.tech/codelens-ui.png" alt="CodeLens Studio Interface Preview" width="100%" style="border-radius: 10px;" />
</p>

</div>

---

## 💡 Why I Built This

Hey! I'm Parikshit, a CSE student (AI & Data Science) at Graphic Era (Deemed to be University).

While practicing DSA problems for placements and interviews, one thing always bothered me: most online compilers just give you runtime in milliseconds. That number fluctuates based on server load or CPU spikes, but it doesn't tell you whether your solution is actually **$O(n)$** or **$O(n^2)$**.

I wanted to build an IDE where you don't just compile your code, but you actually understand its algorithmic cost:

1. **No logins or setup**: Open the browser, pick a language, write code, hit run.
2. **Static Big-O detection**: Instead of guessing runtime benchmarks, it inspects your code's syntax tree (using Python AST & Tree-Sitter) to detect nested loops, logarithmic steps, and recursion.
3. **Line-by-line bottlenecks**: It highlights the specific line causing your complexity to spike so you know what to optimize.

---

## ✨ What It Does

- **Multi-Language Playground**: Write and run **Python 3.12**, **C (GCC 13)**, **C++ 20**, and **Java 21** with sub-second execution times and custom standard input (`stdin`).
- **Static Big-O Analysis**: Calculates Time and Space complexity ($O(1)$, $O(\log n)$, $O(n)$, $O(n \log n)$, $O(n^2)$) using AST parsers without executing untrusted code.
- **Bottleneck Highlighting**: Points directly to nested loops or recursion branches that are slowing your algorithm down.
- **Monaco Editor (VS Code core)**: Full syntax highlighting, auto-closing brackets, shortcuts, and custom themes (*VS Code Dark, Obsidian Black, Clean Light*).
- **Private & Local**: Snippets are saved directly in your browser's local storage. Nothing is stored in the cloud unless you export it.

---

## 🧠 How the Complexity Engine Works

Rather than timing how long your program takes to run (which depends on CPU and OS), CodeLens inspects the **structural syntax tree**:

- **$O(1)$ Constant Time**: Direct math, variable assignments, and fixed-range iterations.
- **$O(\log n)$ Logarithmic Time**: Halving/doubling loop steppers (like Binary Search: `mid = (low + high) // 2`, `low = mid + 1`, `n /= 2`).
- **$O(n)$ Linear Time**: Single-pass loops over input arrays or strings.
- **$O(n \log n)$ Linearithmic Time**: Divide-and-conquer merges and nested logarithmic iterations.
- **$O(n^2)$ Polynomial Time**: Nested loops (like Bubble Sort or 2D matrix traversal).
- **Space Complexity**: Inspects auxiliary data structures (arrays, hash maps) and recursion call stack depth.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Monaco Editor, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI (Python 3.12), Python `ast` module, Tree-Sitter (`c`, `cpp`, `java`).
- **Execution**: Subprocess sandbox engine with Judge0 CE fallback.
- **Hosting**: Render Cloud (FastAPI backend + Vite frontend) with custom domain routing.

---

## 🚀 Running Locally

If you'd like to run CodeLens locally on your machine:

### 1. Backend

```bash
git clone https://github.com/parikshit-thakur25/CodeLens.git
cd CodeLens

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies & run test suite
pip install -r requirements.txt
python test_suite.py

# Start API server
uvicorn app.main:app --reload
