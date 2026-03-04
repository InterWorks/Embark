# Client Contacts + Email Composer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Contacts management UI in ClientDetail and wire up the EmailComposer to open pre-filled from a contact's email address.

**Architecture:** One new component (`ContactsSection`), two small prop additions to `EmailComposer`, and two additions to `useClients` + `ClientContext` for contact CRUD. No new files beyond `ContactsSection`.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, localStorage via custom hook

---

## Task 1: Add contact CRUD to `useClients.ts`

**Files:**
- Modify: `src/hooks/useClients.ts` (add addContact, updateContact, removeContact)

**Step 1: Find the right location**

The `useClients.ts` file has CRUD operations for many sub-entities (milestones, communication log, etc). Find the communication log operations section (around line 780). Add the contact operations just before that section.

**Step 2: Add contact CRUD functions**

Insert before the communication log section:

```typescript
// Contact operations
const addContact = useCallback((clientId: string, contact: Omit<ClientContact, 'id' | 'createdAt'>) => {
  const newContact: ClientContact = {
    ...contact,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  setClients((prev) =>
    prev.map((c) =>
      c.id === clientId
        ? { ...c, contacts: [...(c.contacts ?? []), newContact] }
        : c
    )
  );
}, [setClients]);

const updateContact = useCallback((clientId: string, contactId: string, updates: Partial<Omit<ClientContact, 'id' | 'createdAt'>>) => {
  setClients((prev) =>
    prev.map((c) => {
      if (c.id !== clientId) return c;
      return {
        ...c,
        contacts: (c.contacts ?? []).map((ct) =>
          ct.id === contactId ? { ...ct, ...updates } : ct
        ),
      };
    })
  );
}, [setClients]);

const removeContact = useCallback((clientId: string, contactId: string) => {
  setClients((prev) =>
    prev.map((c) =>
      c.id !== clientId
        ? c
        : { ...c, contacts: (c.contacts ?? []).filter((ct) => ct.id !== contactId) }
    )
  );
}, [setClients]);
```

**Step 3: Add to the return object**

Find the return object at the end of `useClients` and add the three new functions:

```typescript
addContact,
updateContact,
removeContact,
```

**Step 4: Verify the import of `ClientContact`**

At the top of `useClients.ts`, ensure `ClientContact` is imported from `'../types'`. The import line already includes many types; just add `ClientContact` if missing:

```typescript
import type { Client, ChecklistItem, ..., ClientContact } from '../types';
```

**Step 5: Run build**

```bash
cd client-onboarding-tracker && npm run build
```
Expected: 0 TS errors.

---

## Task 2: Expose contact CRUD in `ClientContext.tsx`

**Files:**
- Modify: `src/context/ClientContext.tsx`

**Step 1: Add to the context interface**

In `src/context/ClientContext.tsx`, find the `ClientContextType` interface. Add the three contact operations. Look for a pattern similar to `addCommunication` around line 58:

```typescript
// Contact operations
addContact: (clientId: string, contact: Omit<ClientContact, 'id' | 'createdAt'>) => void;
updateContact: (clientId: string, contactId: string, updates: Partial<Omit<ClientContact, 'id' | 'createdAt'>>) => void;
removeContact: (clientId: string, contactId: string) => void;
```

**Step 2: Import `ClientContact` in ClientContext if not present**

The import at the top imports from `'../types'` — add `ClientContact` if it's not there already.

**Step 3: Pass through in `ClientProvider`**

Find where `clientOperations` is spread into the context return (around line 355-370). Add direct pass-throughs alongside the existing pattern:

```typescript
addContact: clientOperations.addContact,
updateContact: clientOperations.updateContact,
removeContact: clientOperations.removeContact,
```

**Step 4: Run build**

```bash
npm run build
```
Expected: 0 TS errors.

---

## Task 3: Add `toEmail` + `onSend` props to `EmailComposer`

**Files:**
- Modify: `src/components/Email/EmailComposer.tsx`

**Step 1: Extend the props interface**

In `src/components/Email/EmailComposer.tsx`, find the `EmailComposerProps` interface (line 8):

```typescript
interface EmailComposerProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}
```

Replace with:
```typescript
interface EmailComposerProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  toEmail?: string;
  onSend?: (subject: string, body: string) => void;
}
```

**Step 2: Use `toEmail` as initial state**

Update the function signature and the `subject`/`body` state initializations:

```typescript
export function EmailComposer({ client, isOpen, onClose, toEmail, onSend }: EmailComposerProps) {
```

**Step 3: Call `onSend` in `handleSendEmail`**

In the `handleSendEmail` function (line 60), before `window.open(...)`:

```typescript
const handleSendEmail = () => {
  const emailTo = toEmail ?? client.email;
  const mailtoLink = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  if (logEmail) {
    const entry: Omit<CommunicationLogEntry, 'id' | 'timestamp'> = {
      type: 'email',
      subject,
      content: body,
    };
    addCommunication(client.id, entry);
  }

  onSend?.(subject, body);   // ← notify caller
  window.open(mailtoLink, '_blank');
  onClose();
};
```

**Step 4: Update the "To:" display in the header**

In the composer header (line 127), update to show the effective email:

```typescript
To: {client.name} ({toEmail ?? client.email})
```

**Step 5: Run build**

```bash
npm run build
```
Expected: 0 TS errors.

---

## Task 4: Create `ContactsSection.tsx`

**Files:**
- Create: `src/components/Clients/ContactsSection.tsx`

**Step 1: Create the component**

