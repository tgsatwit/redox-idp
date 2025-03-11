'use client';

import { useState } from 'react';
import { Prompt, PromptRole } from '@/lib/types';
import { MdClose } from 'react-icons/md';

type AddPromptModalProps = {
  categoryId: string;
  onClose: () => void;
  onAdd: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
};

export default function AddPromptModal({ categoryId, onClose, onAdd }: AddPromptModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState<PromptRole>('system');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      description,
      role,
      content,
      isActive,
      category: categoryId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-navy-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Add Prompt</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-navy-700"
          >
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-navy-900 dark:border-navy-700"
              placeholder="Document Analysis"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-navy-900 dark:border-navy-700"
              placeholder="Analyze document content"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as PromptRole)}
              className="w-full px-3 py-2 border rounded-md dark:bg-navy-900 dark:border-navy-700"
            >
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
            </select>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              System: Instructions for AI, User: Human query, Assistant: AI response example
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 border rounded-md dark:bg-navy-900 dark:border-navy-700 font-mono text-sm"
              placeholder="You are an AI assistant that analyzes documents..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || !content}
              className="px-4 py-2 rounded-md bg-brand-500 text-white hover:bg-brand-600"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 