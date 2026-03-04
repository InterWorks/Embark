import { useState } from 'react';
import { useClientContext } from '../../context/ClientContext';

interface TagManagerProps {
  clientId: string;
  clientTags: string[];
}

export function TagManager({ clientId, clientTags }: TagManagerProps) {
  const { tags, addTag, addClientTag, removeClientTag, getTagById } = useClientContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const clientTagObjects = clientTags.map((tagId) => getTagById(tagId)).filter(Boolean);
  const availableTags = tags.filter((tag) => !clientTags.includes(tag.id));

  const handleAddNewTag = () => {
    if (newTagName.trim()) {
      const newTag = addTag(newTagName.trim());
      addClientTag(clientId, newTag.id, newTag.name);
      setNewTagName('');
      setShowDropdown(false);
    }
  };

  const handleAddExistingTag = (tagId: string, tagName: string) => {
    addClientTag(clientId, tagId, tagName);
    setShowDropdown(false);
  };

  const handleRemoveTag = (tagId: string, tagName: string) => {
    removeClientTag(clientId, tagId, tagName);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {clientTagObjects.map((tag) => (
          <span
            key={tag!.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: tag!.color }}
          >
            {tag!.name}
            <button
              onClick={() => handleRemoveTag(tag!.id, tag!.name)}
              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${tag!.name}`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Tag
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <div className="p-2">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                      placeholder="New tag name..."
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleAddNewTag}
                      disabled={!newTagName.trim()}
                      className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>

                  {availableTags.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                        Existing tags
                      </p>
                      {availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleAddExistingTag(tag.id, tag.name)}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
