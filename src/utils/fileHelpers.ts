// Maximum file size for base64 storage (1MB)
export const MAX_BASE64_SIZE = 1024 * 1024;

// Maximum total storage size warning threshold (4MB)
export const STORAGE_WARNING_SIZE = 4 * 1024 * 1024;

/**
 * Convert a file to base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Get icon type based on file MIME type or extension
 */
export function getFileIconType(
  type: string,
  filename: string
): 'image' | 'document' | 'spreadsheet' | 'pdf' | 'archive' | 'code' | 'video' | 'audio' | 'other' {
  const ext = getFileExtension(filename);

  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';

  // Document types
  if (
    type.includes('word') ||
    type.includes('document') ||
    ['doc', 'docx', 'rtf', 'odt', 'txt'].includes(ext)
  ) {
    return 'document';
  }

  // Spreadsheet types
  if (
    type.includes('spreadsheet') ||
    type.includes('excel') ||
    ['xls', 'xlsx', 'csv', 'ods'].includes(ext)
  ) {
    return 'spreadsheet';
  }

  // Archive types
  if (type.includes('zip') || type.includes('archive') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'archive';
  }

  // Code types
  if (
    type.includes('javascript') ||
    type.includes('json') ||
    type.includes('html') ||
    type.includes('css') ||
    ['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h'].includes(ext)
  ) {
    return 'code';
  }

  return 'other';
}

/**
 * Check if a file type is allowed
 */
export function isAllowedFileType(type: string, filename: string): boolean {
  const ext = getFileExtension(filename);

  // Block potentially dangerous file types
  const blockedExtensions = ['exe', 'bat', 'cmd', 'msi', 'dll', 'scr', 'vbs', 'js', 'jar'];
  if (blockedExtensions.includes(ext)) return false;

  // Block if no type and suspicious extension
  if (!type && blockedExtensions.includes(ext)) return false;

  return true;
}

/**
 * Estimate current localStorage usage
 */
export function getStorageUsage(): number {
  let total = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
    }
  }
  return total;
}

/**
 * Check if storage is near capacity
 */
export function isStorageNearCapacity(): boolean {
  return getStorageUsage() > STORAGE_WARNING_SIZE;
}

/**
 * Download a file from data URL
 */
export function downloadFromDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Open a URL in a new tab
 */
export function openExternalUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
