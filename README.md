<div align="center">

# 🔍 CodeLens Studio

### Multi-language Online Compiler & Algorithmic Complexity Diagnostics

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat&logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Render-4169E1?style=flat&logo=postgresql&logoColor=white)
![Status](https://img.shields.io/badge/status-active-emerald?style=flat)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat)

</div>

---

## 💡 Why I built this

I'm a 3rd semester CSE (AI-DS) student, and complexity analysis (Big-O) was one of the topics I understood in theory but wanted to see applied in real tools. I decided to build **CodeLens Studio** — an interactive online code execution sandbox and structural complexity analyzer.

Instead of running untrusted code for complexity or guessing Big-O with simple heuristics, CodeLens uses **Python AST** and **Tree-Sitter syntax trees** to inspect code structure, loop nesting, logarithmic counter stepping, recursion branching, and auxiliary data structures — coupled with a secure sandbox compiler.

---

## ✨ Features

| Status | Feature |
|--------|---------|
| ✅ | **Online Multi-Language Compiler** (`/run`) — compile & execute Python 3, Java 21, and C++ 20 in a secure sandbox |
| ✅ | **Real-Time Terminal Output** — live stdout, stderr, exit codes, and millisecond execution timer |
| ✅ | **Big-O Static Analysis Engine** (`/analyze`) — calculates Time and Space Complexity without arbitrary code execution |
| ✅ | **Logarithmic ($O(\log n)$) & Constant Detection** — detects Binary Search partitions, geometric step updates, and fixed loop bounds |
| ✅ | **Line-by-Line Bottleneck Diagnostics** — pinpoint exact lines causing complexity spikes |
| ✅ | **Tree-Sitter Multilingual Parsing** — AST-level precision for Java and C++ syntax |
| ✅ | **PostgreSQL Persistence** (Render) & SQLite local fallback |
| ✅ | **React + Monaco Editor IDE** — VS Code experience, custom syntax themes, stdin drawer |
| ✅ | **CORS & Deployment Ready** — automated origin handling for Vercel, Render, and custom domains |

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Backend**
- FastAPI & Uvicorn
- Pydantic v2
- SQLAlchemy (SQLite + PostgreSQL with psycopg2)
- Python `ast` module
- `tree-sitter` (`tree-sitter-java`, `tree-sitter-cpp`)
- Secure Sandbox Execution Engine

</td>
<td valign="top" width="50%">

**Frontend**
- React 19 + Vite
- Monaco Editor (`@monaco-editor/react`)
- Tailwind CSS v4
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

**Supported languages:** `python`, `java`, `cpp`

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