```typescript
import { useState } from 'react';
import type { ClientContact } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';
import { EmailComposer } from '../Email/EmailComposer';

interface ContactsSectionProps {
  clientId: string;
  contacts: ClientContact[];
}

interface ContactFormState {
  name: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

const emptyForm: ContactFormState = {
  name: '',
  title: '',
  email: '',
  phone: '',
  isPrimary: false,
};

export function ContactsSection({ clientId, contacts }: ContactsSectionProps) {
  const { addContact, updateContact, removeContact, clients } = useClientContext();
  const client = clients.find((c) => c.id === clientId)!;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContactFormState>(emptyForm);
  const [composerEmail, setComposerEmail] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addContact(clientId, {
      name: form.name.trim(),
      title: form.title.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      isPrimary: form.isPrimary,
    });
    setForm(emptyForm);
    setShowAddForm(false);
  };

  const handleEdit = (contact: ClientContact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      title: contact.title ?? '',
      email: contact.email,
      phone: contact.phone ?? '',
      isPrimary: contact.isPrimary ?? false,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId || !form.name.trim()) return;
    updateContact(clientId, editingId, {
      name: form.name.trim(),
      title: form.title.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      isPrimary: form.isPrimary,
    });
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEmail = (contact: ClientContact) => {
    setComposerEmail(contact.email);
    setShowComposer(true);
  };

  const fieldClass =
    'w-full px-2 py-1.5 text-sm border-2 border-zinc-300 dark:border-zinc-600 rounded-[4px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-black font-display text-zinc-900 dark:text-white">Contacts</h3>
        {!showAddForm && (
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            + Add
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="border-2 border-yellow-400 rounded-[4px] p-4 space-y-2 bg-yellow-50 dark:bg-zinc-800">
          <input
            className={fieldClass}
            placeholder="Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className={fieldClass}
            placeholder="Title (e.g. CEO)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className={fieldClass}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <input
            className={fieldClass}
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
              className="w-4 h-4"
            />
            Primary contact
          </label>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleAdd} disabled={!form.name.trim()}>
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => { setShowAddForm(false); setForm(emptyForm); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Contact list */}
      {contacts.length === 0 && !showAddForm && (
        <p className="text-sm text-zinc-400 py-2">No contacts yet. Click + Add to get started.</p>
      )}

      {contacts.map((contact) =>
        editingId === contact.id ? (
          /* Edit mode */
          <div
            key={contact.id}
            className="border-2 border-yellow-400 rounded-[4px] p-4 space-y-2 bg-yellow-50 dark:bg-zinc-800"
          >
            <input
              className={fieldClass}
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className={fieldClass}
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className={fieldClass}
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              className={fieldClass}
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                className="w-4 h-4"
              />
              Primary contact
            </label>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSaveEdit} disabled={!form.name.trim()}>
                Save
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setEditingId(null); setForm(emptyForm); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* Display mode */
          <div
            key={contact.id}
            className="border-2 border-zinc-200 dark:border-zinc-700 rounded-[4px] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {contact.isPrimary && (
                    <span className="text-yellow-500 text-base" title="Primary contact">★</span>
                  )}
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">
                    {contact.name}
                  </span>
                  {contact.title && (
                    <span className="text-xs text-zinc-500">· {contact.title}</span>
                  )}
                </div>
                {contact.email && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{contact.email}</p>
                )}
                {contact.phone && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{contact.phone}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {contact.email && (
                  <button
                    onClick={() => handleEmail(contact)}
                    className="px-2 py-1 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-[4px] hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Email
                  </button>
                )}
                <button
                  onClick={() => handleEdit(contact)}
                  className="px-2 py-1 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-[4px] hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Edit
                </button>
                {confirmRemoveId === contact.id ? (
                  <>
                    <button
                      onClick={() => { removeContact(clientId, contact.id); setConfirmRemoveId(null); }}
                      className="px-2 py-1 text-xs font-bold border-2 border-red-400 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-[4px]"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmRemoveId(null)}
                      className="px-2 py-1 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-[4px]"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmRemoveId(contact.id)}
                    className="px-2 py-1 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-[4px] hover:border-red-400 hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* Email Composer */}
      {showComposer && client && (
        <EmailComposer
          client={client}
          isOpen={showComposer}
          onClose={() => setShowComposer(false)}
          toEmail={composerEmail}
        />
      )}
    </div>
  );
}
```

**Step 2: Run build**

```bash
npm run build
```
Expected: 0 TS errors.

---

## Task 5: Add `ContactsSection` to `ClientDetail.tsx`

**Files:**
- Modify: `src/components/Clients/ClientDetail.tsx`

**Step 1: Import ContactsSection**

In `src/components/Clients/ClientDetail.tsx`, add to the imports:

```typescript
import { ContactsSection } from './ContactsSection';
```

**Step 2: Add ContactsSection to the layout**

In `ClientDetail.tsx`, find where the component renders its main content sections. Look for where `<CommunicationLog` is rendered (the component renders several sections). Add `<ContactsSection>` just before `<CommunicationLog`:

```typescript
<ContactsSection
  clientId={client.id}
  contacts={client.contacts ?? []}
/>
```

**Step 3: Run build and tests**

```bash
npm run build && npx vitest run
```
Expected: 0 TS errors, 51 tests pass.

---

## Verification

1. `npm run build` — 0 TS errors
2. `npx vitest run` — 51 tests pass
3. Manual smoke test:
   - Open a client detail page → Contacts section appears
   - Click `+ Add` → form appears; fill in name + email → Save → contact appears in list
   - Star icon visible when `isPrimary` is checked
   - Click `Edit` → fields pre-filled; change name → Save → updates immediately
   - Click `Remove` → confirm prompt → contact disappears
   - Click `Email` button → EmailComposer opens with contact's email pre-filled in the "To:" header
