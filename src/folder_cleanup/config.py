import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List

DEFAULT_CATEGORIES = {
    "Images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"],
    "Documents": [".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt"],
    "Spreadsheets": [".xls", ".xlsx", ".csv"],
    "Presentations": [".ppt", ".pptx"],
    "Audio": [".mp3", ".wav", ".flac", ".aac"],
    "Video": [".mp4", ".mov", ".avi", ".mkv"],
    "Archives": [".zip", ".rar", ".7z", ".tar", ".gz"],
    "Code": [".py", ".js", ".ts", ".html", ".css", ".java", ".cpp", ".c", ".json"],
    "Other": []
}

@dataclass
class CleanupConfig:
    dry_run: bool = True
    archive_age_days: int = 180
    rename_pattern: str = "{name}_{date}{ext}"
    categories: Dict[str, List[str]] = field(default_factory=lambda: DEFAULT_CATEGORIES.copy())

    @classmethod
    def load(cls, config_path: str = "config.json") -> "CleanupConfig":
        config = cls()
        path = Path(config_path)

        if path.is_file():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if not isinstance(data, dict):
                        raise ValueError("Configuration must be a JSON object.")
                    if "dry_run" in data and isinstance(data["dry_run"], bool):
                        config.dry_run = data["dry_run"]
                    if "archive_age_days" in data and isinstance(data["archive_age_days"], int):
                        config.archive_age_days = data["archive_age_days"]
                    if "rename_pattern" in data and isinstance(data["rename_pattern"], str):
                        config.rename_pattern = data["rename_pattern"]
                    if "categories" in data and isinstance(data["categories"], dict):
                        config.categories = data["categories"]
            except Exception as e:
                print(f"[WARN] Error loading {config_path}: {e}. Using fallback defaults.")

        # Environment variable overrides
        env_dry_run = os.getenv("FOLDER_CLEANUP_DRY_RUN")
        if env_dry_run is not None:
            config.dry_run = env_dry_run.lower() in ("1", "true", "yes")

        env_age = os.getenv("FOLDER_CLEANUP_ARCHIVE_AGE_DAYS")
        if env_age:
            try:
                config.archive_age_days = int(env_age)
            except ValueError:
                pass

        env_pattern = os.getenv("FOLDER_CLEANUP_RENAME_PATTERN")
        if env_pattern:
            config.rename_pattern = env_pattern

        return config

    def save(self, config_path: str = "config.json") -> None:
        data = {
            "dry_run": self.dry_run,
            "archive_age_days": self.archive_age_days,
            "rename_pattern": self.rename_pattern,
            "categories": self.categories
        }
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
