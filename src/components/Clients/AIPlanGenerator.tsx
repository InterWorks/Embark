import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { OnboardingPhase, ChecklistItem, Priority } from '../../types';
import { useAISettings } from '../../hooks/useAISettings';

export interface AIPlanGeneratorProps {
  onClose: () => void;
  onApply: (phases: OnboardingPhase[], tasks: ChecklistItem[]) => void;
}

type Complexity = 'simple' | 'standard' | 'complex';
type TeamSize = '1-5' | '6-20' | '20+';
type Industry = 'SaaS' | 'Healthcare' | 'Finance' | 'Retail' | 'Manufacturing' | 'Other';

interface FormState {
  industry: Industry | '';
  customIndustry: string;
  products: string;
  complexity: Complexity;
  teamSize: TeamSize;
  specialRequirements: string;
}

interface AITaskRaw {
  title: string;
  ownerType: 'internal' | 'client';
  dueOffsetDays: number;
  priority: Priority;
}

interface AIPhaseRaw {
  name: string;
  description: string;
  color: string;
  tasks: AITaskRaw[];
}

interface AIResponse {
  phases: AIPhaseRaw[];
}

const PHASE_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
] as const;

const INDUSTRIES: Industry[] = ['SaaS', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Other'];

function extractJSON(text: string): string {
  // Try to extract JSON from ```json ... ``` or ``` ... ``` blocks first
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fencedMatch) return fencedMatch[1].trim();
  // Otherwise try to find a raw JSON object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  return text.trim();
}

function buildPrompt(form: FormState): string {
  const industry = form.industry === 'Other' ? (form.customIndustry || 'Other') : form.industry;
  return `You are an expert client onboarding consultant. Generate a structured onboarding plan for a new client.

Client details:
- Industry: ${industry}
- Products/services being onboarded: ${form.products}
- Complexity level: ${form.complexity}
- Estimated team size: ${form.teamSize} people
${form.specialRequirements ? `- Special requirements: ${form.specialRequirements}` : ''}

Create a realistic, actionable onboarding plan with 3-5 phases. Each phase should have 3-6 tasks.

Respond ONLY with a JSON object in this exact format (no other text):
{
  "phases": [
    {
      "name": "Phase Name",
      "description": "Brief description of this phase's goal",
      "color": "bg-blue-500",
      "tasks": [
        {
          "title": "Task title",
          "ownerType": "internal",
          "dueOffsetDays": 3,
          "priority": "high"
        }
      ]
    }
  ]
}

Rules:
- Use these colors in order for phases: bg-blue-500, bg-purple-500, bg-green-500, bg-orange-500, bg-pink-500, bg-teal-500
- ownerType must be "internal" or "client"
- priority must be "high", "medium", "low", or "none"
- dueOffsetDays should be cumulative from project start (e.g. 3, 7, 14, 21...)
- Tailor the plan specifically to the ${industry} industry and the ${form.complexity} complexity level`;
}

function parseAIResponse(text: string): AIResponse {
  const json = extractJSON(text);
  const parsed = JSON.parse(json) as AIResponse;
  if (!Array.isArray(parsed.phases)) throw new Error('Invalid response: missing phases array');
  return parsed;
}

