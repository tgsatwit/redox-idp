'use client';

import React, { useState, useEffect } from 'react';
import { RetentionPolicy, StorageSolution, RetentionStage } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/modal';
import { MdAdd, MdDelete, MdDragHandle } from 'react-icons/md';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Helper functions for converting between days and years
const daysToYears = (days: number) => Number((days / 365).toFixed(2));
const yearsToDays = (years: number) => Math.round(years * 365);

// Drag and drop item type
const ItemTypes = {
  STAGE: 'stage',
};

interface RetentionPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  policy: RetentionPolicy | null;
  isAdding: boolean;
  onSave: (policy: RetentionPolicy) => Promise<void>;
  storageSolutions: StorageSolution[];
  isLoading: boolean;
}

interface RetentionStageItemProps {
  id: string;
  index: number;
  stage: {
    id: string;
    storageSolutionId: string;
    durationYears: number;
  };
  storageSolutions: StorageSolution[];
  moveStage: (dragIndex: number, hoverIndex: number) => void;
  updateStage: (id: string, updates: Partial<{ storageSolutionId: string; durationYears: number }>) => void;
  removeStage: (id: string) => void;
}

const RetentionStageItem: React.FC<RetentionStageItemProps> = ({
  id,
  index,
  stage,
  storageSolutions,
  moveStage,
  updateStage,
  removeStage,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.STAGE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      moveStage(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.STAGE,
    item: () => {
      return { id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className="mb-3 flex items-center gap-3 rounded-lg border border-navy-700 bg-navy-800 p-3"
      data-handler-id={handlerId}
    >
      <div className="cursor-move text-gray-400">
        <MdDragHandle size={20} />
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`storage-${stage.id}`} className="mb-1 block text-xs font-medium text-white">
            Storage Type
          </label>
          <select
            id={`storage-${stage.id}`}
            value={stage.storageSolutionId}
            onChange={(e) => updateStage(stage.id, { storageSolutionId: e.target.value })}
            className="w-full rounded-lg border border-navy-700 bg-navy-900 p-2 text-sm text-white"
          >
            <option value="">Select Storage Type</option>
            {storageSolutions.map((solution) => (
              <option key={solution.id} value={solution.id}>
                {solution.name} ({solution.accessLevel})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor={`duration-${stage.id}`} className="mb-1 block text-xs font-medium text-white">
            Duration (years)
          </label>
          <input
            id={`duration-${stage.id}`}
            type="number"
            min="0.1"
            step="0.1"
            value={stage.durationYears}
            onChange={(e) => updateStage(stage.id, { durationYears: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-lg border border-navy-700 bg-navy-900 p-2 text-sm text-white"
          />
        </div>
      </div>
      
      <button
        type="button"
        onClick={() => removeStage(stage.id)}
        className="text-red-400 hover:text-red-500"
      >
        <MdDelete size={20} />
      </button>
    </div>
  );
};

export const RetentionPolicyDialog: React.FC<RetentionPolicyDialogProps> = ({
  isOpen,
  onClose,
  policy,
  isAdding,
  onSave,
  storageSolutions,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [stages, setStages] = useState<Array<{
    id: string;
    storageSolutionId: string;
    durationYears: number;
  }>>([]);
  
  const [totalDuration, setTotalDuration] = useState<number>(0);

  // Update form data when policy changes
  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name,
        description: policy.description,
      });
      
      // Convert existing stages or create from legacy duration
      if (policy.stages && policy.stages.length > 0) {
        setStages(
          policy.stages.map((stage) => ({
            id: stage.id,
            storageSolutionId: stage.storageSolutionId,
            durationYears: daysToYears(stage.duration),
          }))
        );
      } else if (policy.duration) {
        // Convert from legacy single duration policy
        // Default to first storage solution if available
        const defaultStorageId = storageSolutions && storageSolutions.length > 0 ? storageSolutions[0].id : '';
        setStages([
          {
            id: uuidv4(),
            storageSolutionId: defaultStorageId,
            durationYears: daysToYears(policy.duration),
          },
        ]);
      }
    } else {
      setFormData({
        name: '',
        description: '',
      });
      
      // Start with one empty stage
      setStages([
        {
          id: uuidv4(),
          storageSolutionId: storageSolutions && storageSolutions.length > 0 ? storageSolutions[0].id : '',
          durationYears: 1,
        },
      ]);
    }
  }, [policy, storageSolutions]);

  // Calculate total duration whenever stages change
  useEffect(() => {
    const totalYears = stages.reduce((total, stage) => total + stage.durationYears, 0);
    setTotalDuration(totalYears);
  }, [stages]);

  const addStage = () => {
    setStages([
      ...stages,
      {
        id: uuidv4(),
        storageSolutionId: '',
        durationYears: 1,
      },
    ]);
  };

  const updateStage = (id: string, updates: Partial<{ storageSolutionId: string; durationYears: number }>) => {
    setStages(
      stages.map((stage) => (stage.id === id ? { ...stage, ...updates } : stage))
    );
  };

  const removeStage = (id: string) => {
    if (stages.length > 1) {
      setStages(stages.filter((stage) => stage.id !== id));
    }
  };

  const moveStage = (dragIndex: number, hoverIndex: number) => {
    const newStages = [...stages];
    const draggedStage = newStages[dragIndex];
    newStages.splice(dragIndex, 1);
    newStages.splice(hoverIndex, 0, draggedStage);
    setStages(newStages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      console.error('Please fill in all required fields');
      return;
    }

    if (stages.length === 0) {
      console.error('At least one retention stage is required');
      return;
    }

    const invalidStages = stages.filter(
      (stage) => !stage.storageSolutionId || stage.durationYears <= 0
    );

    if (invalidStages.length > 0) {
      console.error('All stages must have a storage type and valid duration');
      return;
    }

    // Convert years to days for storage
    const preparedStages: RetentionStage[] = stages.map((stage) => ({
      id: stage.id,
      storageSolutionId: stage.storageSolutionId,
      duration: yearsToDays(stage.durationYears),
    }));

    try {
      await onSave({
        id: policy?.id || undefined,
        name: formData.name,
        description: formData.description,
        stages: preparedStages,
        totalDuration: yearsToDays(totalDuration),
        duration: yearsToDays(totalDuration), // For backward compatibility
        createdAt: policy?.createdAt || Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error saving policy:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay className="bg-[#000] !opacity-30 backdrop-blur-sm" />
      <ModalContent className="top-[10vh] !m-auto !max-w-[700px] rounded-xl !bg-navy-900 text-white">
        <form onSubmit={handleSubmit}>
          <ModalHeader className="px-6 pt-6 text-xl font-bold text-white">
            {isAdding ? 'Add Retention Policy' : 'Edit Retention Policy'}
          </ModalHeader>
          <ModalCloseButton className="absolute right-[16px] top-[16px] z-10 text-white" />
          <ModalBody className="px-6 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="mb-4">
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-white">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard 7-Year Retention"
                  disabled={isLoading}
                  required
                  className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-navy-700 bg-navy-800 p-3 text-sm text-white outline-none placeholder:text-gray-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="totalDuration" className="mb-2 block text-sm font-medium text-white">
                  Total Duration
                </label>
                <div className="mt-2 flex h-12 w-full items-center rounded-xl border border-navy-700 bg-navy-800 p-3 text-sm text-white">
                  <span className="font-medium">{totalDuration.toFixed(1)} years</span>
                  <span className="ml-2 text-gray-400">({yearsToDays(totalDuration)} days)</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-white">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose and requirements of this retention policy"
                disabled={isLoading}
                required
                className="mt-2 flex min-h-[80px] w-full items-center justify-center rounded-xl border border-navy-700 bg-navy-800 p-3 text-sm text-white outline-none placeholder:text-gray-500"
              />
            </div>

            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                  Retention Stages <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addStage}
                  disabled={isLoading}
                  className="flex items-center gap-1 rounded-md bg-indigo-500 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                  <MdAdd size={14} />
                  Add Stage
                </button>
              </div>
              
              <div className="rounded-xl border border-navy-700 bg-navy-900 p-3">
                <div className="mb-3 text-xs text-gray-400">
                  Drag and drop to reorder stages. The first stage will be applied first, followed by subsequent stages.
                </div>
                
                <DndProvider backend={HTML5Backend}>
                  <div className="space-y-2">
                    {stages.map((stage, index) => (
                      <RetentionStageItem
                        key={stage.id}
                        id={stage.id}
                        index={index}
                        stage={stage}
                        storageSolutions={storageSolutions}
                        moveStage={moveStage}
                        updateStage={updateStage}
                        removeStage={removeStage}
                      />
                    ))}
                  </div>
                </DndProvider>
                
                {stages.length === 0 && (
                  <div className="py-4 text-center text-sm text-gray-400">
                    No stages added yet. Click "Add Stage" to create one.
                  </div>
                )}
              </div>
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
              disabled={isLoading || stages.length === 0}
              className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <span>{isAdding ? 'Add Policy' : 'Update Policy'}</span>
              )}
            </button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}; 