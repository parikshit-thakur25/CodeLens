from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

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

@app.post("/analyze")
def analyze_code(submission: CodeSubmission):
    if not submission.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    return {
        "received_code": submission.code,
        "length": len(submission.code)
    }