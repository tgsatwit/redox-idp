'use client';

import { useState, useEffect } from 'react';
import { Prompt, PromptRole } from '@/lib/types';
import { FiSave, FiCheck } from 'react-icons/fi';

type PromptEditorProps = {
  prompt: Prompt;
  categoryId: string;
  onSave: (updatedPrompt: Prompt) => void;
};

export default function PromptEditor({ prompt, categoryId, onSave }: PromptEditorProps) {
  const [editedPrompt, setEditedPrompt] = useState<Prompt>(prompt);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update local state when the prompt prop changes
  useEffect(() => {
    setEditedPrompt(prompt);
  }, [prompt]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedPrompt((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedPrompt((prev) => ({
      ...prev,
      isActive: e.target.checked,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/update-config/prompt-categories/${categoryId}/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedPrompt),
      });

      if (!response.ok) throw new Error('Failed to update prompt');

      const updatedPrompt = await response.json();
      onSave(updatedPrompt);
      
      // Show success indicator briefly
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating prompt:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Edit Prompt</h3>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
            saveSuccess
              ? 'bg-green-500 text-white'
              : 'bg-brand-500 text-white hover:bg-brand-600'
          }`}
        >
          {saveSuccess ? (
            <>
              <FiCheck size={16} />
              Saved
            </>
          ) : (
            <>
              <FiSave size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={editedPrompt.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md dark:bg-navy-900 dark:border-navy-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            name="role"
            value={editedPrompt.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md dark:bg-navy-900 dark:border-navy-700"
          >
            <option value="system">System</option>
            <option value="user">User</option>
            <option value="assistant">Assistant</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <input
          type="text"
          name="description"
          value={editedPrompt.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md dark:bg-navy-900 dark:border-navy-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Content</label>
        <textarea
          name="content"
          value={editedPrompt.content}
          onChange={handleChange}
          rows={10}
          className="w-full px-3 py-2 border rounded-md font-mono text-sm dark:bg-navy-900 dark:border-navy-700"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={editedPrompt.isActive}
          onChange={handleActiveChange}
          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm">
          Active
        </label>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>Created: {new Date(editedPrompt.createdAt).toLocaleString()}</p>
        <p>Last Updated: {new Date(editedPrompt.updatedAt).toLocaleString()}</p>
        <p>ID: {editedPrompt.id}</p>
      </div>
    </div>
  );
} 