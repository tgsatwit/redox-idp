'use client';

import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdClose,
  MdArrowUpward,
  MdArrowDownward,
  MdToggleOn,
  MdToggleOff
} from 'react-icons/md';
import Card from '@/components/card';
import { WorkflowTaskConfig } from '@/lib/types';

// Form interfaces
interface TaskFormData {
  name: string;
  description: string;
  stepId: number;
  defaultEnabled: boolean;
  isActive: boolean;
}

// Notification component
interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const bgColor = {
    success: 'bg-green-100 dark:bg-green-900/30',
    error: 'bg-red-100 dark:bg-red-900/30',
    info: 'bg-blue-100 dark:bg-blue-900/30'
  }[type];

  const textColor = {
    success: 'text-green-800 dark:text-green-400',
    error: 'text-red-800 dark:text-red-400',
    info: 'text-blue-800 dark:text-blue-400'
  }[type];

  return (
    <div className={`fixed top-4 right-4 z-50 rounded-lg p-4 ${bgColor}`}>
      <div className="flex items-center gap-2">
        <span className={textColor}>{message}</span>
        <button onClick={onClose} className={`${textColor} hover:opacity-80`}>
          <MdClose size={20} />
        </button>
      </div>
    </div>
  );
};

// Task Form Modal component
interface TaskFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: TaskFormData;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | 
    { target: { name: string; value: any } }
  ) => void;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-navy-800">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
          {isEditing ? 'Edit Task' : 'Add New Task'}
        </h3>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={onChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onChange}
              required
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="stepId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Step Number *
            </label>
            <input
              type="number"
              id="stepId"
              name="stepId"
              value={formData.stepId}
              onChange={onChange}
              required
              min={1}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="defaultEnabled"
                checked={formData.defaultEnabled}
                onChange={(e) => onChange({
                  target: {
                    name: 'defaultEnabled',
                    value: e.target.checked
                  }
                })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Default Enabled
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => onChange({
                  target: {
                    name: 'isActive',
                    value: e.target.checked
                  }
                })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Active
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-navy-600 dark:text-gray-300 dark:hover:bg-navy-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isEditing ? 'Update' : 'Create'} Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WorkflowTasksPage = () => {
  // State variables
  const [tasks, setTasks] = useState<WorkflowTaskConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    stepId: 1,
    defaultEnabled: true,
    isActive: true
  });
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Load tasks on initial render
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/update-config/workflow-tasks');
        if (!response.ok) throw new Error('Failed to fetch workflow tasks');
        const data = await response.json();
        setTasks(data);
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        setError(err.message || 'Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | 
    { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stepId' ? parseInt(value, 10) || 1 : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = isEditing 
        ? `/api/update-config/workflow-tasks/${isEditing}`
        : '/api/update-config/workflow-tasks';
        
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} task`);
      }
      
      // Refresh tasks
      const tasksResponse = await fetch('/api/update-config/workflow-tasks');
      if (!tasksResponse.ok) throw new Error('Failed to fetch updated tasks');
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        stepId: 1,
        defaultEnabled: true,
        isActive: true
      });
      setIsFormOpen(false);
      setIsEditing(null);
      
      // Show success notification
      setNotification({
        message: `Task ${isEditing ? 'updated' : 'created'} successfully`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error submitting task:', err);
      setNotification({
        message: err.message || `Failed to ${isEditing ? 'update' : 'create'} task`,
        type: 'error'
      });
    }
  };

  // Handle task deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`/api/update-config/workflow-tasks/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }
      
      // Remove task from state
      setTasks(prev => prev.filter(t => t.id !== id));
      
      // Show success notification
      setNotification({
        message: 'Task deleted successfully',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setNotification({
        message: err.message || 'Failed to delete task',
        type: 'error'
      });
    }
  };

  // Handle step reordering
  const handleReorderStep = async (taskId: string, direction: 'up' | 'down') => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    const newStepId = direction === 'up' ? task.stepId - 1 : task.stepId + 1;
    
    if (newStepId < 1) return;
    
    try {
      const response = await fetch(`/api/update-config/workflow-tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stepId: newStepId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reorder task');
      }
      
      // Refresh tasks
      const tasksResponse = await fetch('/api/update-config/workflow-tasks');
      if (!tasksResponse.ok) throw new Error('Failed to fetch updated tasks');
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);
      
      // Show success notification
      setNotification({
        message: 'Task reordered successfully',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error reordering task:', err);
      setNotification({
        message: err.message || 'Failed to reorder task',
        type: 'error'
      });
    }
  };

  // Sort tasks by step ID
  const sortedTasks = [...tasks].sort((a, b) => a.stepId - b.stepId);

  return (
    <div className="mt-3 grid h-full grid-cols-1 gap-5">
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="col-span-1">
        <Card extra="flex flex-col w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-3xl p-3">
            <div className="text-2xl font-bold text-navy-700 dark:text-white">
              Workflow Tasks
            </div>
            
            <button
              onClick={() => {
                setIsEditing(null);
                setFormData({
                  name: '',
                  description: '',
                  stepId: Math.max(...tasks.map(t => t.stepId), 0) + 1,
                  defaultEnabled: true,
                  isActive: true
                });
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <MdAdd size={20} />
              Add Task
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
          ) : error ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-red-500">{error}</div>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-gray-500 dark:text-gray-400">
                No tasks found. Click "Add Task" to create one.
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {sortedTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between rounded-lg border border-gray-200 p-4 dark:border-navy-600"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-900 dark:bg-navy-700 dark:text-white">
                      {task.stepId}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {task.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {task.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${task.defaultEnabled
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                        >
                          {task.defaultEnabled ? 'Default Enabled' : 'Default Disabled'}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${task.isActive
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                        >
                          {task.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleReorderStep(task.id, 'up')}
                        disabled={index === 0}
                        className={`p-1 ${
                          index === 0
                            ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <MdArrowUpward size={20} />
                      </button>
                      <button
                        onClick={() => handleReorderStep(task.id, 'down')}
                        disabled={index === sortedTasks.length - 1}
                        className={`p-1 ${
                          index === sortedTasks.length - 1
                            ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <MdArrowDownward size={20} />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditing(task.id);
                        setFormData({
                          name: task.name,
                          description: task.description,
                          stepId: task.stepId,
                          defaultEnabled: task.defaultEnabled,
                          isActive: task.isActive
                        });
                        setIsFormOpen(true);
                      }}
                      className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <MdEdit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isFormOpen}
        isEditing={!!isEditing}
        formData={formData}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditing(null);
          setFormData({
            name: '',
            description: '',
            stepId: Math.max(...tasks.map(t => t.stepId), 0) + 1,
            defaultEnabled: true,
            isActive: true
          });
        }}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
      />
    </div>
  );
};

export default WorkflowTasksPage; 