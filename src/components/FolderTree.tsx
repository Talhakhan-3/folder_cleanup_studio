import React, { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { formatBytes } from '../lib/api';

interface TreeNode {
  type: 'directory' | 'file';
  name: string;
  path: string;
  size?: number;
  children?: TreeNode[];
}

interface FolderTreeProps {
  tree: TreeNode;
}

export const FolderTree: React.FC<FolderTreeProps> = ({ tree }) => {
  return (
    <div className="font-mono text-xs bg-[#111111]/80 rounded-xl border border-white/10 p-4 max-h-96 overflow-y-auto">
      <TreeNodeItem node={tree} isRoot={true} defaultExpanded={true} />
    </div>
  );
};

const TreeNodeItem: React.FC<{
  node: TreeNode;
  isRoot?: boolean;
  defaultExpanded?: boolean;
}> = ({ node, isRoot = false, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded || isRoot);

  if (node.type === 'file') {
    return (
      <div className="flex items-center gap-2 py-1 px-2 text-[#a8a29e] hover:text-[#f7f5f2] hover:bg-white/5 rounded transition-colors">
        <FileText className="w-3.5 h-3.5 text-[#ff6b6b]/70 shrink-0" />
        <span className="truncate">{node.name}</span>
        {node.size !== undefined && (
          <span className="ml-auto text-[10px] text-white/40 shrink-0 font-sans">
            {formatBytes(node.size)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="py-0.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left py-1 px-2 hover:bg-white/5 rounded text-[#f7f5f2] font-medium transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-white/50 shrink-0" />
        )}
        {expanded ? (
          <FolderOpen className="w-4 h-4 text-[#ffd93d] shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-[#ffd93d]/80 shrink-0" />
        )}
        <span className="truncate text-white/90">{node.name}</span>
        {node.children && (
          <span className="ml-auto text-[10px] text-white/40 font-sans">
            {node.children.length} {node.children.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </button>

      {expanded && node.children && (
        <div className="pl-4 ml-2 border-l border-white/10 mt-0.5 space-y-0.5">
          {node.children.length === 0 ? (
            <div className="text-[11px] text-white/30 italic py-1 pl-2 font-sans">
              (Empty directory)
            </div>
          ) : (
            node.children.map((child, idx) => (
              <TreeNodeItem key={`${child.path}-${idx}`} node={child} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
