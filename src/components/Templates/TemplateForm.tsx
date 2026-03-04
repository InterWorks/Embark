import { useState, useEffect, type KeyboardEvent } from 'react';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Modal } from '../UI/Modal';

interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string | null;
}

interface TemplateItem {
  title: string;
  dueOffsetDays?: number;
}

export function TemplateForm({ isOpen, onClose, templateId }: TemplateFormProps) {
  const { templates, addTemplate, updateTemplate } = useClientContext();
  const [name, setName] = useState('');
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDays, setNewItemDays] = useState('');
  const [error, setError] = useState('');

  const editingTemplate = templateId ? templates.find((t) => t.id === templateId) : null;

  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setItems(editingTemplate.items);
    } else {
      setName('');
      setItems([]);
    }
    setNewItemTitle('');
    setNewItemDays('');
    setError('');
  }, [editingTemplate, isOpen]);

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;

    const newItem: TemplateItem = {
      title: newItemTitle.trim(),
      dueOffsetDays: newItemDays ? parseInt(newItemDays, 10) : undefined,
    };

    setItems([...items, newItem]);
    setNewItemTitle('');
    setNewItemDays('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    if (items.length === 0) {
      setError('Add at least one checklist item');
      return;
    }

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, { name: name.trim(), items });
    } else {
      addTemplate(name.trim(), items);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTemplate ? 'Edit Template' : 'Create Template'}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Template Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="e.g., Standard Onboarding"
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Checklist Items
          </label>

          <div className="flex gap-2 mb-3">
            <Input
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title"
              className="flex-1"
            />
            <Input
              value={newItemDays}
              onChange={(e) => setNewItemDays(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              placeholder="Days"
              className="w-20"
              title="Days from start until due"
            />
            <Button onClick={handleAddItem} disabled={!newItemTitle.trim()}>
              Add
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            "Days" sets how many days after applying the template each task will be due
          </p>

          {items.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">{index + 1}.</span>
                    <span className="text-gray-900 dark:text-gray-100">{item.title}</span>
                    {item.dueOffsetDays && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                        +{item.dueOffsetDays} days
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              No items yet. Add checklist items above.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingTemplate ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
