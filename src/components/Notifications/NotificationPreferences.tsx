import { useNotifications } from '../../hooks/useNotifications';

export function NotificationPreferences() {
  const { preferences, updatePreferences } = useNotifications();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Settings
        </h3>

        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-6">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Enable Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive in-app notifications for important events
            </p>
          </div>
          <ToggleSwitch
            checked={preferences.enabled}
            onChange={(checked) => updatePreferences({ enabled: checked })}
          />
        </div>

        {preferences.enabled && (
          <>
            {/* Notification Types */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Notification Types
              </h4>

              <NotificationToggle
                label="Task Due Soon"
                description="Get notified before tasks are due"
                checked={preferences.taskDueSoon}
                onChange={(checked) => updatePreferences({ taskDueSoon: checked })}
              />

              {preferences.taskDueSoon && (
                <div className="ml-8 flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Notify</span>
                  <select
                    value={preferences.taskDueSoonDays}
                    onChange={(e) => updatePreferences({ taskDueSoonDays: parseInt(e.target.value) })}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={1}>1 day</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={5}>5 days</option>
                    <option value={7}>7 days</option>
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">before due date</span>
                </div>
              )}

              <NotificationToggle
                label="Task Overdue"
                description="Get notified when tasks are past their due date"
                checked={preferences.taskOverdue}
                onChange={(checked) => updatePreferences({ taskOverdue: checked })}
              />

              <NotificationToggle
                label="Task Assigned"
                description="Get notified when a task is assigned to you"
                checked={preferences.taskAssigned}
                onChange={(checked) => updatePreferences({ taskAssigned: checked })}
              />

              <NotificationToggle
                label="Task Completed"
                description="Get notified when tasks you assigned are completed"
                checked={preferences.taskCompleted}
                onChange={(checked) => updatePreferences({ taskCompleted: checked })}
              />

              <NotificationToggle
                label="Milestone Reached"
                description="Get notified when clients reach milestones"
                checked={preferences.milestoneReached}
                onChange={(checked) => updatePreferences({ milestoneReached: checked })}
              />

              <NotificationToggle
                label="Client Completed"
                description="Get notified when a client completes onboarding"
                checked={preferences.clientCompleted}
                onChange={(checked) => updatePreferences({ clientCompleted: checked })}
              />

              <NotificationToggle
                label="Mentions"
                description="Get notified when someone mentions you"
                checked={preferences.mentions}
                onChange={(checked) => updatePreferences({ mentions: checked })}
              />

              <NotificationToggle
                label="Automations"
                description="Get notified when automations are triggered"
                checked={preferences.automations}
                onChange={(checked) => updatePreferences({ automations: checked })}
              />

              <NotificationToggle
                label="Contract Renewal Alerts"
                description="Get notified as client contracts approach renewal"
                checked={preferences.contractRenewal}
                onChange={(checked) => updatePreferences({ contractRenewal: checked })}
              />

              {preferences.contractRenewal && (
                <div className="ml-8 space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Alert me at:</p>
                  {([90, 60, 30, 14, 7] as const).map(days => (
                    <label key={days} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(preferences.contractRenewalDays ?? []).includes(days)}
                        onChange={(e) => {
                          const current = preferences.contractRenewalDays ?? [];
                          const next = e.target.checked
                            ? [...current, days].sort((a, b) => b - a)
                            : current.filter(d => d !== days);
                          updatePreferences({ contractRenewalDays: next });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{days} days before renewal</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Display Settings */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Display Settings
              </h4>

              <NotificationToggle
                label="Show Badge"
                description="Show unread count on the notification bell"
                checked={preferences.showBadge}
                onChange={(checked) => updatePreferences({ showBadge: checked })}
              />

              <NotificationToggle
                label="Play Sound"
                description="Play a sound for new notifications"
                checked={preferences.playSound}
                onChange={(checked) => updatePreferences({ playSound: checked })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function NotificationToggle({ label, description, checked, onChange }: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
