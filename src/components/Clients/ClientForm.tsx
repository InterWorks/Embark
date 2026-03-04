import { useState, useEffect, type FormEvent } from 'react';
import type { Client, ClientFormData, Priority, ClientAssignment, ClientContact, TeamMember, AssignmentRole } from '../../types';
import { useTeam } from '../../hooks/useTeam';
import { useAssignmentRoles } from '../../hooks/useAssignmentRoles';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Modal } from '../UI/Modal';
import { TeamMemberAvatar } from '../Team/TeamMemberAvatar';
import { generateId } from '../../utils/helpers';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => void;
  initialData?: Client;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'none', label: 'None' },
];

interface AssignmentEntry {
  id: string;
  memberId: string;
  roleId: string;
  isPrimary: boolean;
}

interface ContactEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  isPrimary: boolean;
}

export function ClientForm({ isOpen, onClose, onSubmit, initialData }: ClientFormProps) {
  const { members, assignableMembers } = useTeam();
  const { roles, defaultRoles } = useAssignmentRoles();

  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as Client['status'],
    priority: 'none' as Priority,
  });

  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [assignments, setAssignments] = useState<AssignmentEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        status: initialData.status,
        priority: initialData.priority || 'none',
      });

      // Load existing contacts or convert legacy email/phone
      if (initialData.contacts && initialData.contacts.length > 0) {
        setContacts(
          initialData.contacts.map((c) => ({
            id: generateId(),
            name: c.name,
            email: c.email,
            phone: c.phone || '',
            title: c.title || '',
            isPrimary: c.isPrimary || false,
          }))
        );
      } else if (initialData.email) {
        // Convert legacy single email/phone to contact
        setContacts([
          {
            id: generateId(),
            name: '',
            email: initialData.email,
            phone: initialData.phone || '',
            title: '',
            isPrimary: true,
          },
        ]);
      } else {
        setContacts([]);
      }

      // Load existing assignments or convert legacy assignedTo
      if (initialData.assignments && initialData.assignments.length > 0) {
        setAssignments(
          initialData.assignments.map((a) => ({
            id: generateId(),
            memberId: a.memberId,
            roleId: a.roleId,
            isPrimary: a.isPrimary || false,
          }))
        );
      } else if (initialData.assignedTo) {
        const member = members.find(
          (m) => m.name.toLowerCase() === initialData.assignedTo.toLowerCase()
        );
        if (member && defaultRoles.length > 0) {
          setAssignments([
            {
              id: generateId(),
              memberId: member.id,
              roleId: defaultRoles[0].id,
              isPrimary: true,
            },
          ]);
        }
      }
    } else {
      setFormData({
        name: '',
        status: 'active',
        priority: 'none',
      });
      setContacts([]);
      setAssignments([]);
    }
    setErrors({});
  }, [initialData, isOpen, members, defaultRoles]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    // Require at least one contact
    if (contacts.length === 0) {
      newErrors.contacts = 'Please add at least one contact';
    } else {
      // Validate each contact has name and email
      const invalidContact = contacts.find((c) => !c.name.trim() || !c.email.trim());
      if (invalidContact) {
        newErrors.contacts = 'Each contact needs a name and email';
      } else {
        // Validate email format
        const invalidEmail = contacts.find((c) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
        if (invalidEmail) {
          newErrors.contacts = 'Please enter valid email addresses';
        }
      }
    }

    // Require at least one assignment if team members exist
    if (assignableMembers.length > 0 && assignments.length === 0) {
      newErrors.assignments = 'Please assign at least one team member';
    }

    // Validate each assignment has both member and role
    const invalidAssignment = assignments.find((a) => !a.memberId || !a.roleId);
    if (invalidAssignment) {
      newErrors.assignments = 'Each assignment needs both a team member and role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Build contacts for submission
      const clientContacts: ClientContact[] = contacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || undefined,
        title: c.title || undefined,
        isPrimary: c.isPrimary,
        createdAt: new Date().toISOString(),
      }));

      // Build assignments for submission
      const primaryAssignment = assignments.find((a) => a.isPrimary) || assignments[0];
      const primaryMember = primaryAssignment
        ? members.find((m) => m.id === primaryAssignment.memberId)
        : null;

      const clientAssignments: ClientAssignment[] = assignments.map((a) => ({
        memberId: a.memberId,
        roleId: a.roleId,
        assignedAt: new Date().toISOString(),
        isPrimary: a.isPrimary,
      }));

      // Get primary contact for legacy fields
      const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

      const submitData: ClientFormData = {
        name: formData.name,
        email: primaryContact?.email || '', // Legacy field
        phone: primaryContact?.phone || '', // Legacy field
        contacts: clientContacts,
        status: formData.status,
        priority: formData.priority,
        assignedTo: primaryMember?.name || '', // Legacy field
        assignments: clientAssignments,
      };

      onSubmit(submitData);
      onClose();
    }
  };

  // Contact management
  const addContact = () => {
    const newContact: ContactEntry = {
      id: generateId(),
      name: '',
      email: '',
      phone: '',
      title: '',
      isPrimary: contacts.length === 0,
    };
    setContacts((prev) => [...prev, newContact]);
    if (errors.contacts) {
      setErrors((prev) => ({ ...prev, contacts: '' }));
    }
  };

  const updateContact = (id: string, updates: Partial<ContactEntry>) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    if (errors.contacts) {
      setErrors((prev) => ({ ...prev, contacts: '' }));
    }
  };

  const removeContact = (id: string) => {
    setContacts((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length > 0 && !filtered.some((c) => c.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimaryContact = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => ({ ...c, isPrimary: c.id === id }))
    );
  };

  // Assignment management
  const addAssignment = () => {
    const newAssignment: AssignmentEntry = {
      id: generateId(),
      memberId: '',
      roleId: defaultRoles[0]?.id || roles[0]?.id || '',
      isPrimary: assignments.length === 0,
    };
    setAssignments((prev) => [...prev, newAssignment]);
    if (errors.assignments) {
      setErrors((prev) => ({ ...prev, assignments: '' }));
    }
  };

  const updateAssignment = (id: string, updates: Partial<AssignmentEntry>) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    if (errors.assignments) {
      setErrors((prev) => ({ ...prev, assignments: '' }));
    }
  };

  const removeAssignment = (id: string) => {
    setAssignments((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (filtered.length > 0 && !filtered.some((a) => a.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimaryAssignment = (id: string) => {
    setAssignments((prev) =>
      prev.map((a) => ({ ...a, isPrimary: a.id === id }))
    );
  };

  const getAvailableMembers = (currentAssignmentId: string) => {
    const usedMemberIds = assignments
      .filter((a) => a.id !== currentAssignmentId)
      .map((a) => a.memberId);
    return assignableMembers.filter((m) => !usedMemberIds.includes(m.id));
  };

  const hasTeamMembers = assignableMembers.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Client' : 'Add New Client'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Client / Company Name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Enter client or company name"
          error={errors.name}
          autoFocus
        />

        {/* Client Contacts Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Client Contacts
            </label>
            <button
              type="button"
              onClick={addContact}
              className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Contact
            </button>
          </div>

          {contacts.length === 0 ? (
            <button
              type="button"
              onClick={addContact}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium">Add a Point of Contact</span>
                <span className="text-xs text-gray-400">e.g., CTO, Project Manager, Decision Maker</span>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  onUpdate={(updates) => updateContact(contact.id, updates)}
                  onRemove={() => removeContact(contact.id)}
                  onSetPrimary={() => setPrimaryContact(contact.id)}
                  showPrimaryOption={contacts.length > 1}
                />
              ))}
            </div>
          )}

          {errors.contacts && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contacts}</p>
          )}
        </div>

        {/* Team Assignments Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Team Assignments
            </label>
            {hasTeamMembers && (
              <button
                type="button"
                onClick={addAssignment}
                className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Assignment
              </button>
            )}
          </div>

          {!hasTeamMembers ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                No team members available. Add team members in the{' '}
                <span className="font-medium">Team</span> section first to assign them to clients.
              </p>
            </div>
          ) : assignments.length === 0 ? (
            <button
              type="button"
              onClick={addAssignment}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="text-sm font-medium">Add Team Assignment</span>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  availableMembers={getAvailableMembers(assignment.id)}
                  allMembers={members}
                  roles={roles}
                  onUpdate={(updates) => updateAssignment(assignment.id, updates)}
                  onRemove={() => removeAssignment(assignment.id)}
                  onSetPrimary={() => setPrimaryAssignment(assignment.id)}
                  showPrimaryOption={assignments.length > 1}
                />
              ))}
            </div>
          )}

          {errors.assignments && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assignments}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as Client['status'] }))}
            options={statusOptions}
          />

          <Select
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as Priority }))}
            options={priorityOptions}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Save Changes' : 'Add Client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Contact Row Component
interface ContactRowProps {
  contact: ContactEntry;
  onUpdate: (updates: Partial<ContactEntry>) => void;
  onRemove: () => void;
  onSetPrimary: () => void;
  showPrimaryOption: boolean;
}

function ContactRow({
  contact,
  onUpdate,
  onRemove,
  onSetPrimary,
  showPrimaryOption,
}: ContactRowProps) {
  return (
    <div className={`p-3 rounded-lg border ${contact.isPrimary ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}>
      <div className="space-y-3">
        {/* Name and Title Row */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-medium">
              {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={contact.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Contact name *"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 placeholder-gray-400"
            />
            <input
              type="text"
              value={contact.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Title (e.g., CTO, PM)"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 placeholder-gray-400"
            />
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1">
            {showPrimaryOption && !contact.isPrimary && (
              <button
                type="button"
                onClick={onSetPrimary}
                className="p-1.5 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 rounded"
                title="Set as primary contact"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
              title="Remove contact"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Email and Phone Row */}
        <div className="grid grid-cols-2 gap-2 pl-13">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              type="email"
              value={contact.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="Email address *"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 placeholder-gray-400"
            />
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              placeholder="Phone number"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Primary badge */}
        {contact.isPrimary && (
          <div className="pl-13">
            <span className="px-2 py-0.5 text-xs font-medium bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full">
              Primary Contact
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Assignment Row Component
interface AssignmentRowProps {
  assignment: AssignmentEntry;
  availableMembers: TeamMember[];
  allMembers: TeamMember[];
  roles: AssignmentRole[];
  onUpdate: (updates: Partial<AssignmentEntry>) => void;
  onRemove: () => void;
  onSetPrimary: () => void;
  showPrimaryOption: boolean;
}

function AssignmentRow({
  assignment,
  availableMembers,
  allMembers,
  roles,
  onUpdate,
  onRemove,
  onSetPrimary,
  showPrimaryOption,
}: AssignmentRowProps) {
  const selectedMember = allMembers.find((m) => m.id === assignment.memberId);
  const selectedRole = roles.find((r) => r.id === assignment.roleId);

  const memberOptions = assignment.memberId
    ? [
        ...availableMembers,
        ...allMembers.filter((m) => m.id === assignment.memberId && !availableMembers.includes(m)),
      ]
    : availableMembers;

  return (
    <div className={`p-3 rounded-lg border ${assignment.isPrimary ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-1">
          {selectedMember ? (
            <TeamMemberAvatar member={selectedMember} size="md" showTooltip={false} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={assignment.memberId}
              onChange={(e) => onUpdate({ memberId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select team member...</option>
              {memberOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.jobTitle ? ` (${member.jobTitle})` : ''}
                </option>
              ))}
            </select>

            <select
              value={assignment.roleId}
              onChange={(e) => onUpdate({ roleId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select role...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {assignment.isPrimary && (
                <span className="px-2 py-0.5 text-xs font-medium bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full">
                  Primary
                </span>
              )}
              {selectedRole?.description && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedRole.description}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {showPrimaryOption && !assignment.isPrimary && (
            <button
              type="button"
              onClick={onSetPrimary}
              className="p-1.5 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 rounded"
              title="Set as primary"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
            title="Remove assignment"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
