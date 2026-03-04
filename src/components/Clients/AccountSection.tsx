import { useState } from 'react';
import type { LifecycleStage, AccountInfo } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { useNotifications } from '../../hooks/useNotifications';

interface AccountSectionProps {
  clientId: string;
  lifecycleStage?: LifecycleStage;
  account?: AccountInfo;
}

const STAGE_COLORS: Record<LifecycleStage, string> = {
  'onboarding':    'bg-blue-100 text-blue-700 border-blue-300',
  'active-client': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'at-risk':       'bg-red-100 text-red-700 border-red-300',
  'churned':       'bg-zinc-100 text-zinc-500 border-zinc-300',
};

const STAGE_LABELS: Record<LifecycleStage, string> = {
  'onboarding':    'Onboarding',
  'active-client': 'Active Client',
  'at-risk':       'At Risk',
  'churned':       'Churned',
};

const STAGES: LifecycleStage[] = ['onboarding', 'active-client', 'at-risk', 'churned'];

function formatCents(cents: number | undefined): string {
  if (cents == null) return '';
  return (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function parseDollars(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  return Math.round(parseFloat(cleaned) * 100) || 0;
}

function daysUntil(isoDate: string): number {
  return Math.floor((new Date(isoDate).getTime() - Date.now()) / 86400000);
}

interface InlineFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
  prefix?: string;
}

function InlineField({ label, value, placeholder, onSave, prefix }: InlineFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleBlur = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm text-gray-500">{prefix}</span>}
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBlur();
              if (e.key === 'Escape') { setEditing(false); setDraft(value); }
            }}
            className="text-sm border border-blue-400 rounded px-1.5 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      ) : (
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="text-sm text-left text-gray-900 dark:text-gray-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded px-1.5 py-0.5 transition-colors min-h-[26px]"
        >
          {value ? (
            <>
              {prefix && <span className="text-gray-500">{prefix}</span>}
              {value}
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 italic">{placeholder ?? 'Click to edit'}</span>
          )}
        </button>
      )}
    </div>
  );
}

export function AccountSection({ clientId, lifecycleStage, account }: AccountSectionProps) {
  const { updateLifecycleStage, updateAccountInfo } = useClientContext();
  const { preferences } = useNotifications();
  const stage: LifecycleStage = lifecycleStage ?? 'onboarding';

  const renewalDays = account?.renewalDate ? daysUntil(account.renewalDate) : null;
  const maxThreshold = Math.max(...(preferences.contractRenewalDays ?? [30]));
  const showRenewalBanner = renewalDays !== null && renewalDays >= 0 && renewalDays <= maxThreshold;

  return (
    <div className="glass-card p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Account
      </h3>

      {/* Renewal Alert Banner */}
      {showRenewalBanner && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 rounded-[4px] text-sm text-yellow-800 dark:text-yellow-300">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            Renewal {renewalDays === 0 ? 'today' : `in ${renewalDays} day${renewalDays === 1 ? '' : 's'}`}
            {account?.renewalDate && ` — ${new Date(account.renewalDate).toLocaleDateString()}`}
          </span>
        </div>
      )}

      {/* Lifecycle Stage Selector */}
      <div>
        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5">Lifecycle Stage</span>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => updateLifecycleStage(clientId, s)}
              className={`px-2.5 py-0.5 text-xs font-bold rounded-[4px] border transition-all ${
                stage === s
                  ? `${STAGE_COLORS[s]} shadow-[2px_2px_0_0_rgba(0,0,0,0.15)]`
                  : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border-zinc-200 dark:border-zinc-600 hover:border-zinc-400'
              }`}
            >
              {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Account Info Fields */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <InlineField
          label="MRR"
          value={formatCents(account?.mrr)}
          placeholder="0"
          prefix="$"
          onSave={(val) => updateAccountInfo(clientId, { mrr: parseDollars(val) })}
        />
        <InlineField
          label="Contract Value"
          value={formatCents(account?.contractValue)}
          placeholder="0"
          prefix="$"
          onSave={(val) => updateAccountInfo(clientId, { contractValue: parseDollars(val) })}
        />
        <InlineField
          label="Renewal Date"
          value={account?.renewalDate ?? ''}
          placeholder="YYYY-MM-DD"
          onSave={(val) => updateAccountInfo(clientId, { renewalDate: val || undefined })}
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Billing Cycle</span>
          <select
            value={account?.billingCycle ?? ''}
            onChange={(e) => updateAccountInfo(clientId, {
              billingCycle: (e.target.value as AccountInfo['billingCycle']) || undefined,
            })}
            className="text-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-600 rounded px-1.5 py-0.5 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 cursor-pointer"
          >
            <option value="">—</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <InlineField
          label="Contract Start"
          value={account?.contractStartDate ?? ''}
          placeholder="YYYY-MM-DD"
          onSave={(val) => updateAccountInfo(clientId, { contractStartDate: val || undefined })}
        />
        <InlineField
          label="NPS Score"
          value={account?.npsScore != null ? String(account.npsScore) : ''}
          placeholder="0–10"
          onSave={(val) => {
            const n = parseInt(val);
            updateAccountInfo(clientId, { npsScore: !isNaN(n) ? Math.min(10, Math.max(0, n)) : undefined });
          }}
        />
        <InlineField
          label="Industry"
          value={account?.industry ?? ''}
          placeholder="e.g. SaaS"
          onSave={(val) => updateAccountInfo(clientId, { industry: val || undefined })}
        />
        <InlineField
          label="Website"
          value={account?.website ?? ''}
          placeholder="example.com"
          onSave={(val) => updateAccountInfo(clientId, { website: val || undefined })}
        />
      </div>
    </div>
  );
}
