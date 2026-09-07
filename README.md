# 🚀 Codebase RAG Assistant

An AI-powered, AST-aware Codebase Intelligence & Q&A Assistant featuring a Python FastAPI backend (hybrid BM25 + vector search engine) and a sleek React + Vite dark glassmorphism dashboard.

![Codebase RAG Assistant UI](https://raw.githubusercontent.com/rupakprasad456-ops/codebase-Rag-Assistant/main/docs/preview.png)

---

## 🌟 Key Features

- **🌲 Language-Aware AST Parser**: Automatically extracts functions, classes, docstrings, imports, and exact line ranges (`line_start`, `line_end`) for Python, JS/TS, HTML/CSS, and structural code files.
- **⚡ Hybrid Vector Retrieval**: Combines TF-IDF dense vector embeddings with BM25 term frequency weighting to ensure exact code identifier hits (e.g. `AuthManager`, `create_payment_intent`) receive high precision alongside high-level conceptual questions.
- **🤖 Multi-LLM & Offline Support**: Supports Google Gemini API, OpenAI GPT-4o, Ollama local models, and a zero-dependency **Built-in Offline Smart Code Engine**.
- **📄 Interactive Source Citations**: Every answer includes clickable inline citations (`filename:line_start-line_end`). Clicking a citation opens the Code Viewer modal with highlighted line ranges.
- **📂 Repository Indexer**: Index local directory paths, upload `.zip` archives, or test immediately with a pre-configured multi-file sample codebase.
- **🔍 Vector & Chunk Explorer**: Searchable inspector for parsed AST chunks, token vectors, and metadata.

---

## 🏗️ Architecture

```
[ Frontend: React + Vite Dashboard ]
  ├── 💬 RAG Chat Assistant (Clickable citations, streaming answers, query presets)
  ├── 📂 Repository Indexer (Folder path / Zip upload / Sample repo loader)
  ├── 🔍 Chunk Explorer (AST symbol inspector, language filters, vector score inspect)
  └── ⚙️ RAG Settings (LLM provider toggle, hybrid search ratio slider)

                      │ REST API HTTP / JSON
                      ▼

[ Backend: Python FastAPI Server ]
  ├── 🌲 AST & Syntax Parser (Python ast, JS/TS structural regex matcher)
  ├── ✂️ Code Chunking Engine (Symbol-aware chunking with sliding window overlap)
  ├── 🧠 Hybrid Vector Database (BM25 keyword matching + Cosine Similarity)
  └── 🤖 RAG Query Pipeline (Context selector, prompt synthesizer, provider router)
```

---

## 🚦 Quick Start

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173/`.

---

## 🧪 Testing Backend Pipeline
Run the self-contained backend verification script:
```bash
python backend/test_backend.py
```

---

## 📜 License
MIT License
