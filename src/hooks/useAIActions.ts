import { useCallback } from 'react';
import { useClientContext } from '../context/ClientContext';
import type { Client, ChecklistItem, Priority, CommunicationType } from '../types';

// Define the tools that the AI can use
export const aiTools = [
  {
    name: 'add_client',
    description: 'Add a new client to the system',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Client name' },
        email: { type: 'string', description: 'Client email address' },
        phone: { type: 'string', description: 'Client phone number (optional)' },
        assignedTo: { type: 'string', description: 'Person assigned to this client' },
        status: { type: 'string', enum: ['active', 'on-hold', 'completed'], description: 'Client status' },
        priority: { type: 'string', enum: ['high', 'medium', 'low', 'none'], description: 'Client priority' },
        notes: { type: 'string', description: 'Initial notes for the client (optional)' },
      },
      required: ['name', 'email', 'assignedTo'],
    },
  },
  {
    name: 'update_client',
    description: 'Update an existing client\'s information',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client to update' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        name: { type: 'string', description: 'New client name (optional)' },
        email: { type: 'string', description: 'New email address (optional)' },
        phone: { type: 'string', description: 'New phone number (optional)' },
        assignedTo: { type: 'string', description: 'New assigned person (optional)' },
        status: { type: 'string', enum: ['active', 'on-hold', 'completed'], description: 'New status (optional)' },
        priority: { type: 'string', enum: ['high', 'medium', 'low', 'none'], description: 'New priority (optional)' },
        notes: { type: 'string', description: 'New notes content (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'add_task',
    description: 'Add a new task to a client\'s checklist',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        title: { type: 'string', description: 'Task title' },
        dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format (optional)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        taskTitle: { type: 'string', description: 'The title of the task to complete (partial match supported)' },
        taskId: { type: 'string', description: 'The ID of the task (if known)' },
      },
      required: ['taskTitle'],
    },
  },
  {
    name: 'uncomplete_task',
    description: 'Mark a task as not completed (reopen it)',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        taskTitle: { type: 'string', description: 'The title of the task to uncomplete (partial match supported)' },
        taskId: { type: 'string', description: 'The ID of the task (if known)' },
      },
      required: ['taskTitle'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task from a client\'s checklist',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        taskTitle: { type: 'string', description: 'The title of the task to delete (partial match supported)' },
        taskId: { type: 'string', description: 'The ID of the task (if known)' },
      },
      required: ['taskTitle'],
    },
  },
  {
    name: 'update_client_notes',
    description: 'Update or append to a client\'s notes',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        notes: { type: 'string', description: 'The notes content' },
        append: { type: 'boolean', description: 'If true, append to existing notes. If false, replace.' },
      },
      required: ['notes'],
    },
  },
  {
    name: 'get_client_details',
    description: 'Get detailed information about a specific client',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
      },
      required: [],
    },
  },
  {
    name: 'list_clients',
    description: 'List all clients with optional filtering',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'on-hold', 'completed', 'all'], description: 'Filter by status' },
        priority: { type: 'string', enum: ['high', 'medium', 'low', 'none', 'all'], description: 'Filter by priority' },
        includeArchived: { type: 'boolean', description: 'Include archived clients' },
      },
      required: [],
    },
  },
  {
    name: 'add_service',
    description: 'Add a service to a client',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        serviceName: { type: 'string', description: 'Name of the service to add' },
      },
      required: ['serviceName'],
    },
  },
  {
    name: 'archive_client',
    description: 'Archive a client',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
      },
      required: [],
    },
  },
  {
    name: 'move_task_to_group',
    description: 'Move a task to a different group/section (To Do, In Progress, Done)',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        taskTitle: { type: 'string', description: 'The title of the task to move (partial match supported)' },
        taskId: { type: 'string', description: 'The ID of the task (if known)' },
        targetGroup: { type: 'string', description: 'The target group name (e.g., "To Do", "In Progress", "Done")' },
      },
      required: ['taskTitle', 'targetGroup'],
    },
  },
  {
    name: 'add_milestone',
    description: 'Add a new milestone to a client',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        title: { type: 'string', description: 'Milestone title' },
        description: { type: 'string', description: 'Milestone description (optional)' },
        targetDate: { type: 'string', description: 'Target date in YYYY-MM-DD format (optional)' },
        color: { type: 'string', description: 'Milestone color (optional, e.g., "#8b5cf6")' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_milestone',
    description: 'Mark a milestone as completed',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        milestoneTitle: { type: 'string', description: 'The title of the milestone (partial match supported)' },
        milestoneId: { type: 'string', description: 'The ID of the milestone (if known)' },
      },
      required: ['milestoneTitle'],
    },
  },
  {
    name: 'get_milestones',
    description: 'Get all milestones for a client',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
      },
      required: [],
    },
  },
  {
    name: 'add_communication',
    description: 'Log a communication entry for a client (email, call, meeting, or note)',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        type: { type: 'string', enum: ['email', 'call', 'meeting', 'note'], description: 'Type of communication' },
        subject: { type: 'string', description: 'Subject or title of the communication' },
        content: { type: 'string', description: 'Content or notes about the communication' },
        participants: { type: 'array', items: { type: 'string' }, description: 'List of participants (optional, for meetings)' },
        duration: { type: 'number', description: 'Duration in minutes (optional, for calls/meetings)' },
      },
      required: ['type', 'subject', 'content'],
    },
  },
  {
    name: 'get_communication_log',
    description: 'Get the communication log for a client',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The ID of the client' },
        clientName: { type: 'string', description: 'The name of the client to find (used if clientId not provided)' },
        type: { type: 'string', enum: ['email', 'call', 'meeting', 'note', 'all'], description: 'Filter by type (optional)' },
        limit: { type: 'number', description: 'Maximum number of entries to return (optional, default 10)' },
      },
      required: [],
    },
  },
];

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export function useAIActions() {
  const {
    clients,
    addClient,
    updateClient,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
    addService,
    archiveClient,
    moveTaskToGroup,
    addMilestone,
    completeMilestone,
    addCommunication,
  } = useClientContext();

  const findClientByName = useCallback((name: string): Client | undefined => {
    const lowerName = name.toLowerCase();
    return clients.find(c =>
      c.name.toLowerCase() === lowerName ||
      c.name.toLowerCase().includes(lowerName)
    );
  }, [clients]);

  const findClient = useCallback((clientId?: string, clientName?: string): Client | undefined => {
    if (clientId) {
      return clients.find(c => c.id === clientId);
    }
    if (clientName) {
      return findClientByName(clientName);
    }
    return undefined;
  }, [clients, findClientByName]);

  const findTask = useCallback((client: Client, taskTitle?: string, taskId?: string): ChecklistItem | undefined => {
    if (taskId) {
      return client.checklist.find(t => t.id === taskId);
    }
    if (taskTitle) {
      const lowerTitle = taskTitle.toLowerCase();
      return client.checklist.find(t =>
        t.title.toLowerCase() === lowerTitle ||
        t.title.toLowerCase().includes(lowerTitle)
      );
    }
    return undefined;
  }, []);

  const executeAction = useCallback(async (
    toolName: string,
    toolInput: Record<string, unknown>,
    contextClientId?: string
  ): Promise<ActionResult> => {
    try {
      switch (toolName) {
        case 'add_client': {
          const newClient = addClient({
            name: toolInput.name as string,
            email: toolInput.email as string,
            phone: (toolInput.phone as string) || '',
            assignedTo: toolInput.assignedTo as string,
            status: (toolInput.status as 'active' | 'on-hold' | 'completed') || 'active',
            priority: (toolInput.priority as Priority) || 'medium',
          });
          if (toolInput.notes) {
            updateClient(newClient.id, { notes: toolInput.notes as string });
          }
          return {
            success: true,
            message: `Successfully added client "${newClient.name}"`,
            data: { clientId: newClient.id, clientName: newClient.name },
          };
        }

        case 'update_client': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          const updates: Partial<Client> = {};
          if (toolInput.name) updates.name = toolInput.name as string;
          if (toolInput.email) updates.email = toolInput.email as string;
          if (toolInput.phone !== undefined) updates.phone = toolInput.phone as string;
          if (toolInput.assignedTo) updates.assignedTo = toolInput.assignedTo as string;
          if (toolInput.status) updates.status = toolInput.status as 'active' | 'on-hold' | 'completed';
          if (toolInput.priority) updates.priority = toolInput.priority as Priority;
          if (toolInput.notes !== undefined) updates.notes = toolInput.notes as string;

          updateClient(client.id, updates);
          return {
            success: true,
            message: `Successfully updated client "${client.name}"`,
            data: { clientId: client.id },
          };
        }

        case 'add_task': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found. Please specify which client to add the task to.' };
          }

          addChecklistItem(
            client.id,
            toolInput.title as string,
            toolInput.dueDate as string | undefined
          );
          return {
            success: true,
            message: `Successfully added task "${toolInput.title}" to ${client.name}`,
            data: { clientId: client.id, taskTitle: toolInput.title },
          };
        }

        case 'complete_task': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          const task = findTask(client, toolInput.taskTitle as string, toolInput.taskId as string);
          if (!task) {
            return { success: false, message: `Task "${toolInput.taskTitle}" not found` };
          }

          updateChecklistItem(client.id, task.id, { completed: true });
          return {
            success: true,
            message: `Marked "${task.title}" as completed for ${client.name}`,
            data: { clientId: client.id, taskId: task.id, taskTitle: task.title },
          };
        }

        case 'uncomplete_task': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          const task = findTask(client, toolInput.taskTitle as string, toolInput.taskId as string);
          if (!task) {
            return { success: false, message: `Task "${toolInput.taskTitle}" not found` };
          }

          updateChecklistItem(client.id, task.id, { completed: false });
          return {
            success: true,
            message: `Reopened "${task.title}" for ${client.name}`,
            data: { clientId: client.id, taskId: task.id, taskTitle: task.title },
          };
        }

        case 'delete_task': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          const task = findTask(client, toolInput.taskTitle as string, toolInput.taskId as string);
          if (!task) {
            return { success: false, message: `Task "${toolInput.taskTitle}" not found` };
          }

          removeChecklistItem(client.id, task.id);
          return {
            success: true,
            message: `Deleted task "${task.title}" from ${client.name}`,
            data: { clientId: client.id, taskTitle: task.title },
          };
        }

        case 'update_client_notes': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          const newNotes = toolInput.append
            ? `${client.notes}\n\n${toolInput.notes}`
            : toolInput.notes as string;

          updateClient(client.id, { notes: newNotes });
          return {
            success: true,
            message: `Updated notes for ${client.name}`,
            data: { clientId: client.id },
          };
        }

        case 'get_client_details': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          const completedTasks = client.checklist.filter(t => t.completed).length;
          const totalTasks = client.checklist.length;

          return {
            success: true,
            message: `Found client: ${client.name}`,
            data: {
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.phone,
              status: client.status,
              priority: client.priority,
              assignedTo: client.assignedTo,
              progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
              tasks: client.checklist.map(t => ({
                id: t.id,
                title: t.title,
                completed: t.completed,
                dueDate: t.dueDate,
              })),
              services: client.services.map(s => s.name),
              notes: client.notes,
            },
          };
        }

        case 'list_clients': {
          let filteredClients = [...clients];

          if (!toolInput.includeArchived) {
            filteredClients = filteredClients.filter(c => !c.archived);
          }

          if (toolInput.status && toolInput.status !== 'all') {
            filteredClients = filteredClients.filter(c => c.status === toolInput.status);
          }

          if (toolInput.priority && toolInput.priority !== 'all') {
            filteredClients = filteredClients.filter(c => c.priority === toolInput.priority);
          }

          return {
            success: true,
            message: `Found ${filteredClients.length} clients`,
            data: filteredClients.map(c => ({
              id: c.id,
              name: c.name,
              status: c.status,
              priority: c.priority,
              progress: c.checklist.length > 0
                ? Math.round((c.checklist.filter(t => t.completed).length / c.checklist.length) * 100)
                : 0,
            })),
          };
        }

        case 'add_service': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          addService(client.id, toolInput.serviceName as string);
          return {
            success: true,
            message: `Added service "${toolInput.serviceName}" to ${client.name}`,
            data: { clientId: client.id, serviceName: toolInput.serviceName },
          };
        }

        case 'archive_client': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          archiveClient(client.id);
          return {
            success: true,
            message: `Archived client "${client.name}"`,
            data: { clientId: client.id },
          };
        }

        case 'move_task_to_group': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          const task = findTask(client, toolInput.taskTitle as string, toolInput.taskId as string);
          if (!task) {
            return { success: false, message: `Task "${toolInput.taskTitle}" not found` };
          }

          // Find or create the target group
          const targetGroupName = (toolInput.targetGroup as string).toLowerCase();
          const taskGroups = client.taskGroups || [];
          let targetGroup = taskGroups.find(g => g.name.toLowerCase() === targetGroupName);

          if (!targetGroup) {
            // Check for common group names
            const commonNames: Record<string, string> = {
              'to do': 'To Do',
              'todo': 'To Do',
              'in progress': 'In Progress',
              'inprogress': 'In Progress',
              'doing': 'In Progress',
              'done': 'Done',
              'completed': 'Done',
              'complete': 'Done',
            };
            const normalizedName = commonNames[targetGroupName] || toolInput.targetGroup as string;
            targetGroup = taskGroups.find(g => g.name.toLowerCase() === normalizedName.toLowerCase());
          }

          moveTaskToGroup(client.id, task.id, targetGroup?.id);
          return {
            success: true,
            message: `Moved task "${task.title}" to ${targetGroup?.name || toolInput.targetGroup}`,
            data: { clientId: client.id, taskId: task.id, groupId: targetGroup?.id },
          };
        }

        case 'add_milestone': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found. Please specify which client to add the milestone to.' };
          }

          addMilestone(client.id, {
            title: toolInput.title as string,
            description: toolInput.description as string | undefined,
            targetDate: toolInput.targetDate as string | undefined,
            color: toolInput.color as string | undefined,
          });

          return {
            success: true,
            message: `Added milestone "${toolInput.title}" to ${client.name}`,
            data: { clientId: client.id, milestoneTitle: toolInput.title },
          };
        }

        case 'complete_milestone': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          const milestones = client.milestones || [];
          const milestoneTitle = (toolInput.milestoneTitle as string).toLowerCase();
          const milestone = toolInput.milestoneId
            ? milestones.find(m => m.id === toolInput.milestoneId)
            : milestones.find(m =>
                m.title.toLowerCase() === milestoneTitle ||
                m.title.toLowerCase().includes(milestoneTitle)
              );

          if (!milestone) {
            return { success: false, message: `Milestone "${toolInput.milestoneTitle}" not found` };
          }

          completeMilestone(client.id, milestone.id);
          return {
            success: true,
            message: `Marked milestone "${milestone.title}" as completed for ${client.name}`,
            data: { clientId: client.id, milestoneId: milestone.id },
          };
        }

        case 'get_milestones': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          const milestones = client.milestones || [];
          const completed = milestones.filter(m => m.completedAt).length;

          return {
            success: true,
            message: `Found ${milestones.length} milestones for ${client.name} (${completed} completed)`,
            data: {
              clientId: client.id,
              milestones: milestones.map(m => ({
                id: m.id,
                title: m.title,
                description: m.description,
                targetDate: m.targetDate,
                completedAt: m.completedAt,
                isCompleted: !!m.completedAt,
              })),
            },
          };
        }

        case 'add_communication': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found. Please specify which client to log the communication for.' };
          }

          addCommunication(client.id, {
            type: toolInput.type as CommunicationType,
            subject: toolInput.subject as string,
            content: toolInput.content as string,
            participants: toolInput.participants as string[] | undefined,
            duration: toolInput.duration as number | undefined,
          });

          return {
            success: true,
            message: `Logged ${toolInput.type} "${toolInput.subject}" for ${client.name}`,
            data: { clientId: client.id, type: toolInput.type, subject: toolInput.subject },
          };
        }

        case 'get_communication_log': {
          const client = findClient(
            toolInput.clientId as string,
            toolInput.clientName as string
          ) || (contextClientId ? clients.find(c => c.id === contextClientId) : undefined);

          if (!client) {
            return { success: false, message: 'Client not found' };
          }

          let entries = client.communicationLog || [];
          const typeFilter = toolInput.type as string;
          const limit = (toolInput.limit as number) || 10;

          if (typeFilter && typeFilter !== 'all') {
            entries = entries.filter(e => e.type === typeFilter);
          }

          // Sort by timestamp descending and limit
          entries = [...entries]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);

          return {
            success: true,
            message: `Found ${entries.length} communication entries for ${client.name}`,
            data: {
              clientId: client.id,
              entries: entries.map(e => ({
                id: e.id,
                type: e.type,
                subject: e.subject,
                content: e.content,
                participants: e.participants,
                duration: e.duration,
                timestamp: e.timestamp,
              })),
            },
          };
        }

        default:
          return { success: false, message: `Unknown action: ${toolName}` };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }, [
    clients,
    findClient,
    findTask,
    addClient,
    updateClient,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
    addService,
    archiveClient,
    moveTaskToGroup,
    addMilestone,
    completeMilestone,
    addCommunication,
  ]);

  return {
    executeAction,
    tools: aiTools,
    clients,
  };
}
