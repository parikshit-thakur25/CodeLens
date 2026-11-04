<div align="center">

# 🔍 CodeLens

### AI-powered multi-language code complexity analyzer

![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat&logo=react&logoColor=white)
![Status](https://img.shields.io/badge/status-in%20progress-yellow?style=flat)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat)

</div>

---

## 💡 Why I built this

I'm a 3rd semester CSE (AI-DS) student, and complexity analysis (Big-O) was one of the topics I understood in theory but never felt confident applying. So instead of just revising it from notes, I decided to build a tool that reads actual code and estimates its time/space complexity — forcing me to deeply understand recursion, loops, and call stacks well enough to write a program that reasons about them across multiple languages.

This is a learning project first, a resume project second — every commit here represents something I actually understand, not copy-pasted code.

---

## ✨ Features

| Status | Feature |
|--------|---------|
| ✅ | FastAPI backend with structured routing |
| ✅ | `/analyze` endpoint — accepts code, validates input |
| ✅ | AST-based parsing engine (Python) for loops, recursion, and nested structures |
| ✅ | Tree-sitter based parsing engine (Java, C++) |
| ✅ | Time complexity estimation (O(1), O(n), O(n²), O(2ⁿ)) |
| ✅ | Space complexity estimation (collection growth, recursion stack depth) |
| ✅ | SQLite database — every analysis is persisted with timestamp |
| ✅ | `/history` endpoint — retrieve past analyses |
| ✅ | React (Vite) frontend with Monaco code editor |
| ✅ | Language selector (Python / Java / C++) with live syntax highlighting |
| ✅ | History view in the UI |
| ✅ | Tailwind CSS styled dark-themed interface |
| 🚧 | LLM-powered plain-English explanations |
| 🚧 | ML classifier for complexity prediction |
| 🚧 | Deployment (Render + Vercel) |

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Backend**
- FastAPI
- Pydantic
- Uvicorn
- SQLAlchemy + SQLite
- Python `ast` module (Python parsing)
- `tree-sitter` (Java, C++ parsing)

</td>
<td valign="top" width="50%">

**Frontend**
- React + Vite
- Monaco Editor
- Tailwind CSS v4

**Planned**
- PostgreSQL
- OpenAI / Claude API
- Vercel + Render

</td>
</tr>
</table>

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check / root |
| `GET` | `/health` | Status check |
| `GET` | `/about` | Project info |
| `POST` | `/echo` | Test endpoint — echoes back input |
| `POST` | `/analyze` | Accepts `{ code, language }`, returns estimated time/space complexity |
| `GET` | `/history` | Returns all past analyses, newest first |

**Supported languages:** `python`, `java`, `cpp`

---

## 🚀 Setup

### Backend

```bash
# clone the repo
git clone https://github.com/parikshit-thakur25/CodeLens.git
cd CodeLens

# create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# install dependencies
pip install -r requirements.txt

# run the server
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` to try it out via Swagger UI.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to use the UI.

---

<div align="center">

Built by [Parikshit Thakur](https://github.com/parikshit-thakur25)

</div>
