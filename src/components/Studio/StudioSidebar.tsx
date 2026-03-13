import { useState, useEffect, useRef } from 'react';
import type { StudioPage } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface PageTreeNodeProps {
  page: StudioPage;
  depth: number;
  pages: StudioPage[];
  activePage: StudioPage | null;
  onSelect: (page: StudioPage) => void;
  onAddChild: (parentId: string) => void;
  onUpdatePage: (id: string, data: Partial<StudioPage>) => void;
  onDeletePage: (id: string) => void;
  onTogglePin: (id: string) => void;
}

function PageTreeNode({
  page,
  depth,
  pages,
  activePage,
  onSelect,
  onAddChild,
  onUpdatePage,
  onDeletePage,
  onTogglePin,
}: PageTreeNodeProps) {
  const children = pages.filter((p) => p.parentId === page.id);
  const [expanded, setExpanded] = useLocalStorage(`studio-sidebar-exp-${page.id}`, true);
  const isActive = activePage?.id === page.id;

  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(page.title);

  const rowRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handler(e: MouseEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== page.title) {
      onUpdatePage(page.id, { title: trimmed });
    }
    setIsRenaming(false);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitRename();
    } else if (e.key === 'Escape') {
      setRenameValue(page.title);
      setIsRenaming(false);
    }
  }

  function handleDelete() {
    setShowMenu(false);
    if (window.confirm(`Delete "${page.title || 'Untitled'}"? This cannot be undone.`)) {
      onDeletePage(page.id);
    }
  }

  function handleRename() {
    setRenameValue(page.title);
    setShowMenu(false);
    setIsRenaming(true);
  }

  function handleAddSubpage() {
    setShowMenu(false);
    onAddChild(page.id);
  }

  function handleTogglePin() {
    setShowMenu(false);
    onTogglePin(page.id);
  }

  return (
    <div>
      <div
        ref={rowRef}
        className={`relative group flex items-center gap-1 rounded-[4px] px-1.5 py-1 cursor-pointer transition-colors ${
          isActive ? 'bg-yellow-400/10 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
        style={{ paddingLeft: `${6 + depth * 14}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-4 h-4 flex items-center justify-center text-xs flex-shrink-0 transition-colors ${
            children.length === 0 ? 'opacity-0 pointer-events-none' : 'opacity-60 hover:opacity-100'
          }`}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <button
          onClick={() => !isRenaming && onSelect(page)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          <span className="text-sm flex-shrink-0">{page.icon}</span>
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="text-sm flex-1 min-w-0 bg-zinc-800 border border-zinc-600 rounded-[3px] px-1 py-0 text-zinc-100 outline-none focus:border-yellow-400"
            />
          ) : (
            <span className={`text-sm truncate ${isActive ? 'font-bold text-zinc-100' : 'font-medium'}`}>
              {page.title || 'Untitled'}
            </span>
          )}
        </button>

        {/* Context menu button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-opacity flex-shrink-0 text-xs leading-none"
          title="Page options"
        >
          ⋯
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-0.5 w-36 bg-zinc-900 border-2 border-zinc-700 rounded-[4px] shadow-[3px_3px_0_0_#18181b] z-50">
            <button
              onClick={handleRename}
              className="w-full text-left px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <span>✏️</span> Rename
            </button>
            <button
              onClick={handleAddSubpage}
              className="w-full text-left px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <span>+</span> Add subpage
            </button>
            <button
              onClick={handleTogglePin}
              className="w-full text-left px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <span>📌</span> {page.isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <span>🗑️</span> Delete
            </button>
          </div>
        )}
      </div>
      {expanded && children.map((child) => (
        <PageTreeNode
          key={child.id}
          page={child}
          depth={depth + 1}
          pages={pages}
          activePage={activePage}
          onSelect={onSelect}
          onAddChild={onAddChild}
          onUpdatePage={onUpdatePage}
          onDeletePage={onDeletePage}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}

interface Props {
  pages: StudioPage[];
  activePage: StudioPage | null;
  onSelect: (page: StudioPage) => void;
  onCreatePage: () => void;
  onCreateSubPage: (parentId: string) => void;
  onOpenGallery: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onUpdatePage: (id: string, data: Partial<StudioPage>) => void;
  onDeletePage: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function StudioSidebar({
  pages,
  activePage,
  onSelect,
  onCreatePage,
  onCreateSubPage,
  onOpenGallery,
  collapsed,
  onToggleCollapse,
  onUpdatePage,
  onDeletePage,
  onTogglePin,
}: Props) {
  const rootPages = pages.filter((p) => !p.parentId);
  const pinnedPages = rootPages.filter((p) => p.isPinned);
  const unpinnedPages = rootPages.filter((p) => !p.isPinned);

  if (collapsed) {
    return (
      <div className="w-10 flex-shrink-0 border-r-2 border-zinc-700 flex flex-col items-center py-2 gap-2">
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Expand sidebar"
        >
          ▸
        </button>
        <button
          onClick={onCreatePage}
          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
          title="New page"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 flex-shrink-0 border-r-2 border-zinc-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Pages</span>
        <button
          onClick={onToggleCollapse}
          className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs"
          title="Collapse sidebar"
        >
          ◂
        </button>
      </div>

      {/* Page tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {pages.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-zinc-600 mb-2">No pages yet</p>
            <button
              onClick={onCreatePage}
              className="text-xs text-yellow-400 hover:text-yellow-300 font-bold"
            >
              + Create your first page
            </button>
          </div>
        ) : (
          <>
            {pinnedPages.length > 0 && (
              <div className="mb-1">
                <div className="px-3 py-0.5">
                  <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Pinned</span>
                </div>
                {pinnedPages.map((page) => (
                  <PageTreeNode
                    key={page.id}
                    page={page}
                    depth={0}
                    pages={pages}
                    activePage={activePage}
                    onSelect={onSelect}
                    onAddChild={onCreateSubPage}
                    onUpdatePage={onUpdatePage}
                    onDeletePage={onDeletePage}
                    onTogglePin={onTogglePin}
                  />
                ))}
              </div>
            )}
            {unpinnedPages.map((page) => (
              <PageTreeNode
                key={page.id}
                page={page}
                depth={0}
                pages={pages}
                activePage={activePage}
                onSelect={onSelect}
                onAddChild={onCreateSubPage}
                onUpdatePage={onUpdatePage}
                onDeletePage={onDeletePage}
                onTogglePin={onTogglePin}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-zinc-800 p-2 flex flex-col gap-1">
        <button
          onClick={onOpenGallery}
          className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-[4px] transition-colors"
        >
          <span>🗂️</span> Templates
        </button>
        <button
          onClick={onCreatePage}
          className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-[4px] transition-colors"
        >
          <span>+</span> New Page
        </button>
      </div>
    </div>
  );
}
