import { useMemo, useState } from 'react';
import { useTeam } from '../../hooks/useTeam';
import { useClientContext } from '../../context/ClientContext';
import type { TeamMember } from '../../types';

const DEFAULT_CAPACITY_LIMIT = 5;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function CapacityBar({ pct, color }: { pct: number; color: 'green' | 'yellow' | 'red' }) {
  const colorClass =
    color === 'green'
      ? 'bg-emerald-500'
      : color === 'yellow'
      ? 'bg-amber-400'
      : 'bg-red-500';

  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function getBarColor(pct: number): 'green' | 'yellow' | 'red' {
  if (pct >= 90) return 'red';
  if (pct >= 70) return 'yellow';
  return 'green';
}

interface MemberCapacityData {
  member: TeamMember;
  activeClientCount: number;
  openTaskCount: number;
  capacityLimit: number;
  capacityPct: number;
  headroom: number;
  estimatedHours: number | null;
}

export function CapacityView() {
  const { members, updateMember } = useTeam();
  const { clients } = useClientContext();

  // Local state for inline capacity limit edits (memberID -> draft value string)
  const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({});

  const memberData: MemberCapacityData[] = useMemo(() => {
    return members.map((member) => {
      // Active (non-archived) clients assigned to this member
      const assignedClients = clients.filter((c) => {
        if (c.archived) return false;
        // New multi-assignment system
        const inAssignments = c.assignments?.some((a) => a.memberId === member.id);
        // Legacy system
        const isLegacy = c.assignedTo === member.name;
        return inAssignments || isLegacy;
      });

      const activeClientCount = assignedClients.length;

      // Count open (incomplete) tasks across assigned clients
      const openTaskCount = assignedClients.reduce((sum, c) => {
        return sum + c.checklist.filter((t) => !t.completed).length;
      }, 0);

      // Sum estimated hours from time entries if present
      let totalMinutes = 0;
      let hasTimeData = false;
      assignedClients.forEach((c) => {
        c.checklist.forEach((task) => {
          if (task.timeEntries && task.timeEntries.length > 0) {
            hasTimeData = true;
            task.timeEntries.forEach((entry) => {
              totalMinutes += entry.duration;
            });
          }
        });
      });
      const estimatedHours = hasTimeData ? Math.round((totalMinutes / 60) * 10) / 10 : null;

      const capacityLimit = member.capacityLimit ?? DEFAULT_CAPACITY_LIMIT;
      const capacityPct = capacityLimit > 0 ? (activeClientCount / capacityLimit) * 100 : 0;
      const headroom = Math.max(0, capacityLimit - activeClientCount);

      return {
        member,
        activeClientCount,
        openTaskCount,
        capacityLimit,
        capacityPct,
        headroom,
        estimatedHours,
      };
    });
  }, [members, clients]);

  // Determine the recommended member: most headroom (ties broken by fewest open tasks)
  const recommendedId = useMemo(() => {
    if (memberData.length === 0) return null;
    const sorted = [...memberData].sort((a, b) => {
      if (b.headroom !== a.headroom) return b.headroom - a.headroom;
      return a.openTaskCount - b.openTaskCount;
    });
    return sorted[0].headroom > 0 ? sorted[0].member.id : null;
  }, [memberData]);

  // Summary totals
  const totalCapacity = memberData.reduce((s, d) => s + d.capacityLimit, 0);
  const totalUsed = memberData.reduce((s, d) => s + d.activeClientCount, 0);
  const totalAvailable = Math.max(0, totalCapacity - totalUsed);
  const overallPct = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

  const handleLimitChange = (memberId: string, value: string) => {
    setLimitDrafts((prev) => ({ ...prev, [memberId]: value }));
  };

  const handleLimitCommit = (memberId: string) => {
    const raw = limitDrafts[memberId];
    if (raw === undefined) return;
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      updateMember(memberId, { capacityLimit: parsed });
    }
    setLimitDrafts((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  };

  const handleLimitKeyDown = (memberId: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLimitCommit(memberId);
    if (e.key === 'Escape') {
      setLimitDrafts((prev) => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Capacity</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Monitor workload and plan new client assignments
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Total Capacity Used
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalUsed}
            <span className="text-base font-normal text-gray-400 dark:text-gray-500">
              {' '}/ {totalCapacity}
            </span>
          </p>
          <div className="mt-2">
            <CapacityBar pct={overallPct} color={getBarColor(overallPct)} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {Math.round(overallPct)}% of team capacity
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Available Slots
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {totalAvailable}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            client slots open across {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Recommended Assignee
          </p>
          {recommendedId ? (
            (() => {
              const rec = memberData.find((d) => d.member.id === recommendedId);
              return rec ? (
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: rec.member.color }}
                  >
                    {getInitials(rec.member.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {rec.member.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {rec.headroom} slot{rec.headroom !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
              ) : null;
            })()
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No capacity available</p>
          )}
        </div>
      </div>

      {/* Member Cards */}
      {members.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No team members yet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Add members in the Team Members tab to view capacity.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {memberData.map((data) => {
            const { member, activeClientCount, openTaskCount, capacityLimit, capacityPct, headroom, estimatedHours } = data;
            const barColor = getBarColor(capacityPct);
            const isRecommended = member.id === recommendedId;
            const draftValue = limitDrafts[member.id];
            const displayLimit = draftValue !== undefined ? draftValue : String(capacityLimit);

            return (
              <div
                key={member.id}
                className={`glass-card p-5 relative transition-shadow ${
                  isRecommended ? 'ring-2 ring-emerald-400 dark:ring-emerald-500' : ''
                }`}
              >
                {isRecommended && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Recommended
                  </span>
                )}

                {/* Member Identity */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{member.name}</p>
                    {member.jobTitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.jobTitle}</p>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Active Clients</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {activeClientCount}
                      <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                        /{capacityLimit}
                      </span>
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Open Tasks</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{openTaskCount}</p>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Capacity</span>
                    <span
                      className={`text-xs font-semibold ${
                        barColor === 'red'
                          ? 'text-red-600 dark:text-red-400'
                          : barColor === 'yellow'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {Math.round(capacityPct)}%
                    </span>
                  </div>
                  <CapacityBar pct={capacityPct} color={barColor} />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {headroom > 0
                      ? `${headroom} slot${headroom !== 1 ? 's' : ''} available`
                      : 'At or over capacity'}
                  </p>
                </div>

                {/* Estimated Hours (if time data exists) */}
                {estimatedHours !== null && (
                  <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{estimatedHours}h logged across active clients</span>
                  </div>
                )}

                {/* Capacity Limit Setter */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <label
                    htmlFor={`cap-limit-${member.id}`}
                    className="text-xs text-gray-500 dark:text-gray-400 flex-1"
                  >
                    Capacity limit
                  </label>
                  <input
                    id={`cap-limit-${member.id}`}
                    type="number"
                    min={1}
                    max={99}
                    value={displayLimit}
                    onChange={(e) => handleLimitChange(member.id, e.target.value)}
                    onBlur={() => handleLimitCommit(member.id)}
                    onKeyDown={(e) => handleLimitKeyDown(member.id, e)}
                    className="w-16 text-center text-sm px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <span className="text-xs text-gray-400">clients</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
