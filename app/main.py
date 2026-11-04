from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.analyzer import estimate_time_complexity, estimate_space_complexity
from app.analyzer_multilang import analyze_code_multilang
from app.database import engine, SessionLocal, Base
from app.models import Analysis
import ast

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    code: str
    language: str = "python"


@app.post("/analyze")
def analyze_code(submission: CodeSubmission, db: Session = Depends(get_db)):
    if not submission.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    language = submission.language.lower()

    if language == "python":
        try:
            tree = ast.parse(submission.code)
            time_complexity = estimate_time_complexity(submission.code, tree)
            space_complexity = estimate_space_complexity(tree)
        except SyntaxError:
            raise HTTPException(status_code=400, detail="Invalid Python code")
    elif language in ("java", "cpp"):
        try:
            time_complexity, space_complexity = analyze_code_multilang(submission.code, language)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Could not parse {language} code")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    record = Analysis(
        code=submission.code,
        time_complexity=time_complexity,
        space_complexity=space_complexity
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "received_code": submission.code,
        "length": len(submission.code),
        "estimated_time_complexity": time_complexity,
        "estimated_space_complexity": space_complexity
    }


@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(Analysis).order_by(Analysis.created_at.desc()).all()
    return records