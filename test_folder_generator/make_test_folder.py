import os
import time
from pathlib import Path

def make_test_folder(target_dir: str = "messy_test_folder") -> Path:
    folder = Path(target_dir).resolve()
    folder.mkdir(parents=True, exist_ok=True)

    def write_sample_file(name: str, content: str, days_old: int = 0):
        file_path = folder / name
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        if days_old > 0:
            past_time = time.time() - (days_old * 86400)
            os.utime(file_path, (past_time, past_time))
        return file_path

    print(f"Generating test folder at: {folder}")

    # Mixed media & document types
    write_sample_file("notes.txt", "These are some notes.")
    write_sample_file("photo1.jpg", "fake image data 1")
    write_sample_file("photo2.png", "fake image data 2")
    write_sample_file("budget.xlsx", "fake spreadsheet data")
    write_sample_file("presentation.pptx", "fake slides data")
    write_sample_file("song.mp3", "fake audio data")
    write_sample_file("script.py", 'print("hello world")')

    # Duplicates with identical contents
    write_sample_file("report_final.docx", "This is the final report content.")
    write_sample_file("report_final_copy.docx", "This is the final report content.")
    write_sample_file("report_final_v2.docx", "This is the final report content.")

    write_sample_file("vacation.jpg", "beach photo bytes")
    write_sample_file("vacation_copy.jpg", "beach photo bytes")

    # Special / unusual filenames
    write_sample_file("résumé_final (1).pdf", "fake resume content")
    write_sample_file("file with spaces.txt", "spaced out file")
    write_sample_file("日本語ファイル.txt", "japanese filename test")
    write_sample_file("no_extension_file", "a file with no extension")

    # Archived / older files
    write_sample_file("old_backup.zip", "old zip content", days_old=400)
    write_sample_file("old_notes.txt", "old notes from a while back", days_old=250)

    print("Test folder generated successfully!")
    return folder

if __name__ == "__main__":
    make_test_folder()
