import json
import os
import shutil
from pathlib import Path
from typing import List, Tuple
from .logger import logger

UNDO_LOG_PATH = Path("logs/undo_log.json")

def save_undo_log(actions: List[dict], log_file: Path = UNDO_LOG_PATH) -> None:
    """Saves executed actions to undo log."""
    log_file.parent.mkdir(parents=True, exist_ok=True)
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(actions, f, indent=2)

def load_undo_log(log_file: Path = UNDO_LOG_PATH) -> List[dict]:
    if not log_file.is_file():
        return []
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to read undo log: {e}")
        return []

def clear_undo_log(log_file: Path = UNDO_LOG_PATH) -> None:
    if log_file.is_file():
        log_file.unlink()

def perform_undo(log_file: Path = UNDO_LOG_PATH) -> Tuple[int, List[str]]:
    """Reverses actions from the undo log, most recent first."""
    actions = load_undo_log(log_file)
    if not actions:
        return 0, ["No undo log found or it is empty."]

    reversed_count = 0
    errors: List[str] = []

    # Execute in reverse order
    for item in reversed(actions):
        current_loc = Path(item["new_path"])
        orig_loc = Path(item["original_path"])

        if current_loc.exists():
            orig_loc.parent.mkdir(parents=True, exist_ok=True)
            try:
                shutil.move(str(current_loc), str(orig_loc))
                reversed_count += 1
                # Try cleaning up empty parent folder if possible
                try:
                    if not any(current_loc.parent.iterdir()):
                        current_loc.parent.rmdir()
                except OSError:
                    pass
            except Exception as err:
                errors.append(f"Failed to move {current_loc} -> {orig_loc}: {err}")
        else:
            errors.append(f"File not found at {current_loc}")

    clear_undo_log(log_file)
    return reversed_count, errors

if __name__ == "__main__":
    count, errs = perform_undo()
    print(f"Undo completed: {count} actions reversed.")
    if errs:
        print(f"Errors encountered: {len(errs)}")
        for e in errs:
            print(f"  - {e}")
