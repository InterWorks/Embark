import type { CustomFieldDefinition } from '../../types';

interface CustomFieldInputProps {
  definition: CustomFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  readonly?: boolean;
}

export function CustomFieldInput({ definition, value, onChange, readonly }: CustomFieldInputProps) {
  const baseClasses = readonly
    ? 'bg-transparent border-0 p-0 text-gray-900 dark:text-gray-100'
    : 'w-full px-3 py-2 rounded-lg border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50';

  switch (definition.type) {
    case 'text':
      return (
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readonly}
          className={baseClasses}
          placeholder={readonly ? '-' : `Enter ${definition.name.toLowerCase()}`}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          readOnly={readonly}
          className={baseClasses}
          placeholder={readonly ? '-' : `Enter ${definition.name.toLowerCase()}`}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readonly}
          className={baseClasses}
        />
      );

    case 'select':
      if (readonly) {
        return (
          <span className="text-gray-900 dark:text-gray-100">
            {(value as string) || '-'}
          </span>
        );
      }
      return (
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
        >
          <option value="">Select {definition.name.toLowerCase()}</option>
          {definition.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={readonly}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {value ? 'Yes' : 'No'}
          </span>
        </label>
      );

    default:
      return null;
  }
}
