<div align="center">

# 🔍 CodeLens

### AI-powered code complexity analyzer

![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)
![Status](https://img.shields.io/badge/status-in%20progress-yellow?style=flat)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat)

</div>

---

## 💡 Why I built this

I'm a 3rd semester CSE (AI-DS) student, and complexity analysis (Big-O) was one of the topics I understood in theory but never felt confident applying. So instead of just revising it from notes, I decided to build a tool that reads actual Python code and estimates its time/space complexity — forcing me to deeply understand recursion, loops, and call stacks well enough to write a program that reasons about them.

This is a learning project first, a resume project second — every commit here represents something I actually understand, not copy-pasted code.

---

## ✨ Features

| Status | Feature |
|--------|---------|
| ✅ | FastAPI backend with structured routing |
| ✅ | `/analyze` endpoint — accepts code, validates input |
| ✅ | Input validation with proper HTTP error responses |
| 🚧 | AST-based parsing to walk code structure |
| 🚧 | Time/space complexity estimation engine |
| 🚧 | LLM-powered plain-English explanations |
| 🚧 | React + Monaco Editor frontend |
| 🚧 | Redis + queue-based async processing |
| 🚧 | ML classifier for complexity prediction |
| 🚧 | Dashboard for analysis history |

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Backend (current)**
- FastAPI
- Pydantic
- Uvicorn

</td>
<td valign="top" width="50%">

**Planned**
- React / Next.js + Monaco Editor
- PostgreSQL
- Redis + Celery/RQ
- scikit-learn
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
| `POST` | `/analyze` | Accepts code, returns analysis (validates empty input) |

---

## 🚀 Setup

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

Then open `http://127.0.0.1:8000/docs` to try it out via Swagger UI.

---

<div align="center">

Built by [Parikshit Thakur](https://github.com/parikshit-thakur25)

</div>
