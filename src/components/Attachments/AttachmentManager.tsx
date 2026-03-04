import { useState, useRef, type ReactNode } from 'react';
import type { FileAttachment } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';
import {
  MAX_BASE64_SIZE,
  fileToDataUrl,
  formatFileSize,
  getFileIconType,
  isAllowedFileType,
  downloadFromDataUrl,
  openExternalUrl,
  isStorageNearCapacity,
} from '../../utils/fileHelpers';

interface AttachmentManagerProps {
  clientId: string;
  attachments?: FileAttachment[];
}

const fileIcons: Record<ReturnType<typeof getFileIconType>, ReactNode> = {
  image: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  spreadsheet: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  pdf: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  archive: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  code: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  video: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  audio: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

const iconColors: Record<ReturnType<typeof getFileIconType>, string> = {
  image: 'from-pink-400 to-rose-500',
  document: 'from-blue-400 to-indigo-500',
  spreadsheet: 'from-emerald-400 to-green-500',
  pdf: 'from-red-400 to-rose-500',
  archive: 'from-amber-400 to-orange-500',
  code: 'from-violet-400 to-purple-500',
  video: 'from-cyan-400 to-blue-500',
  audio: 'from-fuchsia-400 to-pink-500',
  other: 'from-gray-400 to-slate-500',
};

export function AttachmentManager({ clientId, attachments = [] }: AttachmentManagerProps) {
  const { addAttachment, removeAttachment } = useClientContext();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [externalName, setExternalName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    for (const file of Array.from(files)) {
      // Validate file type
      if (!isAllowedFileType(file.type, file.name)) {
        setError(`File type not allowed: ${file.name}`);
        continue;
      }

      // Check storage capacity
      if (file.size < MAX_BASE64_SIZE && isStorageNearCapacity()) {
        setError('Storage is nearly full. Consider using external URLs for large files.');
      }

      try {
        if (file.size <= MAX_BASE64_SIZE) {
          // Store as base64
          const dataUrl = await fileToDataUrl(file);
          addAttachment(clientId, {
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl,
          });
        } else {
          // File too large - prompt for external URL
          setError(
            `${file.name} is too large for local storage. Please use "Add Link" to reference external files.`
          );
        }
      } catch {
        setError(`Failed to process ${file.name}`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDownload = (attachment: FileAttachment) => {
    if (attachment.dataUrl) {
      downloadFromDataUrl(attachment.dataUrl, attachment.name);
    } else if (attachment.externalUrl) {
      openExternalUrl(attachment.externalUrl);
    }
  };

  const handleAddExternalUrl = () => {
    if (!externalUrl.trim() || !externalName.trim()) return;

    addAttachment(clientId, {
      name: externalName.trim(),
      size: 0,
      type: 'external/link',
      externalUrl: externalUrl.trim(),
    });

    setExternalUrl('');
    setExternalName('');
    setShowUrlInput(false);
  };

  const handleDelete = (id: string) => {
    removeAttachment(clientId, id);
    setShowDeleteConfirm(null);
  };

  const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold gradient-text">Attachments</h3>
          {attachments.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
              {totalSize > 0 && ` · ${formatFileSize(totalSize)}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUrlInput(true)}
            className="p-2 text-gray-400 hover:text-purple-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
            title="Add external link"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-purple-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
            title="Upload file"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-white/30 dark:border-white/10 hover:border-purple-400/50 hover:bg-white/30 dark:hover:bg-white/5'
        }`}
      >
        <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center mb-2">
          <svg
            className="h-5 w-5 text-violet-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isDragging ? 'Drop files here' : 'Drag files here or click to upload'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max 1MB per file for local storage</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* File list */}
      {attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          {attachments.map((attachment) => {
            const iconType = getFileIconType(attachment.type, attachment.name);
            return (
              <div
                key={attachment.id}
                className="group flex items-center gap-3 p-3 glass-subtle rounded-xl hover:bg-white/60 dark:hover:bg-white/15 transition-all"
              >
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${iconColors[iconType]} shadow-lg flex-shrink-0`}
                >
                  <div className="text-white">{fileIcons[iconType]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {attachment.externalUrl ? 'External link' : formatFileSize(attachment.size)}
                    {' · '}
                    {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="p-1.5 text-gray-400 hover:text-purple-500 rounded-lg hover:bg-white/50 dark:hover:bg-white/10"
                    title={attachment.externalUrl ? 'Open link' : 'Download'}
                  >
                    {attachment.externalUrl ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(attachment.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white/50 dark:hover:bg-white/10"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* External URL input modal */}
      {showUrlInput && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowUrlInput(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-md w-full border border-white/30 dark:border-white/10">
              <h3 className="text-lg font-semibold gradient-text mb-4">Add External Link</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    placeholder="e.g., Contract.pdf"
                    className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setShowUrlInput(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddExternalUrl}
                    disabled={!externalUrl.trim() || !externalName.trim()}
                  >
                    Add Link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-white/30 dark:border-white/10">
              <h3 className="text-lg font-semibold gradient-text mb-2">Delete Attachment?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this file?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
