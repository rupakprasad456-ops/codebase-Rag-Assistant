"""
Hybrid Vector Database Store for Codebase RAG
Combines Dense TF-IDF / Subword Embedding vectors with BM25 exact keyword scoring for high-precision code retrieval.
"""
import json
import math
import os
import sys
import re
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parser import CodeChunk

class VectorStore:
    """In-memory hybrid vector store with BM25 keyword matching and persistence."""
    
    def __init__(self):
        self.chunks: List[CodeChunk] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.vectors: Optional[np.ndarray] = None
        self.hybrid_ratio: float = 0.6  # 0.6 Vector similarity + 0.4 BM25 exact match
        self.indexed_files: Dict[str, Dict[str, Any]] = {}

    def _prepare_corpus(self, chunks: List[CodeChunk]) -> List[str]:
        """Builds searchable representation of chunks including docstrings and identifiers."""
        corpus = []
        for chunk in chunks:
            # Tokenize camelCase / snake_case into separate words for better search matching
            split_symbol = " ".join(re.findall(r'[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|\d|\b)|[0-9]+', chunk.symbol_name))
            text = f"{chunk.file_path} {chunk.symbol_name} {split_symbol} {chunk.symbol_type} {chunk.docstring}\n{chunk.content}"
            corpus.append(text)
        return corpus

    def index_chunks(self, chunks: List[CodeChunk], reset: bool = True):
        """Indexes code chunks and generates vector space model."""
        if reset:
            self.chunks = chunks
        else:
            self.chunks.extend(chunks)
            
        if not self.chunks:
            self.vectors = None
            self.vectorizer = None
            return

        corpus = self._prepare_corpus(self.chunks)
        
        # Configure subword and word tokenization vectorizer
        self.vectorizer = TfidfVectorizer(
            analyzer='word',
            token_pattern=r'(?u)\b\w+\b',
            ngram_range=(1, 2),
            sublinear_tf=True,
            norm='l2'
        )
        
        self.vectors = self.vectorizer.fit_transform(corpus).toarray()
        
        # Track indexed files metadata
        self.indexed_files = {}
        for chunk in self.chunks:
            fp = chunk.file_path
            if fp not in self.indexed_files:
                self.indexed_files[fp] = {
                    "file_path": fp,
                    "file_name": chunk.file_name,
                    "language": chunk.language,
                    "chunks_count": 0,
                    "symbols": []
                }
            self.indexed_files[fp]["chunks_count"] += 1
            if chunk.symbol_name and chunk.symbol_name not in self.indexed_files[fp]["symbols"]:
                self.indexed_files[fp]["symbols"].append(chunk.symbol_name)

    def _bm25_search(self, query: str) -> np.ndarray:
        """Calculates BM25 keyword matching scores for exact identifier hits."""
        if not self.chunks:
            return np.array([])
            
        query_terms = re.findall(r'\w+', query.lower())
        scores = np.zeros(len(self.chunks))
        
        avg_len = sum(len(c.content.split()) for c in self.chunks) / max(1, len(self.chunks))
        k1 = 1.5
        b = 0.75
        
        for idx, chunk in enumerate(self.chunks):
            content_lower = chunk.content.lower() + " " + chunk.file_path.lower() + " " + chunk.symbol_name.lower()
            doc_len = len(content_lower.split())
            score = 0.0
            
            for term in query_terms:
                if term in content_lower:
                    freq = content_lower.count(term)
                    # Extra boost if term matches symbol name or file path
                    if term == chunk.symbol_name.lower():
                        freq += 5
                    if term in chunk.file_path.lower():
                        freq += 3
                        
                    tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc_len / max(1, avg_len))))
                    score += tf
                    
            scores[idx] = score
            
        max_s = np.max(scores) if np.max(scores) > 0 else 1.0
        return scores / max_s  # Normalize

    def search(self, query: str, top_k: int = 5) -> List[Tuple[CodeChunk, float]]:
        """Performs hybrid vector search returning top matching code chunks with relevance score."""
        if not self.chunks or self.vectorizer is None or self.vectors is None:
            return []

        # Vector similarity search
        query_vec = self.vectorizer.transform([query]).toarray()[0]
        query_norm = np.linalg.norm(query_vec)
        
        if query_norm > 0:
            doc_norms = np.linalg.norm(self.vectors, axis=1)
            doc_norms[doc_norms == 0] = 1e-10
            vector_sims = np.dot(self.vectors, query_vec) / (doc_norms * query_norm)
        else:
            vector_sims = np.zeros(len(self.chunks))

        # BM25 Keyword Search
        bm25_scores = self._bm25_search(query)
        
        # Hybrid combined score
        hybrid_scores = (self.hybrid_ratio * vector_sims) + ((1.0 - self.hybrid_ratio) * bm25_scores)
        
        # Sort top-k
        top_indices = np.argsort(hybrid_scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            score = float(hybrid_scores[idx])
            if score > 0.01:  # Filter noise threshold
                results.append((self.chunks[idx], round(score, 4)))
                
        return results

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics on currently indexed repository."""
        lang_counts = {}
        for f_info in self.indexed_files.values():
            lang = f_info["language"]
            lang_counts[lang] = lang_counts.get(lang, 0) + 1

        return {
            "total_files": len(self.indexed_files),
            "total_chunks": len(self.chunks),
            "language_breakdown": lang_counts,
            "indexed_files": list(self.indexed_files.values())
        }

vector_db = VectorStore()
