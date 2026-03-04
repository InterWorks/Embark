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

  const ContactForm = ({
    onSave,
    onCancel,
  }: {
    onSave: () => void;
    onCancel: () => void;
  }) => (
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
        <Button size="sm" onClick={onSave} disabled={!form.name.trim()}>
          Save
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

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

      {showAddForm && (
        <ContactForm
          onSave={handleAdd}
          onCancel={() => {
            setShowAddForm(false);
            setForm(emptyForm);
          }}
        />
      )}

      {contacts.length === 0 && !showAddForm && (
        <p className="text-sm text-zinc-400 py-2">
          No contacts yet. Click + Add to get started.
        </p>
      )}

      {contacts.map((contact) =>
        editingId === contact.id ? (
          <ContactForm
            key={contact.id}
            onSave={handleSaveEdit}
            onCancel={() => {
              setEditingId(null);
              setForm(emptyForm);
            }}
          />
        ) : (
          <div
            key={contact.id}
            className="border-2 border-zinc-200 dark:border-zinc-700 rounded-[4px] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {contact.isPrimary && (
                    <span className="text-yellow-500 text-base" title="Primary contact">
                      ★
                    </span>
                  )}
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">
                    {contact.name}
                  </span>
                  {contact.title && (
                    <span className="text-xs text-zinc-500">· {contact.title}</span>
                  )}
                </div>
                {contact.email && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {contact.email}
                  </p>
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
                      onClick={() => {
                        removeContact(clientId, contact.id);
                        setConfirmRemoveId(null);
                      }}
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
