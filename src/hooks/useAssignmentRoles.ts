import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { AssignmentRole } from '../types';
import { generateId } from '../utils/helpers';

const DEFAULT_ASSIGNMENT_ROLES: AssignmentRole[] = [
  {
    id: 'delivery-lead',
    name: 'Delivery Lead',
    description: 'Primary person responsible for delivering the project',
    color: '#8B5CF6',
    order: 0,
    isDefault: true,
  },
  {
    id: 'account-manager',
    name: 'Account Manager',
    description: 'Manages the client relationship',
    color: '#3B82F6',
    order: 1,
    isDefault: false,
  },
  {
    id: 'technical-account-manager',
    name: 'Technical Account Manager',
    description: 'Technical point of contact',
    color: '#10B981',
    order: 2,
    isDefault: false,
  },
  {
    id: 'project-manager',
    name: 'Project Manager',
    description: 'Oversees project timelines and deliverables',
    color: '#F59E0B',
    order: 3,
    isDefault: false,
  },
];

export function useAssignmentRoles() {
  const [roles, setRoles] = useLocalStorage<AssignmentRole[]>(
    'embark-assignment-roles',
    DEFAULT_ASSIGNMENT_ROLES
  );

  const addRole = useCallback((role: Omit<AssignmentRole, 'id' | 'order'>) => {
    const newRole: AssignmentRole = {
      ...role,
      id: generateId(),
      order: roles.length,
    };
    setRoles((prev) => [...prev, newRole]);
    return newRole;
  }, [roles.length, setRoles]);

  const updateRole = useCallback((roleId: string, updates: Partial<Omit<AssignmentRole, 'id'>>) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId ? { ...role, ...updates } : role
      )
    );
  }, [setRoles]);

  const deleteRole = useCallback((roleId: string) => {
    setRoles((prev) => prev.filter((role) => role.id !== roleId));
  }, [setRoles]);

  const reorderRoles = useCallback((reorderedRoles: AssignmentRole[]) => {
    setRoles(reorderedRoles.map((role, index) => ({ ...role, order: index })));
  }, [setRoles]);

  const getRole = useCallback((roleId: string) => {
    return roles.find((r) => r.id === roleId);
  }, [roles]);

  const getRoleByName = useCallback((name: string) => {
    return roles.find((r) => r.name.toLowerCase() === name.toLowerCase());
  }, [roles]);

  const defaultRoles = useMemo(() => roles.filter((r) => r.isDefault), [roles]);

  return {
    roles,
    defaultRoles,
    addRole,
    updateRole,
    deleteRole,
    reorderRoles,
    getRole,
    getRoleByName,
  };
}
