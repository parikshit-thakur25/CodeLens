from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.analyzer import analyze_python_detailed
from app.analyzer_multilang import analyze_code_multilang_detailed
from app.runner import execute_code
from app.database import engine, SessionLocal, Base
from app.models import Analysis
import ast
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CodeLens Studio API", version="2.0.0")

# Allowed origins for CORS (Local dev, Vercel deployments, custom domain)
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://parikshit07.tech",
    "https://www.parikshit07.tech",
]

env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "CodeLens backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/about")
def about():
    return {"project": "CodeLens", "purpose": "AI-powered code complexity analyzer"}


@app.post("/echo")
def echo_message(data: dict):
    return {"you_sent": data}


class CodeSubmission(BaseModel):
    code: str = Field(..., max_length=100000)
    language: str = "python"


class RunSubmission(BaseModel):
    code: str = Field(..., max_length=100000)
    language: str = "python"
    stdin: str = ""


@app.post("/analyze")
def analyze_code(submission: CodeSubmission, db: Session = Depends(get_db)):
    if not submission.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    language = submission.language.lower()
    explanation = ""
    bottlenecks = []

    if language == "python":
        try:
            tree = ast.parse(submission.code)
            time_complexity, space_complexity, explanation, bottlenecks = analyze_python_detailed(
                submission.code, tree
            )
        except SyntaxError as e:
            raise HTTPException(status_code=400, detail=f"Python Syntax Error (Line {e.lineno}): {e.msg}")
    elif language in ("java", "cpp", "c++"):
        lang_key = "cpp" if language in ("cpp", "c++") else "java"
        try:
            time_complexity, space_complexity, explanation, bottlenecks = analyze_code_multilang_detailed(
                submission.code, lang_key
            )
        except Exception:
            raise HTTPException(status_code=400, detail=f"Could not parse {language} code")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    record = Analysis(
        code=submission.code,
        time_complexity=time_complexity,
        space_complexity=space_complexity,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "received_code": submission.code,
        "length": len(submission.code),
        "estimated_time_complexity": time_complexity,
        "estimated_space_complexity": space_complexity,
        "explanation": explanation,
        "bottlenecks": bottlenecks,
    }


@app.post("/run")
def run_code_endpoint(submission: RunSubmission):
    if not submission.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    language = submission.language.lower()
    if language in ("cpp", "c++"):
        lang_key = "cpp"
    elif language in ("java", "python"):
        lang_key = language
    else:
        raise HTTPException(status_code=400, detail=f"Language '{language}' execution is not supported")

    result = execute_code(
        code=submission.code,
        language=lang_key,
        stdin=submission.stdin,
    )
    return result


@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(Analysis).order_by(Analysis.created_at.desc()).all()
    return records