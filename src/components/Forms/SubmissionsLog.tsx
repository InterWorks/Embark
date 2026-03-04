import type { FormSubmission, OnboardingForm } from '../../types';

interface SubmissionsLogProps {
  form: OnboardingForm;
  submissions: FormSubmission[];
  onSelectClient?: (clientId: string) => void;
}

export function SubmissionsLog({ form, submissions, onSelectClient }: SubmissionsLogProps) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium">No submissions yet</p>
        <p className="text-xs mt-1">Share the form link to start receiving submissions</p>
      </div>
    );
  }

  return (
    <div className="glass-subtle rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Submitted</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Client</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data Preview</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {submissions.slice().reverse().map(sub => {
            const nameField = form.fields.find(f => f.mapsTo === 'name' || f.label.toLowerCase().includes('name'));
            const displayName = nameField ? String(sub.data[nameField.id] ?? '') : `Submission ${sub.id.slice(-6)}`;
            const preview = Object.values(sub.data).slice(0, 2).map(v => String(v)).join(' · ');

            return (
              <tr key={sub.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{displayName}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{preview}</td>
                <td className="px-4 py-3">
                  {onSelectClient && (
                    <button
                      onClick={() => onSelectClient(sub.clientId)}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                    >
                      View Client →
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
