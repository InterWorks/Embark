import { useState } from 'react';
import { useClientContext } from '../../context/ClientContext';
import { useBranding } from '../../hooks/useBranding';

interface NPSSurveyViewProps {
  clientId: string;
}

function getNPSColor(score: number): string {
  if (score <= 6) {
    // Red to orange gradient across 0–6
    const hue = Math.round(0 + (score / 6) * 24); // 0 (red) → ~24 (orange)
    return `hsl(${hue}, 90%, 50%)`;
  }
  if (score <= 8) {
    // Yellow
    return 'hsl(45, 95%, 50%)';
  }
  // Green
  return 'hsl(142, 70%, 45%)';
}

function getNPSButtonClass(score: number, selected: number | null): string {
  const isSelected = selected === score;
  const base =
    'w-9 h-9 rounded-lg text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';

  if (isSelected) {
    return `${base} text-white shadow-md scale-110 ring-2 ring-offset-2 ring-white/50`;
  }
  if (score <= 6) {
    return `${base} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 border border-red-300 dark:border-red-700`;
  }
  if (score <= 8) {
    return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 border border-yellow-300 dark:border-yellow-700`;
  }
  return `${base} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 border border-green-300 dark:border-green-700`;
}

export function NPSSurveyView({ clientId }: NPSSurveyViewProps) {
  const { clients, updateClient, addCommunication } = useClientContext();
  const { branding } = useBranding();

  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const client = clients.find((c) => c.id === clientId);
  const companyName = branding.companyName || 'Embark';

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Survey not found</h2>
          <p className="text-gray-500 dark:text-gray-400">This survey link is not valid or has expired.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Thank you for your feedback!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your response has been recorded. We really appreciate you taking the time to share your thoughts.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (selectedScore === null) return;

    // Update client's NPS score via updateClient
    updateClient(clientId, {
      account: {
        ...(client.account ?? {}),
        npsScore: selectedScore,
      },
    });

    // Log a communication entry
    addCommunication(clientId, {
      type: 'note',
      subject: 'NPS Survey Response',
      content: `NPS Score: ${selectedScore}/10. Comment: ${comment.trim() || 'None'}`,
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700 w-full max-w-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          {branding.logoUrl && (
            <img
              src={branding.logoUrl}
              alt={companyName}
              className="h-10 mx-auto mb-4 object-contain"
            />
          )}
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {companyName}
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            How likely are you to recommend us?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Hi <span className="font-medium text-gray-700 dark:text-gray-300">{client.name}</span>, your feedback helps us improve.
          </p>
        </div>

        {/* NPS Scale */}
        <div className="mb-6">
          <div className="flex justify-between items-center gap-1 mb-2 flex-wrap">
            {Array.from({ length: 11 }, (_, i) => i).map((score) => (
              <button
                key={score}
                onClick={() => setSelectedScore(score)}
                className={getNPSButtonClass(score, selectedScore)}
                style={
                  selectedScore === score
                    ? { backgroundColor: getNPSColor(score) }
                    : {}
                }
                aria-label={`Score ${score}`}
                aria-pressed={selectedScore === score}
              >
                {score}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 px-1 mt-1">
            <span>Not at all likely</span>
            <span>Extremely likely</span>
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label
            htmlFor="nps-comment"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Tell us more <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            id="nps-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share any additional thoughts..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={selectedScore === null}
          className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          Submit Feedback
        </button>

        {selectedScore === null && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
            Please select a score above to continue.
          </p>
        )}
      </div>
    </div>
  );
}
