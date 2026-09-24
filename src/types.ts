export interface FileInfo {
  name: string;
  name_only: string;
  extension: string;
  path: string;
  size_bytes: number;
  modified_date: string;
  created_date: string;
  category: string;
}

export interface Config {
  dry_run: boolean;
  archive_age_days: number;
  rename_pattern: string;
  categories: Record<string, string[]>;
}

export interface DuplicateGroup {
  hash: string;
  paths: string[];
}

export interface PipelineSummary {
  files_scanned: number;
  duplicates_found: number;
  files_renamed: number;
  files_organized: number;
  files_archived: number;
  total_size_before_bytes: number;
  dry_run: boolean;
}

export interface UndoAction {
  action: 'move' | 'rename';
  old_path: string;
  new_path: string;
}

export interface PipelineProgressEvent {
  stepIndex: number;
  stepName: string;
  message: string;
  percent: number;
}
