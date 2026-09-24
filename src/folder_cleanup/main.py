import argparse
import sys
from pathlib import Path
from .archiver import archive_old_files
from .config import CleanupConfig
from .deduplicator import deduplicate_files
from .logger import logger
from .organizer import organize_files
from .renamer import rename_files
from .scanner import scan_folder
from .undo import perform_undo, save_undo_log

def run_pipeline(
    folder_path: Path,
    dry_run: bool = True,
    recursive: bool = False,
    config: CleanupConfig = None
) -> dict:
    """
    Orchestrates the cleanup pipeline in order:
    1. Scan files
    2. Deduplicate files (by SHA-256)
    3. Rename files (using rename_pattern)
    4. Organize files (into category subfolders)
    5. Archive older files (into Archive/<year>)
    """
    if config is None:
        config = CleanupConfig.load()

    folder_path = folder_path.resolve()
    logger.info(f"Starting cleanup pipeline on {folder_path} (dry_run={dry_run})")

    # Step 1: Scan
    scanned_files = scan_folder(folder_path, recursive=recursive, categories=config.categories)
    active_paths = [f.path for f in scanned_files]

    total_files_before = len(active_paths)
    all_actions = []

    # Step 2: Deduplication
    dedupe_actions, duplicates_found = deduplicate_files(
        folder_path=folder_path,
        file_paths=active_paths,
        dry_run=dry_run
    )
    all_actions.extend(dedupe_actions)

    # Re-scan remaining files in primary location
    scanned_after_dedupe = scan_folder(folder_path, recursive=recursive, categories=config.categories)
    active_paths = [
        f.path for f in scanned_after_dedupe
        if "review_duplicates" not in f.path.parts and "Archive" not in f.path.parts
    ]

    # Step 3: Renaming
    rename_actions, files_renamed = rename_files(
        file_paths=active_paths,
        pattern=config.rename_pattern,
        dry_run=dry_run
    )
    all_actions.extend(rename_actions)

    # Re-scan for organization
    scanned_after_rename = scan_folder(folder_path, recursive=recursive, categories=config.categories)
    active_paths = [
        f.path for f in scanned_after_rename
        if "review_duplicates" not in f.path.parts and "Archive" not in f.path.parts
    ]

    # Step 4: Organization
    organize_actions, files_organized = organize_files(
        folder_path=folder_path,
        file_paths=active_paths,
        categories=config.categories,
        dry_run=dry_run
    )
    all_actions.extend(organize_actions)

    # Re-scan for archiving
    scanned_after_organize = scan_folder(folder_path, recursive=True, categories=config.categories)
    active_paths = [
        f.path for f in scanned_after_organize
        if "review_duplicates" not in f.path.parts and "Archive" not in f.path.parts
    ]

    # Step 5: Archiving
    archive_actions, files_archived = archive_old_files(
        folder_path=folder_path,
        file_paths=active_paths,
        archive_age_days=config.archive_age_days,
        dry_run=dry_run
    )
    all_actions.extend(archive_actions)

    # Save to undo log if real execution
    if not dry_run and all_actions:
        save_undo_log(all_actions)
        logger.info(f"Saved {len(all_actions)} actions to undo log.")

    return {
        "folder": str(folder_path),
        "dry_run": dry_run,
        "total_files_before": total_files_before,
        "duplicates_found": duplicates_found,
        "files_renamed": files_renamed,
        "files_organized": files_organized,
        "files_archived": files_archived,
        "actions_count": len(all_actions),
        "actions": all_actions
    }

def main():
    parser = argparse.ArgumentParser(description="Clean up messy folders safely.")
    parser.add_argument("folder", nargs="?", default="messy_test_folder", help="Folder path to clean")
    parser.add_argument("--dry-run", dest="dry_run", action="store_true", default=True, help="Preview actions without moving files (default)")
    parser.add_argument("--real", dest="dry_run", action="store_false", help="Actually move, rename, and organize files")
    parser.add_argument("--recursive", "-r", action="store_true", help="Process subfolders recursively")
    parser.add_argument("--undo", action="store_true", help="Reverse the last real run")
    parser.add_argument("--config", default="config.json", help="Path to custom config.json")

    args = parser.parse_args()

    if args.undo:
        count, errors = perform_undo()
        print(f"Undo completed: {count} actions reversed.")
        if errors:
            print("Errors:")
            for err in errors:
                print(f"  - {err}")
        return

    folder = Path(args.folder)
    if not folder.exists():
        print(f"Error: Folder '{folder}' does not exist.")
        sys.exit(1)

    cfg = CleanupConfig.load(args.config)
    result = run_pipeline(folder, dry_run=args.dry_run, recursive=args.recursive, config=cfg)

    mode_str = "DRY RUN (Preview)" if result["dry_run"] else "REAL EXECUTION"
    print("\n" + "=" * 50)
    print(f"  CLEANUP SUMMARY ({mode_str})")
    print("=" * 50)
    print(f"Target folder:       {result['folder']}")
    print(f"Total files scanned: {result['total_files_before']}")
    print(f"Duplicates moved:    {result['duplicates_found']}")
    print(f"Files renamed:       {result['files_renamed']}")
    print(f"Files organized:     {result['files_organized']}")
    print(f"Files archived:      {result['files_archived']}")
    print(f"Total actions logged:{result['actions_count']}")
    print("=" * 50)

if __name__ == "__main__":
    main()
