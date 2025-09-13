'use client';

import React, { useState, useEffect } from 'react';
import { StorageSolution } from '@/lib/types';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/modal';

interface StorageSolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (solution: Omit<StorageSolution, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingSolution: StorageSolution | null;
  isLoading: boolean;
}

export const StorageSolutionDialog: React.FC<StorageSolutionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSolution,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accessLevel: 'immediate' as 'immediate' | '1-day' | '14-day',
    costPerGbPerMonth: 0,
  });

  // Update form data when editingSolution changes
  useEffect(() => {
    if (editingSolution) {
      setFormData({
        name: editingSolution.name,
        description: editingSolution.description,
        accessLevel: editingSolution.accessLevel,
        costPerGbPerMonth: editingSolution.costPerGbPerMonth,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        accessLevel: 'immediate',
        costPerGbPerMonth: 0,
      });
    }
  }, [editingSolution]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      console.error('Please fill in all required fields');
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving storage solution:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay className="bg-[#000] !opacity-30 backdrop-blur-sm" />
      <ModalContent className="top-[15vh] !m-auto !max-w-[500px] rounded-xl !bg-navy-900 text-white">
            <form onSubmit={handleSubmit}>
              <ModalHeader className="px-6 pt-6 text-xl font-bold text-white">
                {editingSolution ? 'Edit Storage Solution' : 'Add Storage Solution'}
              </ModalHeader>
              <ModalCloseButton className="absolute right-[16px] top-[16px] z-10 text-white" />
              <ModalBody className="px-6 py-4">
                <div className="mb-4">
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-white">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Standard Storage"
                    disabled={isLoading}
                    required
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-navy-700 bg-navy-800 p-3 text-sm text-white outline-none placeholder:text-gray-500"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="description" className="mb-2 block text-sm font-medium text-white">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the storage solution and its characteristics"
                    disabled={isLoading}
                    required
                    className="mt-2 flex min-h-[100px] w-full items-center justify-center rounded-xl border border-navy-700 bg-navy-800 p-3 text-sm text-white outline-none placeholder:text-gray-500"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="accessLevel" className="mb-2 block text-sm font-medium text-white">
                    Access Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="accessLevel"
                    value={formData.accessLevel}
                    onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as 'immediate' | '1-day' | '14-day' })}
                    disabled={isLoading}
                    required
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-navy-700 bg-navy-800 p-3 text-sm text-white outline-none"
                  >
                    <option value="immediate">Immediate Access</option>
                    <option value="1-day">1-Day Retrieval</option>
                    <option value="14-day">14-Day Retrieval</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="costPerGbPerMonth" className="mb-2 block text-sm font-medium text-white">
                    Cost (cents per GB per month) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="costPerGbPerMonth"
                    type="number"
                    min="0"
                    step="0.0001"
                    value={formData.costPerGbPerMonth}
                    onChange={(e) => setFormData({ ...formData, costPerGbPerMonth: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 2.5"
                    disabled={isLoading}
                    required
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-navy-700 bg-navy-800 p-3 text-sm text-white outline-none placeholder:text-gray-500"
                  />
                </div>
              </ModalBody>

              <ModalFooter className="flex items-center justify-end gap-2 px-6 pb-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-600 bg-transparent px-6 py-2 text-sm font-medium text-white transition duration-200 hover:bg-navy-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <span>Processing...</span>
                  ) : (
                    <span>{editingSolution ? 'Update Solution' : 'Add Solution'}</span>
                  )}
                </button>
              </ModalFooter>
            </form>
      </ModalContent>
    </Modal>
  );
}; 