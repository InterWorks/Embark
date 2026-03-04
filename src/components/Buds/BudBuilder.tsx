import { useState } from 'react';
import { useBuds, budTemplates } from '../../hooks/useBuds';
import { BudChat } from './BudChat';
import { BudForm } from './BudForm';
import type { Bud, BudType } from '../../types';

const templateInfo: { type: Exclude<BudType, 'custom'>; icon: string; color: string }[] = [
  { type: 'status-reporter', icon: '📊', color: 'from-blue-500 to-cyan-500' },
  { type: 'project-manager', icon: '📋', color: 'from-purple-500 to-pink-500' },
  { type: 'standup-manager', icon: '🎯', color: 'from-green-500 to-emerald-500' },
  { type: 'priorities-manager', icon: '🚀', color: 'from-orange-500 to-red-500' },
];

export function BudBuilder() {
  const { buds, apiKey, createBud, updateBud, deleteBud } = useBuds();
  const [selectedBud, setSelectedBud] = useState<Bud | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [editingBud, setEditingBud] = useState<Bud | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateFromTemplate = (type: Exclude<BudType, 'custom'>) => {
    const bud = createBud(type);
    setSelectedBud(bud);
  };

  const handleCreateCustom = () => {
    setShowCreateForm(true);
  };

  const handleSaveCustomBud = (budData: Omit<Bud, 'id' | 'createdAt'>) => {
    if (editingBud) {
      updateBud(editingBud.id, budData);
      setEditingBud(null);
    } else {
      const newBud = createBud(budData);
      setSelectedBud(newBud);
    }
    setShowCreateForm(false);
  };

  const handleDeleteBud = (bud: Bud) => {
    if (confirm(`Are you sure you want to delete ${bud.name}?`)) {
      deleteBud(bud.id);
      if (selectedBud?.id === bud.id) {
        setSelectedBud(null);
        setShowChat(false);
      }
    }
  };

  const handleEditBud = (bud: Bud) => {
    setEditingBud(bud);
    setShowCreateForm(true);
  };

  const handleChatWithBud = (bud: Bud) => {
    setSelectedBud(bud);
    setShowChat(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Build A Bud</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage your AI assistants
          </p>
        </div>
      </div>

      {!apiKey && (
        <div className="glass-card p-4 mb-6 border-l-4 border-amber-500">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">API Key Required</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                To use Buds, you need to add your Anthropic API key in Settings. Click the gear icon in the top right to configure it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pre-built Templates */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Start Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templateInfo.map(({ type, icon, color }) => {
            const template = budTemplates[type];
            const existingBud = buds.find((b) => b.type === type);

            return (
              <div
                key={type}
                className="glass-card p-4 hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={() => existingBud ? handleChatWithBud(existingBud) : handleCreateFromTemplate(type)}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl mb-3`}>
                  {icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {template.description}
                </p>
                {existingBud ? (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    Created
                  </span>
                ) : (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                    Click to create
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* My Buds */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            My Buds
          </h2>
          <button
            onClick={handleCreateCustom}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Custom Bud
          </button>
        </div>

        {buds.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No Buds yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create your first Bud from a template above or create a custom one
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buds.map((bud) => (
              <div
                key={bud.id}
                className="glass-card p-4 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bud.color} flex items-center justify-center text-xl`}>
                    {bud.icon}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditBud(bud)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteBud(bud)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {bud.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                  {bud.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {bud.type === 'custom' ? 'Custom' : budTemplates[bud.type]?.name || bud.type}
                  </span>
                  <button
                    onClick={() => handleChatWithBud(bud)}
                    disabled={!apiKey}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && selectedBud && (
        <BudChat
          bud={selectedBud}
          onClose={() => {
            setShowChat(false);
            setSelectedBud(null);
          }}
        />
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <BudForm
          bud={editingBud}
          onSave={handleSaveCustomBud}
          onClose={() => {
            setShowCreateForm(false);
            setEditingBud(null);
          }}
        />
      )}
    </div>
  );
}