function convertToEntities(
  raw: AIResponse,
): { phases: OnboardingPhase[]; tasks: ChecklistItem[] } {
  const phases: OnboardingPhase[] = [];
  const tasks: ChecklistItem[] = [];

  raw.phases.forEach((phaseRaw, phaseIndex) => {
    const phaseId = `ai-phase-${Date.now()}-${phaseIndex}`;
    const safeColor = PHASE_COLORS.includes(phaseRaw.color as typeof PHASE_COLORS[number])
      ? phaseRaw.color
      : PHASE_COLORS[phaseIndex % PHASE_COLORS.length];

    phases.push({
      id: phaseId,
      name: phaseRaw.name,
      description: phaseRaw.description,
      color: safeColor,
      order: phaseIndex,
    });

    phaseRaw.tasks.forEach((taskRaw, taskIndex) => {
      const taskId = `ai-task-${Date.now()}-${phaseIndex}-${taskIndex}`;
      const dueDate = taskRaw.dueOffsetDays > 0
        ? new Date(Date.now() + taskRaw.dueOffsetDays * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
        : undefined;

      tasks.push({
        id: taskId,
        title: taskRaw.title,
        completed: false,
        order: tasks.length,
        phaseId,
        ownerType: taskRaw.ownerType === 'client' ? 'client' : 'internal',
        priority: (['high', 'medium', 'low', 'none'] as Priority[]).includes(taskRaw.priority as Priority)
          ? (taskRaw.priority as Priority)
          : 'none',
        dueDate,
      });
    });
  });

  return { phases, tasks };
}

const defaultForm: FormState = {
  industry: '',
  customIndustry: '',
  products: '',
  complexity: 'standard',
  teamSize: '6-20',
  specialRequirements: '',
};

type Step = 'form' | 'preview';

export function AIPlanGenerator({ onClose, onApply }: AIPlanGeneratorProps) {
  const { settings } = useAISettings();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<{
    raw: AIResponse;
    phases: OnboardingPhase[];
    tasks: ChecklistItem[];
    collapsedPhases: Set<string>;
  } | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = useCallback(async () => {
    if (!settings.anthropicApiKey) {
      setError('No API key configured. Please add your Anthropic API key in Settings.');
      return;
    }
    if (!form.industry) {
      setError('Please select an industry.');
      return;
    }
    if (!form.products.trim()) {
      setError('Please describe the products or services being onboarded.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const prompt = buildPrompt(form);

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: settings.anthropicModel || 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || `API error ${resp.status}`);

      const text: string = data.content?.[0]?.text ?? '';
      if (!text) throw new Error('Empty response from AI');

      const raw = parseAIResponse(text);
      const { phases, tasks } = convertToEntities(raw);

      setGeneratedData({
        raw,
        phases,
        tasks,
        collapsedPhases: new Set(),
      });
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [form, settings]);

  const handleRegenerate = () => {
    setGeneratedData(null);
    setStep('form');
    setError(null);
  };

  const handleAccept = () => {
    if (!generatedData) return;
    onApply(generatedData.phases, generatedData.tasks);
    onClose();
  };

  const togglePhaseCollapse = (phaseId: string) => {
    if (!generatedData) return;
    setGeneratedData(prev => {
      if (!prev) return prev;
      const next = new Set(prev.collapsedPhases);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return { ...prev, collapsedPhases: next };
    });
  };

  const priorityColors: Record<Priority, string> = {
    high: 'text-red-500',
    medium: 'text-amber-500',
    low: 'text-blue-400',
    none: 'text-gray-400',
  };

  const modal = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative glass-strong rounded-2xl shadow-2xl w-full max-w-2xl border border-white/30 dark:border-white/10 flex flex-col"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  AI Onboarding Plan Generator
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {step === 'form' ? 'Tell us about your client' : 'Review your generated plan'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white/10 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 p-5">
            {/* Step 1: Form */}
            {step === 'form' && (
              <div className="space-y-5">
                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Client Industry <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setField('industry', ind)}
                        className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.industry === ind
                            ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                            : 'border-white/20 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-700'
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                  {form.industry === 'Other' && (
                    <input
                      type="text"
                      value={form.customIndustry}
                      onChange={e => setField('customIndustry', e.target.value)}
                      placeholder="Specify industry..."
                      className="mt-2 w-full px-3 py-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/5 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-violet-400"
                    />
                  )}
                </div>

                {/* Products/Services */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Products / Services Being Onboarded <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.products}
                    onChange={e => setField('products', e.target.value)}
                    rows={3}
                    placeholder="e.g. CRM software integration, data migration, team training..."
                    className="w-full px-3 py-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/5 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-violet-400 resize-none"
                  />
                </div>

                {/* Complexity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Complexity
                  </label>
                  <div className="flex gap-2">
                    {(['simple', 'standard', 'complex'] as Complexity[]).map(c => (
                      <label
                        key={c}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium capitalize ${
                          form.complexity === c
                            ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                            : 'border-white/20 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="complexity"
                          value={c}
                          checked={form.complexity === c}
                          onChange={() => setField('complexity', c)}
                          className="sr-only"
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Team Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Estimated Team Size
                  </label>
                  <div className="flex gap-2">
                    {(['1-5', '6-20', '20+'] as TeamSize[]).map(size => (
                      <label
                        key={size}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                          form.teamSize === size
                            ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                            : 'border-white/20 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="teamSize"
                          value={size}
                          checked={form.teamSize === size}
                          onChange={() => setField('teamSize', size)}
                          className="sr-only"
                        />
                        {size} people
                      </label>
                    ))}
                  </div>
                </div>

                {/* Special Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Special Requirements <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={form.specialRequirements}
                    onChange={e => setField('specialRequirements', e.target.value)}
                    rows={2}
                    placeholder="e.g. HIPAA compliance required, multi-region deployment, custom API integrations..."
                    className="w-full px-3 py-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/5 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-violet-400 resize-none"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Plan
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Preview */}
            {step === 'preview' && generatedData && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your AI-generated plan has{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {generatedData.phases.length} phases
                  </span>{' '}
                  and{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {generatedData.tasks.length} tasks
                  </span>
                  . Review and accept to apply to your client.
                </p>

                {/* Error */}
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Phase list */}
                <div className="space-y-3">
                  {generatedData.phases.map(phase => {
                    const phaseTasks = generatedData.tasks.filter(t => t.phaseId === phase.id);
                    const isCollapsed = generatedData.collapsedPhases.has(phase.id);

                    return (
                      <div
                        key={phase.id}
                        className="rounded-xl border border-white/20 dark:border-white/10 overflow-hidden"
                      >
                        {/* Phase header */}
                        <button
                          type="button"
                          onClick={() => togglePhaseCollapse(phase.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 transition-all text-left"
                        >
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${phase.color}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {phase.name}
                            </span>
                            {phase.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {phase.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                              isCollapsed ? '' : 'rotate-180'
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Task list */}
                        {!isCollapsed && (
                          <ul className="divide-y divide-white/10">
                            {phaseTasks.map(task => (
                              <li key={task.id} className="flex items-start gap-3 px-4 py-2.5">
                                <span className="mt-0.5 w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                  {task.title}
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {task.priority && task.priority !== 'none' && (
                                    <span className={`text-xs font-medium capitalize ${priorityColors[task.priority]}`}>
                                      {task.priority}
                                    </span>
                                  )}
                                  {task.ownerType && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                                      task.ownerType === 'client'
                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {task.ownerType}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className="text-xs text-gray-400">
                                      Day {Math.round(
                                        (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                      )}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white/10 transition-all disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                  <button
                    onClick={handleAccept}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-purple-700 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
