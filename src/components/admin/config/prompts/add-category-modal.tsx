'use client';

import { useState } from 'react';
import { PromptCategory } from '@/lib/types';
import { MdClose } from 'react-icons/md';

// Create a properly typed wrapper to accept className prop
const MdCloseAny = MdClose as any;

type AddCategoryModalProps = {
  onClose: () => void;
  onAdd: (category: Omit<PromptCategory, 'id' | 'prompts'>) => void;
};

export default function AddCategoryModal({ onClose, onAdd }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      description,
      model,
      temperature,
      responseFormat: { type: 'text' },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-navy-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Add LLM Call</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-navy-700"
          >
            <MdCloseAny className="h-6 w-6" />
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
              placeholder="Document Classification"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-navy-900 dark:border-navy-700"
              placeholder="Classifies documents based on their content"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-navy-900 dark:border-navy-700"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Temperature</label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-md dark:bg-navy-900 dark:border-navy-700"
            />
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Controls randomness: 0 = deterministic, 2 = very random
            </p>
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
              disabled={!name}
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