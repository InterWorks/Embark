import { useClientContext } from '../../context/ClientContext';
import { CustomFieldInput } from './CustomFieldInput';

interface CustomFieldRendererProps {
  clientId: string;
  customFields?: Record<string, unknown>;
  readonly?: boolean;
}

export function CustomFieldRenderer({ clientId, customFields, readonly = false }: CustomFieldRendererProps) {
  const { customFieldDefinitions, updateCustomField } = useClientContext();

  const sortedDefinitions = [...customFieldDefinitions].sort((a, b) => a.order - b.order);

  if (sortedDefinitions.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold gradient-text mb-4">Custom Fields</h3>
      <div className="space-y-4">
        {sortedDefinitions.map((definition) => (
          <div key={definition.id}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {definition.name}
              {definition.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <CustomFieldInput
              definition={definition}
              value={customFields?.[definition.id]}
              onChange={(value) => updateCustomField(clientId, definition.id, value)}
              readonly={readonly}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
