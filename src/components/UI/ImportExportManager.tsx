import { useState, useRef } from 'react';
import type { Client, Priority } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Button } from './Button';
import { Modal } from './Modal';
import {
  exportClientsToCSV,
  exportClientsToExcel,
  exportFullBackup,
  exportCompleteAppBackup,
  parseCSVClients,
  parseBackupFile,
  parseFullAppBackup,
  restoreFullAppBackup,
  filterClientsForExport,
  type ExportFilters,
} from '../../utils/export';
import { exportClientsToPDF } from '../../utils/pdfExport';

export function ImportExportManager() {
  const { clients, templates, tags, importClients, restoreBackup } = useClientContext();
  const [showMenu, setShowMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showFilteredExportModal, setShowFilteredExportModal] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);
  const [restoreResult, setRestoreResult] = useState<{ clientCount: number; templateCount: number } | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('merge');
  const [showCompleteRestoreModal, setShowCompleteRestoreModal] = useState(false);
  const [completeRestoreData, setCompleteRestoreData] = useState<Record<string, unknown> | null>(null);
  const [completeRestoreCount, setCompleteRestoreCount] = useState(0);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const completeBackupInputRef = useRef<HTMLInputElement>(null);

  // Filter state for filtered export
  const [exportFilters, setExportFilters] = useState<ExportFilters>({
    statuses: [],
    priorities: [],
    assignees: [],
    tags: [],
    includeArchived: false,
  });
  const [filteredExportFormat, setFilteredExportFormat] = useState<'csv' | 'excel'>('excel');

  const activeClients = clients.filter((c) => !c.archived);
  const assignees = [...new Set(activeClients.map((c) => c.assignedTo))].sort();

  const handleExportCSV = () => {
    exportClientsToCSV(clients.filter((c) => !c.archived), tags);
    setShowMenu(false);
  };

  const handleExportExcel = () => {
    exportClientsToExcel(clients.filter((c) => !c.archived), tags);
    setShowMenu(false);
  };

  const handleExportPDF = () => {
    exportClientsToPDF(clients.filter((c) => !c.archived), tags);
    setShowMenu(false);
  };

  const handleExportBackup = () => {
    exportFullBackup(clients, templates);
    setShowMenu(false);
  };

  const handleExportCompleteBackup = () => {
    exportCompleteAppBackup();
    setShowMenu(false);
  };

  const handleCompleteBackupFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = parseFullAppBackup(text);

    if (result.success && result.data) {
      setCompleteRestoreData(result.data);
      setCompleteRestoreCount(result.keysRestored);
      setShowCompleteRestoreModal(true);
    } else {
      setImportResult({ count: 0, errors: [result.error || 'Failed to parse backup file'] });
      setShowImportModal(true);
    }

    setShowMenu(false);
    if (completeBackupInputRef.current) completeBackupInputRef.current.value = '';
  };

  const confirmCompleteRestore = () => {
    if (completeRestoreData) {
      restoreFullAppBackup(completeRestoreData);
      setShowCompleteRestoreModal(false);
      setCompleteRestoreData(null);
      // Reload to apply all restored data
      window.location.reload();
    }
  };

  const handleFilteredExport = () => {
    const filteredClients = filterClientsForExport(clients, exportFilters);
    if (filteredExportFormat === 'csv') {
      exportClientsToCSV(filteredClients, tags);
    } else {
      exportClientsToExcel(filteredClients, tags);
    }
    setShowFilteredExportModal(false);
    setShowMenu(false);
  };

  const toggleFilter = <T extends string>(
    key: keyof ExportFilters,
    value: T,
    currentValues: T[] | undefined
  ) => {
    const current = currentValues || [];
    const newValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setExportFilters((prev) => ({ ...prev, [key]: newValues }));
  };

  const filteredCount = filterClientsForExport(clients, exportFilters).length;

  const handleCSVFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = parseCSVClients(text);

    if (result.success && result.clients.length > 0) {
      const count = importClients(result.clients);
      setImportResult({ count, errors: result.errors });
    } else {
      setImportResult({ count: 0, errors: result.errors.length > 0 ? result.errors : ['No valid clients found in CSV'] });
    }

    setShowImportModal(true);
    setShowMenu(false);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const handleBackupFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = parseBackupFile(text);

    if (result.success) {
      setRestoreResult({ clientCount: result.clients.length, templateCount: result.templates.length });
      setShowRestoreModal(true);

      // Store parsed data for later use
      (window as unknown as { _pendingRestore: typeof result })._pendingRestore = result;
    } else {
      setImportResult({ count: 0, errors: [result.error || 'Failed to parse backup file'] });
      setShowImportModal(true);
    }

    setShowMenu(false);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const confirmRestore = () => {
    const pending = (window as unknown as { _pendingRestore: ReturnType<typeof parseBackupFile> })._pendingRestore;
    if (pending && pending.success) {
      const count = restoreBackup(pending.clients, restoreMode === 'merge');
      setImportResult({ count, errors: [] });
      setShowRestoreModal(false);
      setShowImportModal(true);
      delete (window as unknown as { _pendingRestore?: ReturnType<typeof parseBackupFile> })._pendingRestore;
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Import / Export"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <div className="p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 font-semibold uppercase">
                  Export
                </p>
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export to CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Export to Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export to PDF
                </button>
                <button
                  onClick={() => {
                    setShowFilteredExportModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtered Export...
                </button>
                <button
                  onClick={handleExportBackup}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Client Backup (JSON)
                </button>
                <button
                  onClick={handleExportCompleteBackup}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Complete App Backup
                </button>

                <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

                <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 font-semibold uppercase">
                  Import
                </p>
                <label className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2 cursor-pointer">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Import from CSV
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileSelect}
                    className="hidden"
                  />
                </label>
                <label className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2 cursor-pointer">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Restore Client Backup
                  <input
                    ref={jsonInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleBackupFileSelect}
                    className="hidden"
                  />
                </label>
                <label className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2 cursor-pointer">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restore Complete Backup
                  <input
                    ref={completeBackupInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleCompleteBackupFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Import Result Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Complete">
        <div className="space-y-4">
          {importResult && importResult.count > 0 ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Successfully imported {importResult.count} client{importResult.count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">Import failed</p>
              </div>
            </div>
          )}

          {importResult && importResult.errors.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setShowImportModal(false)}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)} title="Restore Backup">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This backup contains:
            </p>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <li>• {restoreResult?.clientCount || 0} clients</li>
              <li>• {restoreResult?.templateCount || 0} templates</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Restore mode:</p>
            <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="restoreMode"
                value="merge"
                checked={restoreMode === 'merge'}
                onChange={() => setRestoreMode('merge')}
                className="text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Merge</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add new clients, keep existing ones</p>
              </div>
            </label>
            <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="restoreMode"
                value="replace"
                checked={restoreMode === 'replace'}
                onChange={() => setRestoreMode('replace')}
                className="text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Replace</p>
                <p className="text-sm text-red-500 dark:text-red-400">Replace all existing data</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>Cancel</Button>
            <Button onClick={confirmRestore}>Restore</Button>
          </div>
        </div>
      </Modal>

      {/* Filtered Export Modal */}
      <Modal
        isOpen={showFilteredExportModal}
        onClose={() => setShowFilteredExportModal(false)}
        title="Filtered Export"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select filters to export specific clients. Leave filters empty to include all.
          </p>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(['active', 'completed', 'on-hold'] as Client['status'][]).map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    toggleFilter('statuses', status, exportFilters.statuses)
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    exportFilters.statuses?.includes(status)
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {(['high', 'medium', 'low', 'none'] as Priority[]).map((priority) => (
                <button
                  key={priority}
                  onClick={() =>
                    toggleFilter('priorities', priority, exportFilters.priorities)
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    exportFilters.priorities?.includes(priority)
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee Filter */}
          {assignees.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned To
              </label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {assignees.map((assignee) => (
                  <button
                    key={assignee}
                    onClick={() =>
                      toggleFilter('assignees', assignee, exportFilters.assignees)
                    }
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      exportFilters.assignees?.includes(assignee)
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {assignee}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleFilter('tags', tag.id, exportFilters.tags)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      exportFilters.tags?.includes(tag.id)
                        ? 'text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={
                      exportFilters.tags?.includes(tag.id)
                        ? { backgroundColor: tag.color }
                        : undefined
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Include Archived */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exportFilters.includeArchived}
              onChange={(e) =>
                setExportFilters((prev) => ({ ...prev, includeArchived: e.target.checked }))
              }
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Include archived clients
            </span>
          </label>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilteredExportFormat('excel')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filteredExportFormat === 'excel'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => setFilteredExportFormat('csv')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filteredExportFormat === 'csv'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                CSV
              </button>
            </div>
          </div>

          {/* Preview count */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">{filteredCount}</span>{' '}
              client{filteredCount !== 1 ? 's' : ''} will be exported
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowFilteredExportModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleFilteredExport} disabled={filteredCount === 0}>
              Export {filteredCount} Client{filteredCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Complete Restore Confirmation Modal */}
      <Modal
        isOpen={showCompleteRestoreModal}
        onClose={() => {
          setShowCompleteRestoreModal(false);
          setCompleteRestoreData(null);
        }}
        title="Restore Complete Backup"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  This will replace ALL app data
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Including clients, templates, planner data, time blocks, daily entries, settings, and more.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This backup contains <span className="font-semibold">{completeRestoreCount}</span> data categories.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              The page will reload after restore to apply all changes.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCompleteRestoreModal(false);
                setCompleteRestoreData(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCompleteRestore}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              Restore Everything
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
