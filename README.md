<div align="center">

# 🔍 CodeLens

### AI-Powered Code Complexity Analyzer

*Understand your code. Analyze its complexity. Write better algorithms.*

<br/>

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Status](https://img.shields.io/badge/Status-In_Development-orange?style=for-the-badge)](https://github.com/parikshit-thakur25/CodeLens)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📌 About

CodeLens is a project I'm building to explore how code complexity can be analyzed automatically.

The idea is simple: submit a piece of code and get insights into its structure, estimated time complexity (Big-O), and space complexity.

I'm starting with a FastAPI backend and gradually building towards an AST-based analysis engine, an interactive frontend, and AI-powered explanations.

This is a learning-focused project where I'm building and understanding each component step by step.

## ✨ Planned Features

<table>
<tr>
<td width="50%" valign="top">

### 🔍 Code Analysis

- Python code submission
- AST-based parsing
- Loop and recursion detection
- Code structure analysis

</td>
<td width="50%" valign="top">

### ⚡ Complexity Analysis

- Time complexity estimation
- Space complexity estimation
- Big-O classification
- Recursive call analysis

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🤖 AI Integration

- Plain-English explanations
- Complexity reasoning
- Code optimization suggestions

</td>
<td width="50%" valign="top">

### 📊 User Interface

- Interactive code editor
- Analysis dashboard
- Analysis history
- Visual complexity reports

</td>
</tr>
</table>

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%" valign="top">

**Backend**

![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?logo=pydantic&logoColor=white)

</td>
<td width="50%" valign="top">

**Frontend — Planned**

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

</td>
</tr>
<tr>
<td width="50%" valign="top">

**Analysis & AI — Planned**

![AST](https://img.shields.io/badge/Python_AST-3776AB?logo=python&logoColor=white)
![Machine Learning](https://img.shields.io/badge/Machine_Learning-8A2BE2)

</td>
<td width="50%" valign="top">

**Tools**

![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)
![VS Code](https://img.shields.io/badge/VS_Code-007ACC?logo=visualstudiocode&logoColor=white)

</td>
</tr>
</table>

## 📡 API Endpoints

The current backend provides five endpoints:

| Method | Endpoint | Description |
|:---:|:---|:---|
| GET | `/` | Root endpoint |
| GET | `/health` | Health check |
| GET | `/about` | Project information |
| POST | `/echo` | Echo test endpoint |
| POST | `/analyze` | Accepts code submissions |

### Example: Code Analysis Request

**Request**

```json
{
  "code": "print('hello world')"
}
```

**Current Response**

```json
{
  "received_code": "print('hello world')",
  "length": 20
}
```

The current `/analyze` endpoint accepts code and returns the submitted string along with its length. Actual complexity analysis is still under development.

## 🏗️ Planned Architecture

```text
       Python Code
            |
            v
      FastAPI Backend
            |
            v
        AST Parser
            |
            v
   Complexity Analyzer
            |
            v
     AI Explanation
            |
            v
     Analysis Report
```

*This represents the intended architecture, not the current implementation.*

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/parikshit-thakur25/CodeLens.git
cd CodeLens
```

### 2. Create a virtual environment

```bash
python3 -m venv venv
```

### 3. Activate the environment

```bash
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the backend

```bash
uvicorn app.main:app --reload
```

### 6. Open API documentation

Visit `http://127.0.0.1:8000/docs`

## 📂 Project Structure

```text
CodeLens/
│
├── app/
│   ├── __init__.py
│   └── main.py
│
├── .gitignore
├── requirements.txt
└── README.md
```

## 🗺️ Development Roadmap

| Milestone | Status |
|:---|:---:|
| FastAPI backend setup | ✅ Completed |
| API endpoints and project structure | ✅ Completed |
| Input validation and error handling | 🚧 In Progress |
| Python AST parsing engine | ⏳ Planned |
| Time and space complexity analysis | ⏳ Planned |
| Database integration | ⏳ Planned |
| React frontend and code editor | ⏳ Planned |
| AI-powered code explanations | ⏳ Planned |
| ML-based complexity prediction | ⏳ Planned |
| Dashboard and analysis history | ⏳ Planned |
| Testing and deployment | ⏳ Planned |

## 🎯 What I'm Learning

While building CodeLens, I'm exploring:

- Data Structures and Algorithms
- Time and Space Complexity
- Abstract Syntax Trees
- Backend Development and REST APIs
- Machine Learning and AI Integration
- Full-Stack Development

---

<div align="center">

### 👨‍💻 Built by [Parikshit Thakur](https://github.com/parikshit-thakur25)

*Learning, building, and improving one commit at a time.*

</div>
