import { useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { TeamMember, TeamRole, Team, TeamSettings } from '../types';

const TEAM_COLORS = [
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
];

// Migration: Check for old single-team format and convert
function migrateFromOldFormat(): Team[] | null {
  const oldData = localStorage.getItem('embark-team');
  const newData = localStorage.getItem('embark-teams');

  // Only migrate if old data exists and new data doesn't
  if (oldData && !newData) {
    try {
      const oldTeam: TeamSettings = JSON.parse(oldData);
      const migratedTeam: Team = {
        id: crypto.randomUUID(),
        name: oldTeam.teamName || 'My Team',
        members: oldTeam.members || [],
        createdAt: new Date().toISOString(),
      };
      return [migratedTeam];
    } catch {
      return null;
    }
  }
  return null;
}

export function useTeam() {
  // Check for migration on initial load
  const migratedTeams = useMemo(() => migrateFromOldFormat(), []);

  const [teams, setTeams] = useLocalStorage<Team[]>('embark-teams', migratedTeams || []);
  const [selectedTeamId, setSelectedTeamId] = useLocalStorage<string | null>('embark-selected-team', null);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>('embark-current-user', null);

  // If we migrated and haven't selected a team, select the migrated one
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId, setSelectedTeamId]);

  // Get selected team
  const selectedTeam = useMemo(() => {
    if (!selectedTeamId) return teams[0] || null;
    return teams.find(t => t.id === selectedTeamId) || teams[0] || null;
  }, [teams, selectedTeamId]);

  // Get members for selected team
  const members = useMemo(() => {
    return selectedTeam?.members || [];
  }, [selectedTeam]);

  // Get all members across all teams (for currentUser lookup)
  const allMembers = useMemo(() => {
    return teams.flatMap(t => t.members);
  }, [teams]);

  // Get next available color for the selected team
  const getNextColor = useCallback(() => {
    const usedColors = members.map(m => m.color);
    const availableColor = TEAM_COLORS.find(c => !usedColors.includes(c));
    return availableColor || TEAM_COLORS[members.length % TEAM_COLORS.length];
  }, [members]);

  // ============ TEAM OPERATIONS ============

  // Create a new team
  const createTeam = useCallback((name: string): Team => {
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: name.trim() || 'New Team',
      members: [],
      createdAt: new Date().toISOString(),
    };

    setTeams(prev => [...prev, newTeam]);
    setSelectedTeamId(newTeam.id);
    return newTeam;
  }, [setTeams, setSelectedTeamId]);

  // Update a team
  const updateTeam = useCallback((teamId: string, updates: { name?: string }) => {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, ...updates } : t
    ));
  }, [setTeams]);

  // Delete a team
  const deleteTeam = useCallback((teamId: string) => {
    setTeams(prev => {
      const filtered = prev.filter(t => t.id !== teamId);
      // If we deleted the selected team, select another one
      if (selectedTeamId === teamId && filtered.length > 0) {
        setSelectedTeamId(filtered[0].id);
      }
      return filtered;
    });
  }, [setTeams, selectedTeamId, setSelectedTeamId]);

  // Select a team
  const selectTeam = useCallback((teamId: string) => {
    if (teams.some(t => t.id === teamId)) {
      setSelectedTeamId(teamId);
    }
  }, [teams, setSelectedTeamId]);

  // ============ MEMBER OPERATIONS (scoped to selected team) ============

  // Add a team member to selected team
  const addMember = useCallback((member: Omit<TeamMember, 'id' | 'createdAt' | 'color'>) => {
    if (!selectedTeam) return null;

    const newMember: TeamMember = {
      ...member,
      id: crypto.randomUUID(),
      color: getNextColor(),
      createdAt: new Date().toISOString(),
    };

    setTeams(prev => prev.map(t =>
      t.id === selectedTeam.id
        ? { ...t, members: [...t.members, newMember] }
        : t
    ));

    // If this is the first member in any team, set them as current user
    if (allMembers.length === 0) {
      setCurrentUserId(newMember.id);
    }

    return newMember;
  }, [selectedTeam, getNextColor, setTeams, allMembers.length, setCurrentUserId]);

  // Update a team member in selected team
  const updateMember = useCallback((memberId: string, updates: Partial<Omit<TeamMember, 'id' | 'createdAt'>>) => {
    if (!selectedTeam) return;

    setTeams(prev => prev.map(t =>
      t.id === selectedTeam.id
        ? {
            ...t,
            members: t.members.map(m =>
              m.id === memberId ? { ...m, ...updates } : m
            ),
          }
        : t
    ));
  }, [selectedTeam, setTeams]);

  // Remove a team member from selected team
  const removeMember = useCallback((memberId: string) => {
    if (!selectedTeam) return;

    setTeams(prev => prev.map(t =>
      t.id === selectedTeam.id
        ? { ...t, members: t.members.filter(m => m.id !== memberId) }
        : t
    ));

    // If removing the current user, clear the current user
    if (currentUserId === memberId) {
      setCurrentUserId(null);
    }
  }, [selectedTeam, setTeams, currentUserId, setCurrentUserId]);

  // Get member by ID (from selected team)
  const getMember = useCallback((memberId: string) => {
    return members.find(m => m.id === memberId);
  }, [members]);

  // Get member by ID from any team
  const getMemberFromAnyTeam = useCallback((memberId: string) => {
    return allMembers.find(m => m.id === memberId);
  }, [allMembers]);

  // Get member by email (from selected team)
  const getMemberByEmail = useCallback((email: string) => {
    return members.find(m => m.email.toLowerCase() === email.toLowerCase());
  }, [members]);

  // Get members by role (from selected team)
  const getMembersByRole = useCallback((role: TeamRole) => {
    return members.filter(m => m.role === role);
  }, [members]);

  // ============ CURRENT USER ============

  // Get current user (can be from any team)
  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return allMembers.find(m => m.id === currentUserId) || null;
  }, [currentUserId, allMembers]);

  // Set current user
  const setCurrentUser = useCallback((memberId: string) => {
    if (allMembers.some(m => m.id === memberId)) {
      setCurrentUserId(memberId);
    }
  }, [allMembers, setCurrentUserId]);

  // Check if user has permission (owner > admin > member > viewer)
  const hasPermission = useCallback((requiredRole: TeamRole): boolean => {
    if (!currentUser) return false;

    const roleHierarchy: Record<TeamRole, number> = {
      owner: 4,
      admin: 3,
      member: 2,
      viewer: 1,
    };

    return roleHierarchy[currentUser.role] >= roleHierarchy[requiredRole];
  }, [currentUser]);

  // Update last active time for current user
  const updateActivity = useCallback(() => {
    if (!currentUserId || !currentUser) return;

    // Find which team the current user is in and update there
    setTeams(prev => prev.map(t => ({
      ...t,
      members: t.members.map(m =>
        m.id === currentUserId
          ? { ...m, lastActiveAt: new Date().toISOString() }
          : m
      ),
    })));
  }, [currentUserId, currentUser, setTeams]);

  // Get assignable members (for task assignment - excludes viewers, from all teams)
  const assignableMembers = useMemo(() => {
    return allMembers.filter(m => m.role !== 'viewer');
  }, [allMembers]);

  // ============ LEGACY COMPATIBILITY ============

  // Legacy: team name (returns selected team name)
  const teamName = selectedTeam?.name || 'My Team';

  // Legacy: update team name (updates selected team)
  const updateTeamName = useCallback((name: string) => {
    if (selectedTeam) {
      updateTeam(selectedTeam.id, { name });
    }
  }, [selectedTeam, updateTeam]);

  return {
    // Teams
    teams,
    selectedTeam,
    selectedTeamId,
    selectTeam,
    createTeam,
    updateTeam,
    deleteTeam,

    // Legacy team name (for backward compat)
    teamName,
    updateTeamName,

    // Members (scoped to selected team)
    members,
    assignableMembers,
    allMembers,
    addMember,
    updateMember,
    removeMember,
    getMember,
    getMemberFromAnyTeam,
    getMemberByEmail,
    getMembersByRole,

    // Current user (global)
    currentUser,
    currentUserId,
    setCurrentUser,
    hasPermission,
    updateActivity,

    // Utilities
    teamColors: TEAM_COLORS,
  };
}
