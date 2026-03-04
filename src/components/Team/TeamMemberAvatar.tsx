import type { TeamMember } from '../../types';

interface TeamMemberAvatarProps {
  member: TeamMember | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export function TeamMemberAvatar({
  member,
  size = 'md',
  showName = false,
  showTooltip = true,
  className = '',
}: TeamMemberAvatarProps) {
  if (!member) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 ${className}`}
        title={showTooltip ? 'Unassigned' : undefined}
      >
        ?
      </div>
    );
  }

  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {member.avatar ? (
        <img
          src={member.avatar}
          alt={member.name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          title={showTooltip ? member.name : undefined}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium`}
          style={{ backgroundColor: member.color }}
          title={showTooltip ? member.name : undefined}
        >
          {initials}
        </div>
      )}
      {showName && (
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {member.name}
        </span>
      )}
    </div>
  );
}

interface TeamMemberAvatarGroupProps {
  members: TeamMember[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function TeamMemberAvatarGroup({ members, max = 4, size = 'sm' }: TeamMemberAvatarGroupProps) {
  const displayed = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className="flex -space-x-2">
      {displayed.map(member => (
        <div key={member.id} className="ring-2 ring-white dark:ring-gray-800 rounded-full">
          <TeamMemberAvatar member={member} size={size} showTooltip />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium ring-2 ring-white dark:ring-gray-800`}
          title={`${remaining} more`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
