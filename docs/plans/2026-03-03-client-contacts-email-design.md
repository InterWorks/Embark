# Feature Design: Client Contacts + Email Composer

**Date:** 2026-03-03
**Status:** Ready for implementation
**Scope:** Add contacts management UI to ClientDetail + wire EmailComposer + auto-log sent emails

---

## Context

`ClientContact[]` is fully typed and already stored on `client.contacts`. A contacts CRUD hook
exists in `useClients.ts`. But there is no dedicated UI to manage contacts within ClientDetail,
and the EmailComposer component (`src/components/Email/EmailComposer.tsx`) is inaccessible from
any client view. Sent emails should also auto-log to the Communication Log.

---

## What's Already Built

| Item | Location |
|------|----------|
| `ClientContact` type | `src/types/index.ts` |
| `client.contacts` field | Stored in localStorage via `useClients` |
| Contact CRUD operations | `useClients.ts` (check for `addContact`, `updateContact`, `removeContact`) |
| `EmailComposer.tsx` | `src/components/Email/EmailComposer.tsx` |
| `CommunicationLog.tsx` + `addCommunication()` | `src/components/Clients/CommunicationLog.tsx` |

---

## ContactsSection Component

New file: `src/components/Clients/ContactsSection.tsx`

### Features
- List all contacts on `client.contacts[]` with avatar initial, name, title, email, phone
- Mark primary contact (star icon / primary badge)
- Inline "Add Contact" form (name, title, email, phone, isPrimary toggle)
- Edit existing contact (inline or modal)
- Remove contact (with confirmation)
- "Email" button per contact → opens `EmailComposer` pre-filled with contact's email

### Layout
```
┌──────────────────────────────────────────┐
│ Contacts                        [+ Add]  │
├──────────────────────────────────────────┤
│ ⭐ Jane Smith  · CEO                      │
│    jane@acme.com  ·  (555) 123-4567      │
│    [Email] [Edit] [Remove]               │
├──────────────────────────────────────────┤
│    Bob Lee   · Dev Lead                  │
│    bob@acme.com                          │
│    [Email] [Edit] [Remove]               │
└──────────────────────────────────────────┘
```

---

## EmailComposer Integration

Modify `src/components/Email/EmailComposer.tsx`:
- Add optional `toEmail?: string` prop → pre-fills "To" field
- Add optional `onSend?: (subject: string, body: string) => void` prop
- Call `onSend(subject, body)` when the user clicks Send (before/after simulated send)

In `ContactsSection`, when the Email button is clicked:
```typescript
const handleEmail = (contact: ClientContact) => {
  setComposerEmail(contact.email);
  setShowComposer(true);
};

// onSend handler:
const handleSent = (subject: string, body: string) => {
  addCommunication(clientId, {
    type: 'email',
    subject,
    content: body,
    direction: 'outbound',
    contactName: contact.name,
  });
  showToast('Email logged to Communication Log', 'success');
};
```

---

## ClientDetail Integration

Modify `src/components/Clients/ClientDetail.tsx`:
- Import and render `<ContactsSection clientId={client.id} contacts={client.contacts ?? []} />`
- Add it in the appropriate tab or section (below the main info, before or alongside the checklist)

---

## Key Files

| File | Change |
|------|--------|
| `src/components/Clients/ContactsSection.tsx` | **New** — full contacts CRUD + email trigger |
| `src/components/Clients/ClientDetail.tsx` | Add `<ContactsSection>` |
| `src/components/Email/EmailComposer.tsx` | Add `toEmail` + `onSend` props |
| `src/context/ClientContext.tsx` | Expose `addCommunication` if not already accessible |

---

## Verification

1. `npm run build` — 0 TS errors
2. `npx vitest run` — all 51 tests pass
3. Manual:
   - Open a client detail page
   - Add a contact (name, email, title) → appears in list
   - Mark as primary → star appears
   - Click Edit → fields become editable, save updates
   - Click Remove → contact disappears
   - Click Email button → EmailComposer opens pre-filled with contact email
   - Send email → entry appears in Communication Log
