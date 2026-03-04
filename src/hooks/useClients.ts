import { useCallback } from 'react';
import type { Client, ClientFormData, Service, ChecklistItem, ChecklistTemplate, Priority, ActivityLogEntry, Subtask, Comment, Milestone, CommunicationLogEntry, FileAttachment, TaskGroup, ClientNote, ClientContact, LifecycleStage, AccountInfo, OnboardingPhase } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';

function createLogEntry(type: ActivityLogEntry['type'], description: string, metadata?: Record<string, string>): ActivityLogEntry {
  return {
    id: generateId(),
    type,
    description,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

function createDefaultTaskGroups(): TaskGroup[] {
  return [
    { id: generateId(), name: 'To Do', order: 0, color: '#6366f1', isDefault: true },
    { id: generateId(), name: 'In Progress', order: 1, color: '#f59e0b', isDefault: false },
    { id: generateId(), name: 'Done', order: 2, color: '#10b981', isDefault: false },
  ];
}

export function useClients() {
  const [clients, setClients] = useLocalStorage<Client[]>('onboarding-clients', []);

  const addClient = useCallback((data: ClientFormData): Client => {
    const defaultGroups = createDefaultTaskGroups();
    const newClient: Client = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      services: [],
      checklist: [],
      notes: '',
      priority: data.priority || 'none',
      tags: [],
      activityLog: [createLogEntry('created', 'Client created')],
      taskGroups: defaultGroups,
    };
    setClients((prev) => [...prev, newClient]);
    return newClient;
  }, [setClients]);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id ? { ...client, ...data } : client
      )
    );
  }, [setClients]);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
  }, [setClients]);

  const archiveClient = useCallback((id: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== id) return client;
        const logEntry = createLogEntry('archived', 'Client archived');
        return {
          ...client,
          archived: true,
          archivedAt: new Date().toISOString(),
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const restoreClient = useCallback((id: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== id) return client;
        const logEntry = createLogEntry('restored', 'Client restored from archive');
        return {
          ...client,
          archived: false,
          archivedAt: undefined,
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const duplicateClient = useCallback((id: string): Client | null => {
    const sourceClient = clients.find((c) => c.id === id);
    if (!sourceClient) return null;

    const newClient: Client = {
      ...sourceClient,
      id: generateId(),
      name: `${sourceClient.name} (Copy)`,
      createdAt: new Date().toISOString(),
      status: 'active',
      archived: false,
      archivedAt: undefined,
      checklist: sourceClient.checklist.map((item) => ({
        ...item,
        id: generateId(),
        completed: false,
      })),
      services: sourceClient.services.map((service) => ({
        ...service,
        id: generateId(),
      })),
      activityLog: [createLogEntry('duplicated', `Duplicated from "${sourceClient.name}"`)],
    };
    setClients((prev) => [...prev, newClient]);
    return newClient;
  }, [clients, setClients]);

  const updateStatus = useCallback((clientId: string, status: Client['status']) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const logEntry = createLogEntry('status_changed', `Status changed to ${status}`, { oldStatus: client.status, newStatus: status });
        return {
          ...client,
          status,
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const updatePriority = useCallback((clientId: string, priority: Priority) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const logEntry = createLogEntry('priority_changed', `Priority changed to ${priority}`, { oldPriority: client.priority, newPriority: priority });
        return {
          ...client,
          priority,
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const addTag = useCallback((clientId: string, tagId: string, tagName: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId || client.tags.includes(tagId)) return client;
        const logEntry = createLogEntry('tag_added', `Tag "${tagName}" added`);
        return {
          ...client,
          tags: [...client.tags, tagId],
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const removeTag = useCallback((clientId: string, tagId: string, tagName: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const logEntry = createLogEntry('tag_removed', `Tag "${tagName}" removed`);
        return {
          ...client,
          tags: client.tags.filter((t) => t !== tagId),
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const addService = useCallback((clientId: string, serviceName: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const newService: Service = {
          id: generateId(),
          name: serviceName,
          order: client.services.length,
        };
        return { ...client, services: [...client.services, newService] };
      })
    );
  }, [setClients]);

  const updateService = useCallback((clientId: string, serviceId: string, name: string) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? {
              ...client,
              services: client.services.map((s) =>
                s.id === serviceId ? { ...s, name } : s
              ),
            }
          : client
      )
    );
  }, [setClients]);

  const removeService = useCallback((clientId: string, serviceId: string) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, services: client.services.filter((s) => s.id !== serviceId) }
          : client
      )
    );
  }, [setClients]);

  const reorderServices = useCallback((clientId: string, services: Service[]) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, services: services.map((s, i) => ({ ...s, order: i })) }
          : client
      )
    );
  }, [setClients]);

  const addChecklistItem = useCallback((clientId: string, title: string, dueDate?: string, startDate?: string, groupId?: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        // If no groupId specified, use the default group (first/isDefault group)
        const defaultGroup = client.taskGroups?.find((g) => g.isDefault) || client.taskGroups?.[0];
        const newItem: ChecklistItem = {
          id: generateId(),
          title,
          completed: false,
          dueDate,
          startDate,
          order: client.checklist.length,
          groupId: groupId ?? defaultGroup?.id,
        };
        const logEntry = createLogEntry('task_added', `Task "${title}" added`);
        return {
          ...client,
          checklist: [...client.checklist, newItem],
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const addChecklistItemWithData = useCallback((clientId: string, data: Omit<ChecklistItem, 'id' | 'order'>) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const defaultGroup = client.taskGroups?.find((g) => g.isDefault) || client.taskGroups?.[0];
        const newItem: ChecklistItem = {
          ...data,
          id: generateId(),
          order: client.checklist.length,
          groupId: data.groupId ?? defaultGroup?.id,
        };
        const logEntry = createLogEntry('task_added', `Task "${data.title}" added`);
        return {
          ...client,
          checklist: [...client.checklist, newItem],
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const updateChecklistItem = useCallback((clientId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? {
              ...client,
              checklist: client.checklist.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : client
      )
    );
  }, [setClients]);

  const toggleChecklistItem = useCallback((clientId: string, itemId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const item = client.checklist.find((i) => i.id === itemId);
        if (!item) return client;
        const newCompleted = !item.completed;
        const logEntry = newCompleted
          ? createLogEntry('task_completed', `Task "${item.title}" completed`)
          : createLogEntry('task_completed', `Task "${item.title}" marked incomplete`);

        // Find the "Done" and "To Do" groups for auto-moving tasks
        const doneGroup = client.taskGroups?.find((g) => g.name.toLowerCase() === 'done');
        const todoGroup = client.taskGroups?.find((g) => g.isDefault) || client.taskGroups?.[0];

        // Determine the new groupId based on completion status
        let newGroupId = item.groupId;
        if (newCompleted && doneGroup) {
          // Move to Done when completing
          newGroupId = doneGroup.id;
        } else if (!newCompleted && todoGroup) {
          // Move back to To Do when uncompleting
          newGroupId = todoGroup.id;
        }

        let updatedChecklist = client.checklist.map((i) =>
          i.id === itemId ? { ...i, completed: newCompleted, groupId: newGroupId } : i
        );

        // Un-complete of recurring task: remove auto-created next occurrence
        if (!newCompleted && item.recurrence) {
          const orphan = updatedChecklist.find(
            (t) =>
              t.id !== itemId &&
              t.title === item.title &&
              !t.completed &&
              t.recurrence === item.recurrence
          );
          if (orphan) {
            updatedChecklist = updatedChecklist.filter((t) => t.id !== orphan.id);
          }
        }

        // Handle recurring tasks - create next occurrence when completed
        if (newCompleted && item.recurrence && item.dueDate) {
          const currentDueDate = new Date(item.dueDate);
          let nextDueDate: Date;

          switch (item.recurrence) {
            case 'daily':
              nextDueDate = new Date(currentDueDate.getTime() + 24 * 60 * 60 * 1000);
              break;
            case 'weekly':
              nextDueDate = new Date(currentDueDate.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
            case 'biweekly':
              nextDueDate = new Date(currentDueDate.getTime() + 14 * 24 * 60 * 60 * 1000);
              break;
            case 'monthly': {
              nextDueDate = new Date(currentDueDate);
              const targetMonth = nextDueDate.getMonth() + 1;
              nextDueDate.setDate(1); // reset to 1st to avoid overflow
              nextDueDate.setMonth(targetMonth);
              // clamp to last day of the new month
              const lastDay = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 0).getDate();
              nextDueDate.setDate(Math.min(currentDueDate.getDate(), lastDay));
              break;
            }
            default:
              nextDueDate = currentDueDate;
          }

          // Check if next occurrence is within recurrence end date
          const shouldCreateNext = !item.recurrenceEndDate || nextDueDate <= new Date(item.recurrenceEndDate);

          if (shouldCreateNext) {
            const maxOrder = Math.max(...client.checklist.map((i) => i.order ?? 0), 0);
            const defaultGroup = client.taskGroups?.find((g) => g.isDefault) ?? client.taskGroups?.[0];
            const newTask: ChecklistItem = {
              id: generateId(),
              title: item.title,
              completed: false,
              dueDate: nextDueDate.toISOString().split('T')[0],
              order: maxOrder + 1,
              groupId: defaultGroup?.id,
              recurrence: item.recurrence,
              recurrenceEndDate: item.recurrenceEndDate,
              dependsOn: undefined, // New occurrence doesn't inherit dependencies
            };
            updatedChecklist = [...updatedChecklist, newTask];
          }
        }

        return {
          ...client,
          checklist: updatedChecklist,
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const removeChecklistItem = useCallback((clientId: string, itemId: string) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, checklist: client.checklist.filter((item) => item.id !== itemId) }
          : client
      )
    );
  }, [setClients]);

  // Subtask operations
  const addSubtask = useCallback((clientId: string, itemId: string, title: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          checklist: client.checklist.map((item) => {
            if (item.id !== itemId) return item;
            const newSubtask: Subtask = {
              id: generateId(),
              title,
              completed: false,
            };
            return {
              ...item,
              subtasks: [...(item.subtasks || []), newSubtask],
            };
          }),
        };
      })
    );
  }, [setClients]);

  const updateSubtask = useCallback((clientId: string, itemId: string, subtaskId: string, updates: Partial<Subtask>) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          checklist: client.checklist.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              subtasks: (item.subtasks || []).map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
              ),
            };
          }),
        };
      })
    );
  }, [setClients]);

  const toggleSubtask = useCallback((clientId: string, itemId: string, subtaskId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          checklist: client.checklist.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              subtasks: (item.subtasks || []).map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
              ),
            };
          }),
        };
      })
    );
  }, [setClients]);

  const removeSubtask = useCallback((clientId: string, itemId: string, subtaskId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          checklist: client.checklist.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              subtasks: (item.subtasks || []).filter((subtask) => subtask.id !== subtaskId),
            };
          }),
        };
      })
    );
  }, [setClients]);

  // Comment operations
  const addComment = useCallback((clientId: string, itemId: string, text: string, author: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          checklist: client.checklist.map((item) => {
            if (item.id !== itemId) return item;
            const newComment: Comment = {
              id: generateId(),
              text,
              author,
              createdAt: new Date().toISOString(),
            };
            return {
              ...item,
              comments: [...(item.comments || []), newComment],
            };
          }),
        };
      })
    );
  }, [setClients]);

  const updateComment = useCallback((clientId: string, itemId: string, commentId: string, text: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          checklist: client.checklist.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              comments: (item.comments || []).map((comment) =>
                comment.id === commentId
                  ? { ...comment, text, editedAt: new Date().toISOString() }
                  : comment
              ),
            };
          }),
        };
      })
    );
  }, [setClients]);

  const deleteComment = useCallback((clientId: string, itemId: string, commentId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          checklist: client.checklist.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              comments: (item.comments || []).filter((comment) => comment.id !== commentId),
            };
          }),
        };
      })
    );
  }, [setClients]);

  const reorderChecklist = useCallback((clientId: string, checklist: ChecklistItem[]) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, checklist: checklist.map((item, i) => ({ ...item, order: i })) }
          : client
      )
    );
  }, [setClients]);

  const applyTemplate = useCallback((clientId: string, template: ChecklistTemplate) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const now = new Date();
        // Find the default group (To Do) or use the first group
        const defaultGroup = client.taskGroups?.find((g) => g.isDefault) || client.taskGroups?.[0];
        const defaultGroupId = defaultGroup?.id;

        const newItems: ChecklistItem[] = template.items.map((item, index) => ({
          id: generateId(),
          title: item.title,
          completed: false,
          dueDate: item.dueOffsetDays
            ? new Date(now.getTime() + item.dueOffsetDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : undefined,
          order: client.checklist.length + index,
          groupId: defaultGroupId,
        }));
        const logEntry = createLogEntry('task_added', `Applied template "${template.name}" (${template.items.length} tasks)`);
        return {
          ...client,
          checklist: [...client.checklist, ...newItems],
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const updateNotes = useCallback((clientId: string, notes: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const hadNotes = client.notes.length > 0;
        const hasNotes = notes.length > 0;
        let logEntry: ActivityLogEntry | null = null;
        if (!hadNotes && hasNotes) {
          logEntry = createLogEntry('note_updated', 'Notes added');
        }
        return {
          ...client,
          notes,
          activityLog: logEntry ? [...client.activityLog, logEntry] : client.activityLog,
        };
      })
    );
  }, [setClients]);

  // Bulk operations
  const bulkUpdateStatus = useCallback((clientIds: string[], status: Client['status']) => {
    setClients((prev) =>
      prev.map((client) => {
        if (!clientIds.includes(client.id)) return client;
        const logEntry = createLogEntry('status_changed', `Status changed to ${status} (bulk action)`);
        return {
          ...client,
          status,
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const bulkUpdatePriority = useCallback((clientIds: string[], priority: Priority) => {
    setClients((prev) =>
      prev.map((client) => {
        if (!clientIds.includes(client.id)) return client;
        const logEntry = createLogEntry('priority_changed', `Priority changed to ${priority} (bulk action)`);
        return {
          ...client,
          priority,
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const bulkArchive = useCallback((clientIds: string[]) => {
    setClients((prev) =>
      prev.map((client) => {
        if (!clientIds.includes(client.id)) return client;
        const logEntry = createLogEntry('archived', 'Client archived (bulk action)');
        return {
          ...client,
          archived: true,
          archivedAt: new Date().toISOString(),
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const bulkDelete = useCallback((clientIds: string[]) => {
    setClients((prev) => prev.filter((client) => !clientIds.includes(client.id)));
  }, [setClients]);

  const bulkRestore = useCallback((clientIds: string[]) => {
    setClients((prev) =>
      prev.map((client) => {
        if (!clientIds.includes(client.id)) return client;
        const logEntry = createLogEntry('restored', 'Client restored (bulk action)');
        return {
          ...client,
          archived: false,
          archivedAt: undefined,
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  // Import operations
  const importClients = useCallback((clientsToImport: ClientFormData[]): number => {
    const newClients: Client[] = clientsToImport.map((data) => ({
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      services: [],
      checklist: [],
      notes: '',
      priority: data.priority || 'none',
      tags: [],
      activityLog: [createLogEntry('created', 'Client imported from CSV')],
    }));
    setClients((prev) => [...prev, ...newClients]);
    return newClients.length;
  }, [setClients]);

  const restoreBackup = useCallback((backupClients: Client[], merge: boolean = false): number => {
    if (merge) {
      // Merge: add clients that don't exist (by ID)
      setClients((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newClients = backupClients.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newClients];
      });
      return backupClients.filter((c) => !clients.some((existing) => existing.id === c.id)).length;
    } else {
      // Replace: overwrite all clients
      setClients(backupClients);
      return backupClients.length;
    }
  }, [clients, setClients]);

  // Custom field operations
  const updateCustomField = useCallback((clientId: string, fieldId: string, value: unknown) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const logEntry = createLogEntry('custom_field_updated', 'Custom field updated');
        return {
          ...client,
          customFields: {
            ...(client.customFields || {}),
            [fieldId]: value,
          },
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  // Milestone operations
  const addMilestone = useCallback((clientId: string, milestone: Omit<Milestone, 'id' | 'order'>) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const newMilestone: Milestone = {
          id: generateId(),
          ...milestone,
          order: (client.milestones?.length || 0),
        };
        const logEntry = createLogEntry('milestone_added', `Milestone "${milestone.title}" added`);
        return {
          ...client,
          milestones: [...(client.milestones || []), newMilestone],
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const updateMilestone = useCallback((clientId: string, milestoneId: string, updates: Partial<Omit<Milestone, 'id'>>) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const logEntry = createLogEntry('milestone_updated', 'Milestone updated');
        return {
          ...client,
          milestones: (client.milestones || []).map((m) =>
            m.id === milestoneId ? { ...m, ...updates } : m
          ),
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const completeMilestone = useCallback((clientId: string, milestoneId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const milestone = client.milestones?.find((m) => m.id === milestoneId);
        const isCompleting = !milestone?.completedAt;
        const logEntry = createLogEntry(
          'milestone_completed',
          isCompleting ? `Milestone "${milestone?.title}" completed` : `Milestone "${milestone?.title}" uncompleted`
        );
        return {
          ...client,
          milestones: (client.milestones || []).map((m) =>
            m.id === milestoneId
              ? { ...m, completedAt: isCompleting ? new Date().toISOString() : undefined }
              : m
          ),
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const removeMilestone = useCallback((clientId: string, milestoneId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const milestone = client.milestones?.find((m) => m.id === milestoneId);
        const logEntry = createLogEntry('milestone_updated', `Milestone "${milestone?.title}" removed`);
        return {
          ...client,
          milestones: (client.milestones || []).filter((m) => m.id !== milestoneId),
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const reorderMilestones = useCallback((clientId: string, milestones: Milestone[]) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, milestones: milestones.map((m, i) => ({ ...m, order: i })) }
          : client
      )
    );
  }, [setClients]);

  // Phase operations
  const addPhase = useCallback((clientId: string, phase: Omit<OnboardingPhase, 'id' | 'order'>) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const newPhase: OnboardingPhase = {
          id: generateId(),
          ...phase,
          order: (client.phases?.length || 0),
        };
        return {
          ...client,
          phases: [...(client.phases || []), newPhase],
        };
      })
    );
  }, [setClients]);

  const updatePhase = useCallback((clientId: string, phaseId: string, updates: Partial<Omit<OnboardingPhase, 'id'>>) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          phases: (client.phases || []).map((p) =>
            p.id === phaseId ? { ...p, ...updates } : p
          ),
        };
      })
    );
  }, [setClients]);

  const deletePhase = useCallback((clientId: string, phaseId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          phases: (client.phases || []).filter((p) => p.id !== phaseId),
          // Clear phaseId from any tasks that had this phase
          checklist: client.checklist.map((item) =>
            item.phaseId === phaseId ? { ...item, phaseId: undefined } : item
          ),
        };
      })
    );
  }, [setClients]);

  const reorderPhases = useCallback((clientId: string, phases: OnboardingPhase[]) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, phases: phases.map((p, i) => ({ ...p, order: i })) }
          : client
      )
    );
  }, [setClients]);

  const completePhase = useCallback((clientId: string, phaseId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const phase = client.phases?.find(p => p.id === phaseId);
        if (!phase) return client;

        // Validate all tasks in phase are done
        const phaseTasks = client.checklist.filter(t => t.phaseId === phaseId);
        const allDone = phaseTasks.every(t => t.completed);
        if (!allDone) return client;

        const logEntry = createLogEntry('phase_advanced', `Phase "${phase.name}" advanced`, { phaseId, actor: 'You' });
        return {
          ...client,
          phases: (client.phases ?? []).map(p =>
            p.id === phaseId ? { ...p, completedAt: new Date().toISOString() } : p
          ),
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  // Contact operations
  const addContact = useCallback((clientId: string, contact: Omit<ClientContact, 'id' | 'createdAt'>) => {
    const newContact: ClientContact = {
      ...contact,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, contacts: [...(c.contacts ?? []), newContact] }
          : c
      )
    );
  }, [setClients]);

  const updateContact = useCallback((clientId: string, contactId: string, updates: Partial<Omit<ClientContact, 'id' | 'createdAt'>>) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          contacts: (c.contacts ?? []).map((ct) =>
            ct.id === contactId ? { ...ct, ...updates } : ct
          ),
        };
      })
    );
  }, [setClients]);

  const removeContact = useCallback((clientId: string, contactId: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id !== clientId
          ? c
          : { ...c, contacts: (c.contacts ?? []).filter((ct) => ct.id !== contactId) }
      )
    );
  }, [setClients]);

  const updateLifecycleStage = useCallback(
    (clientId: string, stage: LifecycleStage) => {
      setClients(prev =>
        prev.map(c =>
          c.id === clientId
            ? { ...c, lifecycleStage: stage, activityLog: [...c.activityLog, {
                id: generateId(),
                type: 'status_changed' as const,
                description: `Lifecycle stage changed to ${stage}`,
                timestamp: new Date().toISOString(),
              }] }
            : c
        )
      );
    },
    [setClients]
  );

  const updateAccountInfo = useCallback(
    (clientId: string, info: Partial<AccountInfo>) => {
      setClients(prev =>
        prev.map(c =>
          c.id === clientId
            ? { ...c, account: { ...c.account, ...info } }
            : c
        )
      );
    },
    [setClients]
  );

  // Communication log operations
  const addCommunication = useCallback((
    clientId: string,
    entry: Omit<CommunicationLogEntry, 'id' | 'timestamp'>
  ) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const newEntry: CommunicationLogEntry = {
          id: generateId(),
          ...entry,
          timestamp: new Date().toISOString(),
        };
        const logEntry = createLogEntry('communication_logged', `${entry.type}: ${entry.subject}`);
        return {
          ...client,
          communicationLog: [...(client.communicationLog || []), newEntry],
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const updateCommunication = useCallback((
    clientId: string,
    entryId: string,
    updates: Partial<Omit<CommunicationLogEntry, 'id' | 'timestamp'>>
  ) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          communicationLog: (client.communicationLog || []).map((e) =>
            e.id === entryId ? { ...e, ...updates } : e
          ),
        };
      })
    );
  }, [setClients]);

  const deleteCommunication = useCallback((clientId: string, entryId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          communicationLog: (client.communicationLog || []).filter((e) => e.id !== entryId),
        };
      })
    );
  }, [setClients]);

  // Attachment operations
  const addAttachment = useCallback((
    clientId: string,
    file: Omit<FileAttachment, 'id' | 'uploadedAt'>
  ) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const newAttachment: FileAttachment = {
          id: generateId(),
          ...file,
          uploadedAt: new Date().toISOString(),
        };
        const logEntry = createLogEntry('attachment_added', `File "${file.name}" attached`);
        return {
          ...client,
          attachments: [...(client.attachments || []), newAttachment],
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  const removeAttachment = useCallback((clientId: string, attachmentId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const attachment = client.attachments?.find((a) => a.id === attachmentId);
        const logEntry = createLogEntry('attachment_removed', `File "${attachment?.name}" removed`);
        return {
          ...client,
          attachments: (client.attachments || []).filter((a) => a.id !== attachmentId),
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
  }, [setClients]);

  // Client note operations
  const addClientNote = useCallback((
    clientId: string,
    content: string,
    linkedDate?: string
  ): string => {
    const noteId = generateId();
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const newNote: ClientNote = {
          id: noteId,
          content,
          isPinned: false,
          linkedDate,
          createdAt: new Date().toISOString(),
        };
        const logEntry = createLogEntry('note_updated', 'Note added');
        return {
          ...client,
          clientNotes: [newNote, ...(client.clientNotes || [])],
          activityLog: [...client.activityLog, logEntry],
        };
      })
    );
    return noteId;
  }, [setClients]);

  const updateClientNote = useCallback((
    clientId: string,
    noteId: string,
    updates: Partial<Omit<ClientNote, 'id' | 'createdAt'>>
  ) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          clientNotes: (client.clientNotes || []).map((note) =>
            note.id === noteId
              ? { ...note, ...updates, updatedAt: new Date().toISOString() }
              : note
          ),
        };
      })
    );
  }, [setClients]);

  const deleteClientNote = useCallback((clientId: string, noteId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          clientNotes: (client.clientNotes || []).filter((note) => note.id !== noteId),
        };
      })
    );
  }, [setClients]);

  const togglePinNote = useCallback((clientId: string, noteId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          clientNotes: (client.clientNotes || []).map((note) =>
            note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
          ),
        };
      })
    );
  }, [setClients]);

  // Task group operations
  const addTaskGroup = useCallback((clientId: string, name: string, color?: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const existingGroups = client.taskGroups || [];
        const newGroup: TaskGroup = {
          id: generateId(),
          name,
          order: existingGroups.length,
          color: color || '#6366f1',
          isDefault: false,
        };
        return {
          ...client,
          taskGroups: [...existingGroups, newGroup],
        };
      })
    );
  }, [setClients]);

  const updateTaskGroup = useCallback((clientId: string, groupId: string, updates: Partial<Omit<TaskGroup, 'id'>>) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          taskGroups: (client.taskGroups || []).map((g) =>
            g.id === groupId ? { ...g, ...updates } : g
          ),
        };
      })
    );
  }, [setClients]);

  const removeTaskGroup = useCallback((clientId: string, groupId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const group = client.taskGroups?.find((g) => g.id === groupId);
        // Don't allow removing the default group
        if (group?.isDefault) return client;

        // Get the default group id to move tasks to
        const defaultGroup = client.taskGroups?.find((g) => g.isDefault);
        const defaultGroupId = defaultGroup?.id;

        return {
          ...client,
          taskGroups: (client.taskGroups || []).filter((g) => g.id !== groupId),
          // Move tasks from deleted group to default group
          checklist: client.checklist.map((item) =>
            item.groupId === groupId ? { ...item, groupId: defaultGroupId } : item
          ),
        };
      })
    );
  }, [setClients]);

  const reorderTaskGroups = useCallback((clientId: string, taskGroups: TaskGroup[]) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, taskGroups: taskGroups.map((g, i) => ({ ...g, order: i })) }
          : client
      )
    );
  }, [setClients]);

  const moveTaskToGroup = useCallback((clientId: string, taskId: string, groupId: string | undefined) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          checklist: client.checklist.map((item) =>
            item.id === taskId ? { ...item, groupId } : item
          ),
        };
      })
    );
  }, [setClients]);

  // Direct state setter for undo/redo
  const setClientsDirectly = useCallback((newClients: Client[]) => {
    setClients(newClients);
  }, [setClients]);

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    archiveClient,
    restoreClient,
    duplicateClient,
    updateStatus,
    updatePriority,
    addTag,
    removeTag,
    addService,
    updateService,
    removeService,
    reorderServices,
    addChecklistItem,
    addChecklistItemWithData,
    updateChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    reorderChecklist,
    applyTemplate,
    updateNotes,
    addSubtask,
    updateSubtask,
    toggleSubtask,
    removeSubtask,
    addComment,
    updateComment,
    deleteComment,
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkArchive,
    bulkDelete,
    bulkRestore,
    importClients,
    restoreBackup,
    // New feature operations
    updateCustomField,
    addMilestone,
    updateMilestone,
    completeMilestone,
    removeMilestone,
    reorderMilestones,
    addContact,
    updateContact,
    removeContact,
    addCommunication,
    updateCommunication,
    deleteCommunication,
    addAttachment,
    removeAttachment,
    // Client note operations
    addClientNote,
    updateClientNote,
    deleteClientNote,
    togglePinNote,
    // Task group operations
    addTaskGroup,
    updateTaskGroup,
    removeTaskGroup,
    reorderTaskGroups,
    moveTaskToGroup,
    // CRM operations
    updateLifecycleStage,
    updateAccountInfo,
    // Phase operations
    addPhase,
    updatePhase,
    deletePhase,
    reorderPhases,
    completePhase,
    // For undo/redo
    setClientsDirectly,
  };
}
