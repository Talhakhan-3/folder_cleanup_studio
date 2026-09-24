import re
from datetime import datetime
from pathlib import Path
from typing import List, Tuple
from .utils import safe_move

def sanitize_filename(name: str) -> str:
    """Removes invalid filename characters across Windows/Unix platforms."""
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or "unnamed_file"

def format_new_name(pattern: str, original_stem: str, date: datetime, ext: str) -> str:
    date_str = date.strftime("%Y-%m-%d")
    clean_stem = sanitize_filename(original_stem)
    formatted = pattern.replace("{name}", clean_stem)
    formatted = formatted.replace("{date}", date_str)
    formatted = formatted.replace("{ext}", ext)
    return formatted

def rename_files(
    file_paths: List[Path],
    pattern: str = "{name}_{date}{ext}",
    dry_run: bool = True
) -> Tuple[List[dict], int]:
    """Applies naming convention to files."""
    actions: List[dict] = []
    renamed_count = 0

    for path in file_paths:
        if not path.is_file():
            continue

        try:
            mtime = datetime.fromtimestamp(path.stat().st_mtime)
        except (OSError, PermissionError):
            mtime = datetime.now()

        new_name = format_new_name(pattern, path.stem, mtime, path.suffix)
        if new_name == path.name:
            continue

        target = path.parent / new_name
        final_path = safe_move(path, target, dry_run=dry_run)
        actions.append({
            "action": "rename",
            "original_path": str(path),
            "new_path": str(final_path),
        })
        renamed_count += 1

    return actions, renamed_count
