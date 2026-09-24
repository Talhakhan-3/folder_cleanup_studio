import hashlib
import os
import shutil
from pathlib import Path
from typing import Optional

def get_unique_path(target_path: Path) -> Path:
    """If target_path already exists, appends _1, _2, etc. before extension to avoid collisions."""
    if not target_path.exists():
        return target_path

    directory = target_path.parent
    stem = target_path.stem
    suffix = target_path.suffix
    counter = 1

    while True:
        candidate = directory / f"{stem}_{counter}{suffix}"
        if not candidate.exists():
            return candidate
        counter += 1

def safe_move(source: Path, destination: Path, dry_run: bool = True) -> Path:
    """
    Safely moves a file from source to destination.
    Creates parent directories if needed. Handles cross-filesystem moves.
    """
    destination = get_unique_path(destination)
    if not dry_run:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(source), str(destination))
    return destination

def calculate_sha256(file_path: Path, block_size: int = 65536) -> Optional[str]:
    """Calculates SHA-256 hash for a file using streaming blocks."""
    if not file_path.is_file():
        return None
    hasher = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(block_size), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except (OSError, PermissionError):
        return None
