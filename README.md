<div align="center">

# 🔍 CodeLens Studio

### High-Performance Online IDE & Real-Time Algorithmic Complexity Diagnostics

**🌐 Live Studio:** [codelens.parikshit07.tech](https://codelens.parikshit07.tech)  
**⚡ Backend API:** [codelens-ijv2.onrender.com](https://codelens-ijv2.onrender.com)

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python&logoColor=white)
![C](https://img.shields.io/badge/C-GCC_13-A8B9CC?style=flat&logo=c&logoColor=white)
![C++](https://img.shields.io/badge/C++-20_GCC_13-00599C?style=flat&logo=c%2B%2B&logoColor=white)
![Java](https://img.shields.io/badge/Java-21_LTS-ED8B00?style=flat&logo=openjdk&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19_Vite-61DAFB?style=flat&logo=react&logoColor=white)
![Status](https://img.shields.io/badge/status-active-emerald?style=flat)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat)

</div>

---

## 💡 Why I built this

I'm a 3rd semester CSE (AI-DS) student, and complexity analysis (Big-O) was one of the topics I understood in theory but wanted to see applied in real tools. I built **CodeLens Studio** — a friction-free, zero-login online code execution sandbox and structural complexity analyzer.

Instead of running untrusted code for complexity or guessing Big-O with simple heuristics, CodeLens uses **Python AST** and **Tree-Sitter syntax trees** to inspect code structure, loop nesting, logarithmic counter stepping, recursion branching, and auxiliary data structures — coupled with a sub-second secure sandbox compiler.

---

## ✨ Features

| Status | Feature |
|--------|---------|
| ✅ | **Zero-Login Frictionless Studio** — instant access, no sign-in or authentication barriers |
| ✅ | **High-Speed Multi-Language Compiler** (`/run`) — execute Python 3.12, C (GCC 13), C++ 20, and Java 21 in sub-second sandboxes |
| ✅ | **Big-O Static Analysis Engine** (`/analyze`) — calculates Time and Space Complexity without arbitrary code execution |
| ✅ | **Logarithmic ($O(\log n)$) & Constant Detection** — detects Binary Search partitions, geometric step updates, and fixed loop bounds |
| ✅ | **Line-by-Line Bottleneck Diagnostics** — pinpoint exact lines causing complexity spikes with direct editor jump |
| ✅ | **Tree-Sitter Multilingual Parsing** — AST-level precision for Python, C, C++, and Java syntax |
| ✅ | **Persistent Local Workspace** — save, load, and export snippets locally in browser storage with zero cloud login required |
| ✅ | **React + Monaco Editor IDE** — VS Code experience, custom themes (VS Code Dark, Obsidian, Clean Light), stdin drawer |
| ✅ | **Seamless Browser Navigation** — browser history (`←`) smoothly transitions between compiler and interactive guide tour |

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Backend**
- FastAPI & Uvicorn (Asynchronous Python Web Server)
- Pydantic v2
- Python `ast` module (AST structural parsing)
- `tree-sitter` (`tree-sitter-c`, `tree-sitter-cpp`, `tree-sitter-java`, `tree-sitter-python`)
- Multi-tier Sandbox Execution Engine (Native Subprocess + Judge0 CE + Wandbox)
- SQLAlchemy (SQLite + PostgreSQL with psycopg2)

</td>
<td valign="top" width="50%">

**Frontend**
- React 19 + Vite
- Monaco Editor (`@monaco-editor/react`)
- Tailwind CSS v4
- High-contrast accessible themes (Clean Light, VS Code Dark, Obsidian Black)
- Responsive Dual-Pane Studio Layout

</td>
</tr>
</table>

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Root / Health message |
| `GET` | `/health` | Server status check |
| `POST` | `/run` | Compiles & executes code in sandbox, returns `{ stdout, stderr, execution_time_ms, exit_code }` |
| `POST` | `/analyze` | Structural AST/Tree-Sitter analysis returning Big-O metrics, explanation & bottlenecks |
| `GET` | `/history` | Returns all past analyses, newest first |
| `DELETE`| `/history` | Clears all past analysis history records |
| `DELETE`| `/history/{id}` | Deletes a single analysis record by ID |

**Supported languages:** `python`, `c`, `cpp`, `java`

---

## 🚀 Local Development

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/parikshit-thakur25/CodeLens.git
cd CodeLens

# Setup virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the test suite
python test_suite.py

# Start FastAPI server
uvicorn app.main:app --reload
```

Interactive API docs available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to launch CodeLens Studio.

---

<div align="center">

Built with ❤️ by [Parikshit Thakur](https://github.com/parikshit-thakur25)

</div>
