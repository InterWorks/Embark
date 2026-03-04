import { generateId } from '../../../utils/helpers';
import { useTeam } from '../../../hooks/useTeam';
import { useAssignmentRoles } from '../../../hooks/useAssignmentRoles';
import { TeamMemberAvatar } from '../../Team/TeamMemberAvatar';
import { Button } from '../../UI/Button';

export interface AssignmentEntry {
  id: string;
  memberId: string;
  roleId: string;
  isPrimary: boolean;
}

interface Step3Props {
  assignments: AssignmentEntry[];
  setAssignments: (v: AssignmentEntry[]) => void;
  error: string;
}

export function Step3Team({ assignments, setAssignments, error }: Step3Props) {
  const { assignableMembers } = useTeam();
  const { roles } = useAssignmentRoles();

  const addAssignment = () => {
    setAssignments([
      ...assignments,
      { id: generateId(), memberId: '', roleId: '', isPrimary: assignments.length === 0 },
    ]);
  };

  const updateAssignment = (id: string, field: 'memberId' | 'roleId', value: string) => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAssignment = (id: string) => {
    const next = assignments.filter(a => a.id !== id);
    if (next.length > 0 && !next.some(a => a.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    setAssignments(next);
  };

  const setPrimary = (id: string) => {
    setAssignments(assignments.map(a => ({ ...a, isPrimary: a.id === id })));
  };

  if (assignableMembers.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        No team members configured. You can assign team members later from the team settings.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Assign team members to this client.
        </p>
        <Button variant="ghost" size="sm" onClick={addAssignment} type="button">
          + Add Member
        </Button>
      </div>

      {assignments.length === 0 && (
        <p className="text-sm text-gray-400 italic">No assignments yet.</p>
      )}

      <div className="space-y-3">
        {assignments.map(assignment => {
          const member = assignableMembers.find(m => m.id === assignment.memberId);
          return (
            <div key={assignment.id} className="glass-subtle p-3 rounded-xl">
              <div className="flex items-center gap-3">
                {member && <TeamMemberAvatar member={member} size="sm" />}
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <select
                    value={assignment.memberId}
                    onChange={e => updateAssignment(assignment.id, 'memberId', e.target.value)}
                    className="text-sm border border-white/20 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white/50 dark:bg-white/5 text-gray-700 dark:text-gray-300"
                  >
                    <option value="">Select member...</option>
                    {assignableMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <select
                    value={assignment.roleId}
                    onChange={e => updateAssignment(assignment.id, 'roleId', e.target.value)}
                    className="text-sm border border-white/20 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white/50 dark:bg-white/5 text-gray-700 dark:text-gray-300"
                  >
                    <option value="">Select role...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrimary(assignment.id)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                      assignment.isPrimary
                        ? 'bg-violet-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-violet-100 dark:hover:bg-violet-900/40'
                    }`}
                  >
                    Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAssignment(assignment.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
