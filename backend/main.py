"""
FastAPI Main Application Server for Codebase RAG Assistant
Provides REST API endpoints for repository indexing, querying, settings, and file content viewing.
"""
import os
import shutil
import tempfile
import zipfile
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from parser import parser_engine, CodeChunk
from vector_store import vector_db
from rag_engine import rag_pipeline

app = FastAPI(title="Codebase RAG Assistant API", version="1.0.0")

# Enable CORS for frontend Vite dev server (port 5173 / 3000 / all)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_CODEBASE_DIR = os.path.join(os.path.dirname(__file__), "sample_codebase")

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

class SettingsRequest(BaseModel):
    provider: str  # "offline", "gemini", "openai", "ollama"
    api_key: Optional[str] = ""
    model_name: Optional[str] = ""
    hybrid_ratio: Optional[float] = 0.6

class DirectoryIndexRequest(BaseModel):
    directory_path: str

@app.get("/")
def root():
    return {"message": "Codebase RAG Assistant Backend Server Running", "status": "online"}

@app.get("/api/status")
def get_status():
    """Returns database index status, indexed file list, and current RAG engine config."""
    stats = vector_db.get_stats()
    return {
        "status": "ready" if stats["total_chunks"] > 0 else "unindexed",
        "stats": stats,
        "config": {
            "provider": rag_pipeline.provider,
            "has_api_key": bool(rag_pipeline.api_key),
            "model_name": rag_pipeline.model_name,
            "hybrid_ratio": vector_db.hybrid_ratio
        }
    }

def _index_directory_internal(target_dir: str) -> Dict[str, Any]:
    """Helper to walk directory and parse supported code files."""
    if not os.path.exists(target_dir):
        raise HTTPException(status_code=400, detail=f"Directory path does not exist: {target_dir}")

    all_chunks: List[CodeChunk] = []
    supported_exts = {".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".json", ".md", ".sql", ".java", ".cpp", ".c", ".go", ".rs"}
    
    indexed_file_paths = []
    
    for root, dirs, files in os.walk(target_dir):
        # Ignore common non-code dirs
        dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "__pycache__", "venv", ".venv", "dist", "build"}]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in supported_exts:
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    file_chunks = parser_engine.parse_file(full_path, content, root_dir=target_dir)
                    all_chunks.extend(file_chunks)
                    indexed_file_paths.append(os.path.relpath(full_path, target_dir))
                except Exception as e:
                    print(f"Error parsing file {full_path}: {e}")

    vector_db.index_chunks(all_chunks, reset=True)
    return {
        "message": f"Successfully indexed {len(indexed_file_paths)} files into {len(all_chunks)} chunks.",
        "total_files": len(indexed_file_paths),
        "total_chunks": len(all_chunks),
        "indexed_files": indexed_file_paths
    }

@app.post("/api/index-sample")
def index_sample_codebase():
    """Indexes the built-in sample codebase for immediate out-of-the-box testing."""
    if not os.path.exists(SAMPLE_CODEBASE_DIR):
        raise HTTPException(status_code=404, detail="Sample codebase directory not found")
    return _index_directory_internal(SAMPLE_CODEBASE_DIR)

@app.post("/api/index-path")
def index_local_path(req: DirectoryIndexRequest):
    """Indexes a local folder path specified by the user."""
    return _index_directory_internal(req.directory_path)

@app.post("/api/upload-zip")
async def upload_zip_archive(file: UploadFile = File(...)):
    """Uploads and indexes a .zip archive containing source code."""
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a .zip archive")
        
    temp_dir = tempfile.mkdtemp(prefix="rag_repo_")
    try:
        zip_path = os.path.join(temp_dir, file.filename)
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        extract_dir = os.path.join(temp_dir, "extracted")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
            
        result = _index_directory_internal(extract_dir)
        return result
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.post("/api/query")
def query_codebase(req: QueryRequest):
    """Query codebase using hybrid vector search and RAG synthesis."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty")
        
    res = rag_pipeline.execute_query(req.query, top_k=req.top_k or 5)
    return res

@app.get("/api/chunks")
def list_chunks(search: Optional[str] = None, language: Optional[str] = None):
    """Retrieve indexed chunks for inspection in Vector Explorer."""
    results = []
    for chunk in vector_db.chunks:
        if language and chunk.language.lower() != language.lower():
            continue
        if search:
            s_lower = search.lower()
            if s_lower not in chunk.content.lower() and s_lower not in chunk.file_path.lower() and s_lower not in chunk.symbol_name.lower():
                continue
        results.append(chunk.to_dict())
    return {"total": len(results), "chunks": results}

@app.get("/api/file-content")
def get_file_content(path: str = Query(...)):
    """Fetches full file content for citation preview modal."""
    # Check in sample codebase first
    sample_target = os.path.normpath(os.path.join(SAMPLE_CODEBASE_DIR, path))
    if os.path.exists(sample_target) and sample_target.startswith(SAMPLE_CODEBASE_DIR):
        with open(sample_target, "r", encoding="utf-8", errors="ignore") as f:
            return {"file_path": path, "content": f.read()}
            
    # Check absolute / direct path
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return {"file_path": path, "content": f.read()}

    # Search in vector store chunks for matching content
    matched = [c for c in vector_db.chunks if c.file_path == path]
    if matched:
        combined = "\n".join([c.content for c in matched])
        return {"file_path": path, "content": combined}
        
    raise HTTPException(status_code=404, detail="File content not found")

@app.post("/api/settings")
def update_settings(req: SettingsRequest):
    """Configures LLM provider, API keys, and retrieval parameters."""
    rag_pipeline.set_config(
        provider=req.provider,
        api_key=req.api_key or "",
        model_name=req.model_name or "",
        hybrid_ratio=req.hybrid_ratio if req.hybrid_ratio is not None else 0.6
    )
    return {"message": "Settings updated successfully", "config": get_status()["config"]}

# Auto-index sample codebase on startup if empty
@app.on_event("startup")
def startup_event():
    if os.path.exists(SAMPLE_CODEBASE_DIR):
        print("Auto-indexing sample codebase on server startup...")
        _index_directory_internal(SAMPLE_CODEBASE_DIR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
