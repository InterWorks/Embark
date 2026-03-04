import { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { KeepWatchLogo } from '../UI/KeepWatchLogo';

interface OnboardingWizardProps {
  onComplete: () => void;
  onAddClient: () => void;
  onNavigateToTemplates: () => void;
}

const STORAGE_KEY = 'embark-onboarding-completed';

interface Step {
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function OnboardingWizard({
  onComplete,
  onAddClient,
  onNavigateToTemplates,
}: OnboardingWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const steps: Step[] = [
    {
      title: 'Welcome to Embark',
      description: 'Your all-in-one client onboarding tracker',
      content: (
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <KeepWatchLogo variant="icon" className="w-20 h-auto text-gray-900 dark:text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Embark helps you manage client onboarding with ease. Track tasks, milestones, communications, and more.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="p-3 glass-subtle rounded-xl text-center">
              <div className="text-2xl font-bold gradient-text">Tasks</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Track progress</div>
            </div>
            <div className="p-3 glass-subtle rounded-xl text-center">
              <div className="text-2xl font-bold gradient-text">Milestones</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Key phases</div>
            </div>
            <div className="p-3 glass-subtle rounded-xl text-center">
              <div className="text-2xl font-bold gradient-text">Templates</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Reusable checklists</div>
            </div>
            <div className="p-3 glass-subtle rounded-xl text-center">
              <div className="text-2xl font-bold gradient-text">Reports</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">PDF & Excel</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Quick Tour',
      description: 'Key features at a glance',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <Feature
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title="Manage Clients"
              description="Add clients, track their status, assign team members, and organize with tags"
            />
            <Feature
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
              title="Checklists & Templates"
              description="Create task checklists with due dates, subtasks, and reusable templates"
            />
            <Feature
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title="Communication Log"
              description="Track emails, calls, and meetings with your clients"
            />
            <Feature
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              }
              title="Undo/Redo"
              description="Made a mistake? Press Ctrl+Z to undo, Ctrl+Shift+Z to redo"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Keyboard Shortcuts',
      description: 'Work faster with shortcuts',
      content: (
        <div className="space-y-3">
          <Shortcut keys={['Ctrl', 'Shift', 'N']} description="Quick add menu" />
          <Shortcut keys={['Ctrl', 'Z']} description="Undo last action" />
          <Shortcut keys={['Ctrl', 'Shift', 'Z']} description="Redo action" />
          <Shortcut keys={['Ctrl', 'K']} description="Global search" />
          <Shortcut keys={['N']} description="New client (in client list)" />
          <Shortcut keys={['?']} description="Show all shortcuts" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs">?</kbd> anytime to see all available shortcuts
          </p>
        </div>
      ),
    },
    {
      title: 'Get Started',
      description: 'Ready to begin?',
      content: (
        <div className="space-y-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            You're all set! Here are some quick actions to get started:
          </p>
          <div className="space-y-3 mt-6">
            <button
              onClick={() => {
                handleComplete();
                onAddClient();
              }}
              className="w-full p-4 glass-subtle rounded-xl hover:bg-white/60 dark:hover:bg-white/15 transition-all text-left flex items-center gap-4 group"
            >
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg text-white group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Add your first client</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Start tracking an onboarding</p>
              </div>
            </button>
            <button
              onClick={() => {
                handleComplete();
                onNavigateToTemplates();
              }}
              className="w-full p-4 glass-subtle rounded-xl hover:bg-white/60 dark:hover:bg-white/15 transition-all text-left flex items-center gap-4 group"
            >
              <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg text-white group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Create a template</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Build reusable checklists</p>
              </div>
            </button>
            <button
              onClick={handleComplete}
              className="w-full p-4 glass-subtle rounded-xl hover:bg-white/60 dark:hover:bg-white/15 transition-all text-left flex items-center gap-4 group"
            >
              <div className="p-2 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg text-white group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Explore the dashboard</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View analytics and insights</p>
              </div>
            </button>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative glass-strong rounded-2xl shadow-2xl max-w-lg w-full border border-white/30 dark:border-white/10 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-white/20">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold gradient-text">{steps[currentStep].title}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{steps[currentStep].description}</p>
            </div>

            {/* Content */}
            <div className="min-h-[300px]">{steps[currentStep].content}</div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20 dark:border-white/10">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Skip tutorial
              </button>
              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <Button variant="secondary" onClick={prevStep}>
                    Back
                  </Button>
                )}
                {currentStep < steps.length - 1 ? (
                  <Button onClick={nextStep}>Next</Button>
                ) : (
                  <Button onClick={handleComplete}>Get Started</Button>
                )}
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-purple-500 w-6'
                      : index < currentStep
                      ? 'bg-purple-300 dark:bg-purple-700'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 glass-subtle rounded-xl">
      <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg text-white flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function Shortcut({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between p-3 glass-subtle rounded-xl">
      <span className="text-gray-700 dark:text-gray-300">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, index) => (
          <kbd
            key={index}
            className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

// Export a function to reset the onboarding (for testing)
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
