import { useState, type KeyboardEvent } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Client, ChecklistItem as ChecklistItemType, ChecklistTemplate, RecurrencePattern, OnboardingPhase } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { SortableChecklistItem } from './SortableChecklistItem';
import { TaskSuggestionsModal } from './TaskSuggestionsModal';
import { PhaseFilter } from '../Phases/PhaseFilter';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

type OwnerFilter = 'all' | 'internal' | 'client';

interface ChecklistProps {
  clientId: string;
  client?: Client;
  items: ChecklistItemType[];
  phases?: OnboardingPhase[];
  onClientFilterClick?: () => void;
}

export function Checklist({ clientId, client, items, phases, onClientFilterClick }: ChecklistProps) {
  const { addChecklistItem, addChecklistItemWithData, reorderChecklist, templates, applyTemplate } = useClientContext();
  const [newItem, setNewItem] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newItemRecurrence, setNewItemRecurrence] = useState<RecurrencePattern | ''>('');
  const [newItemRecurrenceEnd, setNewItemRecurrenceEnd] = useState('');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedItems = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const completedCount = items.filter((item) => item.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  const blockedCount = items.filter((item) => item.isBlocked && !item.completed).length;
  const clientPendingCount = items.filter((item) => item.ownerType === 'client' && !item.completed).length;

  const filteredItems = sortedItems.filter((item) => {
    if (selectedPhaseId && item.phaseId !== selectedPhaseId) return false;
    if (ownerFilter === 'internal' && item.ownerType === 'client') return false;
    if (ownerFilter === 'client' && item.ownerType !== 'client') return false;
    if (showBlockedOnly && !item.isBlocked) return false;
    return true;
  });

  const handleAdd = () => {
    if (newItem.trim()) {
      if (newItemRecurrence && !newDueDate) {
        // A due date is required for recurring tasks — the next-occurrence calculation needs an anchor
        return;
      }
      if (newItemRecurrence) {
        addChecklistItemWithData(clientId, {
          title: newItem.trim(),
          completed: false,
          dueDate: newDueDate || undefined,
          startDate: newStartDate || undefined,
          recurrence: newItemRecurrence,
          recurrenceEndDate: newItemRecurrenceEnd || undefined,
        });
      } else {
        addChecklistItem(clientId, newItem.trim(), newDueDate || undefined, newStartDate || undefined);
      }
      setNewItem('');
      setNewStartDate('');
      setNewDueDate('');
      setNewItemRecurrence('');
      setNewItemRecurrenceEnd('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedItems.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(sortedItems, oldIndex, newIndex);
      reorderChecklist(clientId, newOrder);
    }
  };

  const handleApplyTemplate = (template: ChecklistTemplate) => {
    applyTemplate(clientId, template);
    setShowTemplateMenu(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-semibold gradient-text">
            Onboarding Checklist
          </h3>
          {blockedCount > 0 && (
            <button
              onClick={() => setShowBlockedOnly(!showBlockedOnly)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all ${
                showBlockedOnly
                  ? 'bg-red-500 text-white'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60'
              }`}
              title={showBlockedOnly ? 'Show all tasks' : 'Show blocked tasks only'}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {blockedCount} blocked
            </button>
          )}
          {clientPendingCount > 0 && (
            <button
              onClick={() => {
                setOwnerFilter(ownerFilter === 'client' ? 'all' : 'client');
                onClientFilterClick?.();
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all ${
                ownerFilter === 'client'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/60'
              }`}
              title="Toggle client tasks filter"
            >
              {clientPendingCount} client item{clientPendingCount !== 1 ? 's' : ''} pending
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {completedCount}/{items.length} completed
            </span>
          )}
          {client && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTaskSuggestions(true)}
              title="Get AI task suggestions"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Suggest
            </Button>
          )}
          {templates.length > 0 && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Template
              </Button>
              {showTemplateMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowTemplateMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 glass-strong rounded-xl shadow-lg z-20">
                    <div className="p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                        Apply template to add tasks
                      </p>
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleApplyTemplate(template)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg"
                        >
                          {template.name}
                          <span className="text-xs text-gray-400 ml-2">
                            ({template.items.length} items)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-4 w-full bg-white/30 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 to-green-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Start:</span>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="px-2 py-2 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">End:</span>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="px-2 py-2 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
              />
            </div>
            <Button onClick={handleAdd} disabled={!newItem.trim()}>
              Add
            </Button>
          </div>
        </div>
        {/* Repeats */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Repeats</label>
          <select
            value={newItemRecurrence}
            onChange={e => setNewItemRecurrence(e.target.value as RecurrencePattern | '')}
            className="flex-1 text-xs border border-white/20 dark:border-white/10 rounded-lg px-2 py-1 bg-white/50 dark:bg-white/5 text-gray-700 dark:text-gray-300"
          >
            <option value="">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {newItemRecurrence && (
            <input
              type="date"
              value={newItemRecurrenceEnd}
              onChange={e => setNewItemRecurrenceEnd(e.target.value)}
              className="text-xs border border-white/20 dark:border-white/10 rounded-lg px-2 py-1 bg-white/50 dark:bg-white/5 text-gray-700 dark:text-gray-300"
              title="Repeat until (optional)"
            />
          )}
        </div>
        {newItemRecurrence && !newDueDate && (
          <p className="text-xs text-amber-500">A due date is required for recurring tasks</p>
        )}
      </div>

      {/* Phase + Owner filter row */}
      {(phases && phases.length > 0) && (
        <PhaseFilter
          phases={phases}
          selectedPhaseId={selectedPhaseId}
          onSelect={setSelectedPhaseId}
        />
      )}
      {items.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {(['all', 'internal', 'client'] as OwnerFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setOwnerFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                ownerFilter === f
                  ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'all' ? 'All' : f === 'internal' ? 'My Team' : 'Client'}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
          No tasks yet. Add your first onboarding task above.
        </p>
      ) : filteredItems.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
          No tasks match the current filter.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {filteredItems.map((item) => {
                // Determine if item is locked due to phase gate
                const isLocked = (() => {
                  if (!item.phaseId || !phases || phases.length === 0) return false;
                  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);
                  const phaseIdx = sortedPhases.findIndex(p => p.id === item.phaseId);
                  if (phaseIdx <= 0) return false;
                  const priorIncomplete = sortedPhases.slice(0, phaseIdx).some(p => !p.completedAt);
                  return priorIncomplete;
                })();
                return (
                  <SortableChecklistItem
                    key={item.id}
                    clientId={clientId}
                    item={item}
                    allItems={sortedItems}
                    phases={phases}
                    isLocked={isLocked}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {showTaskSuggestions && client && (
        <TaskSuggestionsModal
          client={client}
          onClose={() => setShowTaskSuggestions(false)}
        />
      )}
    </div>
  );
}
