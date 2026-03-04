import { useState, useRef, useEffect } from 'react';
import { useTeam } from '../../hooks/useTeam';
import { TeamMemberAvatar } from './TeamMemberAvatar';
import type { TeamMember } from '../../types';

interface TeamMemberSelectorProps {
  value: string | null;
  onChange: (memberId: string | null) => void;
  placeholder?: string;
  allowUnassigned?: boolean;
  filter?: (member: TeamMember) => boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function TeamMemberSelector({
  value,
  onChange,
  placeholder = 'Assign to...',
  allowUnassigned = true,
  filter,
  size = 'md',
  className = '',
}: TeamMemberSelectorProps) {
  const { assignableMembers, getMember } = useTeam();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMember = value ? getMember(value) : null;

  const filteredMembers = assignableMembers
    .filter(m => !filter || filter(m))
    .filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (memberId: string | null) => {
    onChange(memberId);
    setIsOpen(false);
    setSearch('');
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2',
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 ${sizeClasses[size]} border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
      >
        {selectedMember ? (
          <>
            <TeamMemberAvatar member={selectedMember} size="sm" showTooltip={false} />
            <span className="flex-1 text-left truncate">{selectedMember.name}</span>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="flex-1 text-left text-gray-500 dark:text-gray-400">{placeholder}</span>
          </>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {allowUnassigned && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  !value ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
              </button>
            )}

            {filteredMembers.length === 0 ? (
              <div className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                {search ? 'No members found' : 'No team members yet'}
              </div>
            ) : (
              filteredMembers.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelect(member.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    value === member.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                  }`}
                >
                  <TeamMemberAvatar member={member} size="sm" showTooltip={false} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {member.jobTitle || member.email}
                    </div>
                  </div>
                  {value === member.id && (
                    <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
