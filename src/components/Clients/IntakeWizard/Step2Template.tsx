import { useState } from 'react';
import type { ChecklistTemplate, OnboardingPhase, ChecklistItem } from '../../../types';
import { buildTasksFromTemplate } from '../../../utils/helpers';
import { AIPlanGenerator } from '../AIPlanGenerator';

interface Step2Props {
  templates: ChecklistTemplate[];
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  goLiveDate: string;
  aiPlan: { phases: OnboardingPhase[]; tasks: ChecklistItem[] } | null;
  setAIPlan: (plan: { phases: OnboardingPhase[]; tasks: ChecklistItem[] } | null) => void;
}

export function Step2Template({
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  goLiveDate,
  aiPlan,
  setAIPlan,
}: Step2Props) {
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) ?? null;
  const previewTasks = selectedTemplate ? buildTasksFromTemplate(selectedTemplate, goLiveDate || undefined) : [];

  const handleAIPlanApply = (phases: OnboardingPhase[], tasks: ChecklistItem[]) => {
    setAIPlan({ phases, tasks });
    setSelectedTemplateId(null); // deselect any existing template
    setShowAIGenerator(false);
  };

  const handleSelectTemplate = (id: string | null) => {
    setSelectedTemplateId(id);
    if (id !== null) {
      setAIPlan(null); // clear AI plan when picking a template
    }
  };

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Apply a saved template, generate a plan with AI, or start blank.
        </p>

        {/* AI Generate button */}
        <button
          type="button"
          onClick={() => setShowAIGenerator(true)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
            aiPlan
              ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20'
              : 'border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50/30 dark:hover:bg-violet-900/10'
          }`}
        >
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </span>
          <div className="flex-1 text-left">
            <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
              {aiPlan ? 'AI Plan Applied' : 'Generate with AI'}
            </span>
            {aiPlan ? (
              <p className="text-xs text-violet-500 dark:text-violet-400 mt-0.5">
                {aiPlan.phases.length} phases, {aiPlan.tasks.length} tasks — click to regenerate
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">
                Create a custom plan based on industry, complexity and team size
              </p>
            )}
          </div>
          {aiPlan && (
            <svg className="w-5 h-5 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Divider with "or" */}
        {templates.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/20 dark:bg-white/10" />
            <span className="text-xs text-gray-400">or choose a template</span>
            <div className="flex-1 h-px bg-white/20 dark:bg-white/10" />
          </div>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleSelectTemplate(null)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
              selectedTemplateId === null && !aiPlan
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
              onClick={() => handleSelectTemplate(template.id)}
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

        {/* AI Plan preview */}
        {aiPlan && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              AI-Generated Plan Preview
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {aiPlan.phases.map(phase => {
                const phaseTasks = aiPlan.tasks.filter(t => t.phaseId === phase.id);
                return (
                  <div key={phase.id} className="rounded-lg border border-white/10 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${phase.color}`} />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{phase.name}</span>
                      <span className="ml-auto text-xs text-gray-400">{phaseTasks.length} tasks</span>
                    </div>
                    <ul className="px-3 py-1.5 space-y-1">
                      {phaseTasks.map(task => (
                        <li key={task.id} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span className="mt-0.5 w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0" />
                          <span className="flex-1">{task.title}</span>
                          {task.ownerType && (
                            <span className={`text-xs px-1 py-0.5 rounded font-medium flex-shrink-0 ${
                              task.ownerType === 'client'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-gray-500/10 text-gray-500 dark:text-gray-500'
                            }`}>
                              {task.ownerType}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Template preview */}
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

      {showAIGenerator && (
        <AIPlanGenerator
          onClose={() => setShowAIGenerator(false)}
          onApply={handleAIPlanApply}
        />
      )}
    </>
  );
}
