import type { ChecklistTemplate } from '../../../types';
import { buildTasksFromTemplate } from '../../../utils/helpers';

interface Step2Props {
  templates: ChecklistTemplate[];
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  goLiveDate: string;
}

export function Step2Template({ templates, selectedTemplateId, setSelectedTemplateId, goLiveDate }: Step2Props) {
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) ?? null;
  const previewTasks = selectedTemplate ? buildTasksFromTemplate(selectedTemplate, goLiveDate || undefined) : [];

  if (templates.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        No templates saved yet. You can add tasks manually after creating the client.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Optionally apply a task template. Tasks will be pre-populated with dates relative to the go-live date.
      </p>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setSelectedTemplateId(null)}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
            selectedTemplateId === null
              ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20'
              : 'border-white/20 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-700'
          }`}
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">No template — start blank</span>
        </button>

        {templates.map(template => (
          <button
            key={template.id}
            type="button"
            onClick={() => setSelectedTemplateId(template.id)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
              selectedTemplateId === template.id
                ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20'
                : 'border-white/20 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{template.name}</span>
              <span className="text-xs text-gray-400">{template.items.length} tasks</span>
            </div>
          </button>
        ))}
      </div>

      {selectedTemplate && previewTasks.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Tasks that will be added
          </p>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {previewTasks.map((task, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="mt-0.5 w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                <span className="flex-1">{task.title}</span>
                {task.dueDate && (
                  <span className="text-xs text-gray-400 flex-shrink-0">Due {task.dueDate}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
