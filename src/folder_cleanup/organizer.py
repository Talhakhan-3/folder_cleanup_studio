from pathlib import Path
from typing import Dict, List, Tuple
from .scanner import get_category_for_ext
from .utils import safe_move

def organize_files(
    folder_path: Path,
    file_paths: List[Path],
    categories: Dict[str, List[str]],
    dry_run: bool = True
) -> Tuple[List[dict], int]:
    """Organizes files into category subfolders based on extension."""
    actions: List[dict] = []
    organized_count = 0

    special_folders = {"Archive", "review_duplicates"}

    for path in file_paths:
        if not path.is_file():
            continue

        # Skip files already in Archive or review_duplicates
        if any(part in special_folders for part in path.parts):
            continue

        cat = get_category_for_ext(path.suffix, categories)
        target_dir = folder_path / cat

        # Don't move if it's already in the category folder
        if path.parent == target_dir:
            continue

        target_file = target_dir / path.name
        final_path = safe_move(path, target_file, dry_run=dry_run)
        actions.append({
            "action": "organize",
            "original_path": str(path),
            "new_path": str(final_path),
            "category": cat
        })
        organized_count += 1

    return actions, organized_count
