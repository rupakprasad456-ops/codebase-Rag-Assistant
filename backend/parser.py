"""
AST & Language-Aware Code Parser and Chunking Engine
Extracts code symbols (functions, classes, docstrings) and creates semantic chunks with line metadata.
"""
import ast
import os
import re
from typing import List, Dict, Any, Optional

class CodeChunk:
    """Represents a chunk of indexed source code with structural metadata."""
    def __init__(
        self,
        chunk_id: str,
        file_path: str,
        file_name: str,
        language: str,
        symbol_name: str,
        symbol_type: str,
        line_start: int,
        line_end: int,
        content: str,
        docstring: Optional[str] = None
    ):
        self.chunk_id = chunk_id
        self.file_path = file_path
        self.file_name = file_name
        self.language = language
        self.symbol_name = symbol_name
        self.symbol_type = symbol_type
        self.line_start = line_start
        self.line_end = line_end
        self.content = content
        self.docstring = docstring or ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "file_path": self.file_path,
            "file_name": self.file_name,
            "language": self.language,
            "symbol_name": self.symbol_name,
            "symbol_type": self.symbol_type,
            "line_start": self.line_start,
            "line_end": self.line_end,
            "content": self.content,
            "docstring": self.docstring
        }

class CodeParser:
    """Parses source files into AST symbols and overlapping window chunks."""
    
    @staticmethod
    def detect_language(file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        mapping = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".html": "html",
            ".css": "css",
            ".json": "json",
            ".md": "markdown",
            ".sql": "sql",
            ".cpp": "cpp",
            ".c": "c",
            ".java": "java",
            ".go": "go",
            ".rs": "rust"
        }
        return mapping.get(ext, "text")

    def parse_python_file(self, file_path: str, content: str, rel_path: str) -> List[CodeChunk]:
        """Parses a Python file into class/function AST nodes and module blocks."""
        chunks: List[CodeChunk] = []
        lines = content.splitlines()
        file_name = os.path.basename(file_path)
        
        try:
            tree = ast.parse(content, filename=file_path)
            
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                    start = node.lineno
                    end = getattr(node, 'end_lineno', start + len(ast.unparse(node).splitlines()))
                    
                    symbol_type = "class" if isinstance(node, ast.ClassDef) else "function"
                    symbol_name = node.name
                    docstring = ast.get_docstring(node)
                    
                    node_lines = lines[start - 1 : end]
                    snippet = "\n".join(node_lines)
                    
                    chunk_id = f"{rel_path}:{symbol_name}:{start}-{end}"
                    chunks.append(CodeChunk(
                        chunk_id=chunk_id,
                        file_path=rel_path,
                        file_name=file_name,
                        language="python",
                        symbol_name=symbol_name,
                        symbol_type=symbol_type,
                        line_start=start,
                        line_end=end,
                        content=snippet,
                        docstring=docstring
                    ))
        except Exception:
            # Fallback if AST parsing encounters syntax error
            pass
            
        # Fallback / General sliding window if no AST chunks or to cover top-level imports & module statements
        if not chunks:
            chunks = self.sliding_window_chunks(rel_path, content, language="python")
            
        return chunks

    def parse_js_ts_file(self, file_path: str, content: str, rel_path: str) -> List[CodeChunk]:
        """Parses JS/TS file using structural Regex matching for functions, classes, components."""
        chunks: List[CodeChunk] = []
        lines = content.splitlines()
        file_name = os.path.basename(file_path)
        lang = self.detect_language(file_path)
        
        # Regex patterns for functions, components, classes
        patterns = [
            (r'^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)', 'function'),
            (r'^\s*(?:export\s+)?class\s+([A-Za-z0-9_]+)', 'class'),
            (r'^\s*(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>', 'function'),
        ]
        
        found_blocks = []
        for idx, line in enumerate(lines, 1):
            for pat, sym_type in patterns:
                match = re.search(pat, line)
                if match:
                    found_blocks.append((idx, match.group(1), sym_type))
                    break

        if found_blocks:
            for i, (start_line, name, sym_type) in enumerate(found_blocks):
                # End line is either start of next block minus 1, or start_line + 30, or end of file
                if i + 1 < len(found_blocks):
                    end_line = max(start_line, found_blocks[i+1][0] - 1)
                else:
                    end_line = min(len(lines), start_line + 40)
                    
                snippet = "\n".join(lines[start_line - 1 : end_line])
                chunk_id = f"{rel_path}:{name}:{start_line}-{end_line}"
                chunks.append(CodeChunk(
                    chunk_id=chunk_id,
                    file_path=rel_path,
                    file_name=file_name,
                    language=lang,
                    symbol_name=name,
                    symbol_type=sym_type,
                    line_start=start_line,
                    line_end=end_line,
                    content=snippet
                ))

        if not chunks:
            chunks = self.sliding_window_chunks(rel_path, content, language=lang)

        return chunks

    def sliding_window_chunks(
        self,
        rel_path: str,
        content: str,
        language: str,
        chunk_lines: int = 35,
        overlap_lines: int = 10
    ) -> List[CodeChunk]:
        """Creates sliding window chunks for files without explicit AST symbol structures."""
        chunks: List[CodeChunk] = []
        lines = content.splitlines()
        file_name = os.path.basename(rel_path)
        
        if not lines:
            return chunks
            
        step = max(1, chunk_lines - overlap_lines)
        idx = 0
        chunk_num = 1
        
        while idx < len(lines):
            end_idx = min(len(lines), idx + chunk_lines)
            snippet = "\n".join(lines[idx:end_idx])
            start_line = idx + 1
            end_line = end_idx
            
            chunk_id = f"{rel_path}:block_{chunk_num}:{start_line}-{end_line}"
            chunks.append(CodeChunk(
                chunk_id=chunk_id,
                file_path=rel_path,
                file_name=file_name,
                language=language,
                symbol_name=f"block_{chunk_num}",
                symbol_type="module_block",
                line_start=start_line,
                line_end=end_line,
                content=snippet
            ))
            
            idx += step
            chunk_num += 1
            
        return chunks

    def parse_file(self, file_path: str, content: str, root_dir: str) -> List[CodeChunk]:
        """Entry point to parse a file based on extension."""
        rel_path = os.path.relpath(file_path, root_dir).replace('\\', '/')
        lang = self.detect_language(file_path)
        
        if lang == "python":
            return self.parse_python_file(file_path, content, rel_path)
        elif lang in ("javascript", "typescript"):
            return self.parse_js_ts_file(file_path, content, rel_path)
        else:
            return self.sliding_window_chunks(rel_path, content, language=lang)

parser_engine = CodeParser()
