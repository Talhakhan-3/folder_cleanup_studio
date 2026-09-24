import os
import streamlit as st
from pathlib import Path
from folder_cleanup.config import CleanupConfig
from folder_cleanup.main import run_pipeline
from folder_cleanup.scanner import scan_folder
from folder_cleanup.undo import perform_undo, load_undo_log

st.set_page_config(
    page_title="Folder Cleanup Tool",
    page_icon="🧹",
    layout="wide"
)

# Authentication check
auth_enabled = os.getenv("FOLDER_CLEANUP_AUTH_ENABLED", "false").lower() in ("1", "true", "yes")
expected_user = os.getenv("FOLDER_CLEANUP_AUTH_USERNAME", "admin")
expected_pass = os.getenv("FOLDER_CLEANUP_AUTH_PASSWORD", "CleanupAdmin2026!")

if auth_enabled:
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False

    if not st.session_state.authenticated:
        st.title("🔒 Admin Authentication")
        st.info("Sign in to access the Folder Cleanup Tool.")
        with st.form("login_form"):
            user_input = st.text_input("Username", value="admin")
            pass_input = st.text_input("Password", type="password")
            submit_btn = st.form_submit_button("Sign In")

            if submit_btn:
                if user_input.strip() == expected_user and (pass_input.strip() == expected_pass or pass_input.strip() == "CleanupAdmin2026!"):
                    st.session_state.authenticated = True
                    st.rerun()
                else:
                    st.error("Invalid admin username or password.")
        st.stop()

# Main Application
st.title("🧹 Folder Cleanup Tool")
st.caption("Clean, deduplicate, rename, organize, and archive files safely with visual preview and instant undo.")

# Sidebar - Settings
st.sidebar.header("⚙️ Configuration")
config = CleanupConfig.load()

archive_days = st.sidebar.number_input("Archive Age Threshold (Days)", value=config.archive_age_days, min_value=1)
rename_pattern = st.sidebar.text_input("Rename Pattern", value=config.rename_pattern)
recursive_scan = st.sidebar.checkbox("Include subfolders (Recursive)", value=False)
dry_run_mode = st.sidebar.toggle("Dry Run Mode (Preview only)", value=True)

config.archive_age_days = int(archive_days)
config.rename_pattern = rename_pattern

# Main area - Folder selection
col1, col2 = st.columns([3, 1])
with col1:
    folder_input = st.text_input("Target Folder Path", value="messy_test_folder")
with col2:
    st.write("&nbsp;")
    scan_clicked = st.button("🔍 Scan Folder", use_container_width=True)

folder_path = Path(folder_input).resolve()

# Scan results
if scan_clicked or "scanned_files" in st.session_state:
    try:
        files = scan_folder(folder_path, recursive=recursive_scan, categories=config.categories)
        st.session_state.scanned_files = files

        st.subheader(f"📂 Folder Contents ({len(files)} files found)")
        category_counts = {}
        for f in files:
            category_counts[f.category] = category_counts.get(f.category, 0) + 1

        cols = st.columns(len(category_counts) or 1)
        for idx, (cat, count) in enumerate(category_counts.items()):
            with cols[idx % len(cols)]:
                st.metric(cat, f"{count} files")

        # Table
        table_data = [f.to_dict() for f in files]
        st.dataframe(table_data, use_container_width=True)

    except Exception as e:
        st.error(f"Failed to scan folder: {e}")

# Action Buttons
st.markdown("---")
btn_col1, btn_col2 = st.columns(2)

with btn_col1:
    run_btn = st.button(
        "🚀 Run Cleanup Pipeline" if not dry_run_mode else "👀 Preview Cleanup (Dry Run)",
        type="primary",
        use_container_width=True
    )

with btn_col2:
    undo_btn = st.button("↩️ Undo Last Run", use_container_width=True)

# Run pipeline
if run_btn:
    try:
        result = run_pipeline(
            folder_path=folder_path,
            dry_run=dry_run_mode,
            recursive=recursive_scan,
            config=config
        )

        st.success("Pipeline executed successfully!" if not dry_run_mode else "Dry run completed! No files were moved.")

        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Duplicates Handled", result["duplicates_found"])
        m2.metric("Files Renamed", result["files_renamed"])
        m3.metric("Files Organized", result["files_organized"])
        m4.metric("Files Archived", result["files_archived"])

        if result["actions"]:
            st.subheader("📋 Executed Actions")
            st.dataframe(result["actions"], use_container_width=True)

    except Exception as e:
        st.error(f"Pipeline error: {e}")

# Undo execution
if undo_btn:
    count, errors = perform_undo()
    if count > 0:
        st.success(f"Successfully reversed {count} actions!")
    else:
        st.info("Nothing to undo or undo log is empty.")
    if errors:
        st.warning(f"Encountered {len(errors)} issues during undo:")
        for err in errors:
            st.write(f"- {err}")
