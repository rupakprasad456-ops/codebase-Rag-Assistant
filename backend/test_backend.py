"""
Backend Sanity Verification Script
Verifies parser chunking, vector indexing, and RAG query retrieval.
"""
import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(__file__))

from parser import parser_engine
from vector_store import vector_db
from rag_engine import rag_pipeline

def test_rag_pipeline():
    sample_dir = os.path.join(os.path.dirname(__file__), "sample_codebase")
    print(f"Testing sample codebase indexing from: {sample_dir}")
    
    # 1. Parse sample codebase
    all_chunks = []
    for root, _, files in os.walk(sample_dir):
        for f in files:
            fp = os.path.join(root, f)
            with open(fp, "r", encoding="utf-8", errors="ignore") as file_obj:
                content = file_obj.read()
            chunks = parser_engine.parse_file(fp, content, root_dir=sample_dir)
            all_chunks.extend(chunks)
            print(f"File '{f}' parsed into {len(chunks)} chunk(s).")
            
    print(f"\nTotal AST Chunks parsed: {len(all_chunks)}")
    
    # 2. Index in vector store
    vector_db.index_chunks(all_chunks, reset=True)
    stats = vector_db.get_stats()
    print(f"Vector DB Stats: {stats}")
    
    # 3. Test RAG Search Query
    test_queries = [
        "How does authentication and JWT token creation work?",
        "Where are payment intents created for Stripe?",
        "How is user database session handled?"
    ]
    
    print("\n--- Testing RAG Queries ---")
    for q in test_queries:
        print(f"\nQuery: '{q}'")
        res = rag_pipeline.execute_query(q, top_k=3)
        print(f"Found {len(res['citations'])} citations in {res['metrics']['retrieval_time_sec']}s")
        for c in res['citations']:
            print(f"  - Citation: {c['file_path']}:{c['line_start']}-{c['line_end']} (Symbol: {c['symbol_name']}, Score: {c['score']})")

if __name__ == "__main__":
    test_rag_pipeline()
