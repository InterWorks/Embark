import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import type { Client } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

const columns: { id: Client['status']; title: string; color: string }[] = [
  { id: 'active', title: 'Active', color: 'border-green-500' },
  { id: 'on-hold', title: 'On Hold', color: 'border-yellow-500' },
  { id: 'completed', title: 'Completed', color: 'border-blue-500' },
];

export function KanbanBoard({ clients, onSelectClient }: KanbanBoardProps) {
  const { updateStatus } = useClientContext();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const getClientsByStatus = (status: Client['status']) => {
    return clients.filter((client) => client.status === status);
  };

  const activeClient = activeId ? clients.find((c) => c.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeClientId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      const client = clients.find((c) => c.id === activeClientId);
      if (client && client.status !== targetColumn.id) {
        updateStatus(activeClientId, targetColumn.id);
      }
      return;
    }

    // Check if dropped on another card
    const overClient = clients.find((c) => c.id === overId);
    if (overClient) {
      const client = clients.find((c) => c.id === activeClientId);
      if (client && client.status !== overClient.status) {
        updateStatus(activeClientId, overClient.status);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnClients = getClientsByStatus(column.id);
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              count={columnClients.length}
              color={column.color}
            >
              <SortableContext
                items={columnClients.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {columnClients.map((client) => (
                    <KanbanCard
                      key={client.id}
                      client={client}
                      onClick={() => onSelectClient(client)}
                    />
                  ))}
                </div>
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>
      <DragOverlay>
        {activeClient ? (
          <KanbanCard client={activeClient} onClick={() => {}} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
