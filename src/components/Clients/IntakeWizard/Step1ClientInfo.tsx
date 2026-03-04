import { generateId } from '../../../utils/helpers';
import { Input } from '../../UI/Input';
import { Button } from '../../UI/Button';

export interface ContactEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  isPrimary: boolean;
}

interface Step1Props {
  name: string;
  setName: (v: string) => void;
  contacts: ContactEntry[];
  setContacts: (v: ContactEntry[]) => void;
  goLiveDate: string;
  setGoLiveDate: (v: string) => void;
  error: string;
}

export function Step1ClientInfo({ name, setName, contacts, setContacts, goLiveDate, setGoLiveDate, error }: Step1Props) {
  const addContact = () => {
    setContacts([...contacts, { id: generateId(), name: '', email: '', phone: '', title: '', isPrimary: contacts.length === 0 }]);
  };

  const updateContact = (id: string, field: keyof ContactEntry, value: string | boolean) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeContact = (id: string) => {
    const next = contacts.filter(c => c.id !== id);
    // Ensure one primary
    if (next.length > 0 && !next.some(c => c.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    setContacts(next);
  };

  const setPrimary = (id: string) => {
    setContacts(contacts.map(c => ({ ...c, isPrimary: c.id === id })));
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Client / Company Name <span className="text-red-500">*</span>
        </label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Acme Corp"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Target Go-Live Date
        </label>
        <input
          type="date"
          value={goLiveDate}
          onChange={e => setGoLiveDate(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Contacts <span className="text-red-500">*</span>
          </label>
          <Button variant="ghost" size="sm" onClick={addContact} type="button">
            + Add Contact
          </Button>
        </div>

        {contacts.length === 0 && (
          <p className="text-sm text-gray-400 italic">No contacts yet. Add at least one.</p>
        )}

        <div className="space-y-3">
          {contacts.map(contact => (
            <div key={contact.id} className="glass-subtle p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPrimary(contact.id)}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                    contact.isPrimary
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-violet-100 dark:hover:bg-violet-900/40'
                  }`}
                >
                  {contact.isPrimary ? 'Primary' : 'Set Primary'}
                </button>
                {contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContact(contact.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={contact.name}
                  onChange={e => updateContact(contact.id, 'name', e.target.value)}
                  placeholder="Full Name *"
                />
                <Input
                  type="email"
                  value={contact.email}
                  onChange={e => updateContact(contact.id, 'email', e.target.value)}
                  placeholder="Email *"
                />
                <Input
                  value={contact.title}
                  onChange={e => updateContact(contact.id, 'title', e.target.value)}
                  placeholder="Title (optional)"
                />
                <Input
                  value={contact.phone}
                  onChange={e => updateContact(contact.id, 'phone', e.target.value)}
                  placeholder="Phone (optional)"
                />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}
