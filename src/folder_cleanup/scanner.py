from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from .config import DEFAULT_CATEGORIES

IGNORE_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", ".pytest_cache", ".cache"}

@dataclass
class FileInfo:
    name: str
    name_only: str
    extension: str
    path: Path
    size_bytes: int
    modified_date: datetime
    created_date: datetime
    category: str

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "name_only": self.name_only,
            "extension": self.extension,
            "path": str(self.path),
            "size_bytes": self.size_bytes,
            "modified_date": self.modified_date.isoformat(),
            "created_date": self.created_date.isoformat(),
            "category": self.category,
        }

def get_category_for_ext(ext: str, categories: Dict[str, List[str]]) -> str:
    ext_lower = ext.lower()
    for cat_name, extensions in categories.items():
        if any(e.lower() == ext_lower for e in extensions):
            return cat_name
    return "Other"

def scan_folder(folder_path: Path, recursive: bool = False, categories: Dict[str, List[str]] = None) -> List[FileInfo]:
    """Walks the folder and returns FileInfo for all applicable files."""
    if categories is None:
        categories = DEFAULT_CATEGORIES

    folder_path = folder_path.resolve()
    if not folder_path.is_dir():
        raise ValueError(f"Directory does not exist: {folder_path}")

    files: List[FileInfo] = []

    def walk_dir(directory: Path):
        try:
            entries = sorted(list(directory.iterdir()), key=lambda p: p.name)
        except (PermissionError, OSError):
            return

        for item in entries:
            if item.is_dir():
                if recursive and item.name not in IGNORE_DIRS and not item.name.startswith("."):
                    walk_dir(item)
            elif item.is_file():
                if item.name.startswith("."):
                    continue
                try:
                    stat = item.stat()
                    ext = item.suffix.lower()
                    files.append(
                        FileInfo(
                            name=item.name,
                            name_only=item.stem,
                            extension=ext,
                            path=item,
                            size_bytes=stat.st_size,
                            modified_date=datetime.fromtimestamp(stat.st_mtime),
                            created_date=datetime.fromtimestamp(stat.st_ctime),
                            category=get_category_for_ext(ext, categories),
                        )
                    )
                except (PermissionError, OSError):
                    continue

    walk_dir(folder_path)
    return files
