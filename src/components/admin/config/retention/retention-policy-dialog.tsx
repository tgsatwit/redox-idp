'use client';

import React, { useState } from 'react';
import { RetentionPolicy } from '@/lib/types';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/modal';

// Helper functions for converting between days and years
const daysToYears = (days: number) => Number((days / 365).toFixed(2));
const yearsToDays = (years: number) => Math.round(years * 365);

interface RetentionPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: { name: string; description: string; duration: number }) => Promise<void>;
  editingPolicy: RetentionPolicy | null;
  isLoading: boolean;
}

export const RetentionPolicyDialog: React.FC<RetentionPolicyDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPolicy,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: editingPolicy?.name || '',
    description: editingPolicy?.description || '',
    durationYears: editingPolicy ? daysToYears(editingPolicy.duration) : 1,
  });

  // Update form data when editingPolicy changes
  React.useEffect(() => {
    if (editingPolicy) {
      setFormData({
        name: editingPolicy.name,
        description: editingPolicy.description,
        durationYears: daysToYears(editingPolicy.duration),
      });
    } else {
      setFormData({
        name: '',
        description: '',
        durationYears: 1,
      });
    }
  }, [editingPolicy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.durationYears) {
      console.error('Please fill in all fields');
      return;
    }

    // Convert years to days for storage
    const duration = yearsToDays(formData.durationYears);

    try {
      await onSave({
        name: formData.name,
        description: formData.description,
        duration,
      });
    } catch (error) {
      console.error('Error saving policy:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      children={
        <>
          <ModalOverlay className="bg-[#000] !opacity-40" />
          <ModalContent className="top-[15vh] !m-auto !max-w-[500px] rounded-xl !bg-navy-900 text-white">
            <form onSubmit={handleSubmit}>
              <ModalHeader className="px-6 pt-6 text-xl font-bold text-white">
                {editingPolicy ? 'Edit Retention Policy' : 'Add Retention Policy'}
              </ModalHeader>
              <ModalCloseButton className="absolute right-[16px] top-[16px] z-10 text-white" />
              <ModalBody className="px-6 py-4">
                <div className="mb-4">
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-white">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Standard 2-Year Retention"
                    disabled={isLoading}
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-navy-700 bg-navy-800 p-3 text-sm text-white outline-none placeholder:text-gray-500"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="description" className="mb-2 block text-sm font-medium text-white">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the purpose and requirements of this retention policy"
                    disabled={isLoading}
                    className="mt-2 flex min-h-[100px] w-full items-center justify-center rounded-xl border border-navy-700 bg-navy-800 p-3 text-sm text-white outline-none placeholder:text-gray-500"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="duration" className="mb-2 block text-sm font-medium text-white">
                    Duration (years)
                  </label>
                  <input
                    id="duration"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.durationYears}
                    onChange={(e) => setFormData({ ...formData, durationYears: parseFloat(e.target.value) })}
                    placeholder="e.g., 2 for two years"
                    disabled={isLoading}
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
                    <span>{editingPolicy ? 'Update Policy' : 'Add Policy'}</span>
                  )}
                </button>
              </ModalFooter>
            </form>
          </ModalContent>
        </>
      }
    />
  );
}; 