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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Service } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface ServiceManagerProps {
  clientId: string;
  services: Service[];
}

export function ServiceManager({ clientId, services }: ServiceManagerProps) {
  const { addService, updateService, removeService, reorderServices } = useClientContext();
  const [newService, setNewService] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedServices = [...services].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedServices.findIndex((s) => s.id === active.id);
      const newIndex = sortedServices.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(sortedServices, oldIndex, newIndex).map((s, i) => ({
        ...s,
        order: i,
      }));
      reorderServices(clientId, newOrder);
    }
  };

  const handleAdd = () => {
    if (newService.trim()) {
      addService(clientId, newService.trim());
      setNewService('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const startEditing = (service: Service) => {
    setEditingId(service.id);
    setEditValue(service.name);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      updateService(clientId, editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold gradient-text mb-4">
        Services
      </h3>

      <div className="flex gap-2 mb-4">
        <Input
          value={newService}
          onChange={(e) => setNewService(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a service..."
          className="flex-1"
        />
        <Button onClick={handleAdd} disabled={!newService.trim()}>
          Add
        </Button>
      </div>

      {sortedServices.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
          No services assigned yet
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedServices.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-2">
              {sortedServices.map((service) => (
                <SortableServiceItem
                  key={service.id}
                  service={service}
                  isEditing={editingId === service.id}
                  editValue={editValue}
                  onEditValueChange={setEditValue}
                  onStartEditing={() => startEditing(service)}
                  onSaveEdit={saveEdit}
                  onEditKeyDown={handleEditKeyDown}
                  onRemove={() => removeService(clientId, service.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

interface SortableServiceItemProps {
  service: Service;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: () => void;
  onSaveEdit: () => void;
  onEditKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

function SortableServiceItem({
  service,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEditing,
  onSaveEdit,
  onEditKeyDown,
  onRemove,
}: SortableServiceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 bg-gradient-to-r from-blue-400 to-indigo-500 text-white px-3 py-1.5 rounded-full text-sm shadow-lg shadow-blue-500/25 ${
        isDragging ? 'shadow-xl ring-2 ring-white/50' : ''
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-70 hover:opacity-100 cursor-grab active:cursor-grabbing mr-1"
        title="Drag to reorder"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {isEditing ? (
        <input
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={onEditKeyDown}
          onBlur={onSaveEdit}
          className="bg-transparent outline-none border-b border-blue-400 min-w-[80px]"
          autoFocus
        />
      ) : (
        <>
          <span
            onClick={onStartEditing}
            className="cursor-pointer hover:underline"
          >
            {service.name}
          </span>
          <button
            onClick={onRemove}
            className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-600 dark:hover:text-red-400 transition-opacity"
            aria-label={`Remove ${service.name}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
