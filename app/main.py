from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, List
import ast
import os

from app.analyzer import analyze_python_detailed
from app.analyzer_multilang import analyze_code_multilang_detailed
from app.runner import execute_code
from app.database import engine, SessionLocal, Base
from app.models import Analysis, User, UserFile
from app.auth import hash_password, verify_password, create_token, decode_token

# Automatically create all tables (analyses, users, user_files)
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
    "https://codelens.parikshit07.tech",
]

env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*(\.vercel\.app|\.parikshit07\.tech)",
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


def get_current_user_optional(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == payload.get("uid")).first()


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    user = get_current_user_optional(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required or token expired")
    return user


# --- Health & Info Endpoints ---

@app.get("/")
def read_root():
    return {"message": "CodeLens Studio backend is running", "version": "2.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/about")
def about():
    return {"project": "CodeLens Studio", "purpose": "Online multi-language compiler & algorithmic complexity diagnostics"}


# --- Auth Models & Routes ---

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


@app.post("/auth/register")
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    clean_username = data.username.strip().lower()
    clean_email = data.email.strip().lower()

    existing = db.query(User).filter((User.username == clean_username) | (User.email == clean_email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email is already registered")

    user = User(
        username=clean_username,
        email=clean_email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.username)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
    }


@app.post("/auth/login")
def login_user(data: UserLogin, db: Session = Depends(get_db)):
    clean_identifier = data.username.strip().lower()
    user = db.query(User).filter(
        (User.username == clean_identifier) | (User.email == clean_identifier)
    ).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    token = create_token(user.id, user.username)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
    }


@app.get("/auth/me")
def get_user_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }


# --- File Management Models & Routes ---

class FileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    language: str
    code: str


class FileUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None


@app.get("/files")
def list_user_files(
    language: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(UserFile).filter(UserFile.user_id == user.id)
    if language:
        query = query.filter(UserFile.language == language.lower())
    files = query.order_by(UserFile.updated_at.desc()).all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "language": f.language,
            "code": f.code,
            "created_at": f.created_at,
            "updated_at": f.updated_at,
        }
        for f in files
    ]


@app.post("/files")
def create_user_file(
    file_data: FileCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_file = UserFile(
        user_id=user.id,
        name=file_data.name.strip(),
        language=file_data.language.lower(),
        code=file_data.code,
    )
    db.add(user_file)
    db.commit()
    db.refresh(user_file)
    return {
        "id": user_file.id,
        "name": user_file.name,
        "language": user_file.language,
        "code": user_file.code,
        "created_at": user_file.created_at,
        "updated_at": user_file.updated_at,
    }


@app.put("/files/{file_id}")
def update_user_file(
    file_id: int,
    file_data: FileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == user.id).first()
    if not user_file:
        raise HTTPException(status_code=404, detail="File not found")

    if file_data.name is not None:
        user_file.name = file_data.name.strip()
    if file_data.code is not None:
        user_file.code = file_data.code

    db.commit()
    db.refresh(user_file)
    return {
        "id": user_file.id,
        "name": user_file.name,
        "language": user_file.language,
        "code": user_file.code,
        "updated_at": user_file.updated_at,
    }


@app.delete("/files/{file_id}")
def delete_user_file(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == user.id).first()
    if not user_file:
        raise HTTPException(status_code=404, detail="File not found")

    db.delete(user_file)
    db.commit()
    return {"message": "File deleted successfully"}


# --- Code Analysis & Execution ---

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
    elif language in ("java", "cpp", "c++", "c"):
        lang_key = "java" if language == "java" else ("c" if language == "c" else "cpp")
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
    if language in ("c", "cpp", "c++", "java", "python"):
        lang_key = "c" if language == "c" else ("cpp" if language in ("cpp", "c++") else language)
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
