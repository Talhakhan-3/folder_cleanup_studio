from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple
from .utils import calculate_sha256, safe_move

@dataclass
class DedupeResult:
    hash_value: str
    original: Path
    duplicates: List[Path]

def find_duplicates(file_paths: List[Path]) -> Dict[str, List[Path]]:
    """Groups files by identical SHA-256 hash."""
    hashes: Dict[str, List[Path]] = {}
    for p in file_paths:
        if p.is_file():
            h = calculate_sha256(p)
            if h:
                hashes.setdefault(h, []).append(p)

    return {h: paths for h, paths in hashes.items() if len(paths) > 1}

def deduplicate_files(
    folder_path: Path,
    file_paths: List[Path],
    dry_run: bool = True
) -> Tuple[List[dict], int]:
    """
    Finds duplicate files by SHA-256 content hash.
    The first file is kept in place, and subsequent identical files are moved
    to folder_path / 'review_duplicates' so nothing is ever permanently deleted.
    """
    duplicates_map = find_duplicates(file_paths)
    actions: List[dict] = []
    duplicates_folder = folder_path / "review_duplicates"
    total_moved = 0

    for hash_val, paths in duplicates_map.items():
        # Keep the first file, move the rest
        kept = paths[0]
        for dup in paths[1:]:
            target = duplicates_folder / dup.name
            final_path = safe_move(dup, target, dry_run=dry_run)
            actions.append({
                "action": "deduplicate",
                "original_path": str(dup),
                "new_path": str(final_path),
                "hash": hash_val,
                "kept_original": str(kept)
            })
            total_moved += 1

    return actions, total_moved
