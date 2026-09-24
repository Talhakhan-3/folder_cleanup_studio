from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Tuple
from .utils import safe_move

def archive_old_files(
    folder_path: Path,
    file_paths: List[Path],
    archive_age_days: int = 180,
    dry_run: bool = True
) -> Tuple[List[dict], int]:
    """Moves files older than archive_age_days into dated Archive/<year> subfolders."""
    actions: List[dict] = []
    archived_count = 0
    cutoff = datetime.now() - timedelta(days=archive_age_days)

    for path in file_paths:
        if not path.is_file():
            continue

        # Skip files already in an Archive folder
        if "Archive" in path.parts:
            continue

        try:
            mtime = datetime.fromtimestamp(path.stat().st_mtime)
        except (OSError, PermissionError):
            continue

        if mtime < cutoff:
            year_str = str(mtime.year)
            target_file = folder_path / "Archive" / year_str / path.name
            final_path = safe_move(path, target_file, dry_run=dry_run)
            actions.append({
                "action": "archive",
                "original_path": str(path),
                "new_path": str(final_path),
                "year": year_str,
                "modified_date": mtime.isoformat()
            })
            archived_count += 1

    return actions, archived_count
