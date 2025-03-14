'use client';

import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdCheck, MdClose, MdInfo } from 'react-icons/md';
import Card from '@/components/card';
import { WorkflowTaskConfig } from '@/lib/types';

// Define workflow steps
const workflowSteps = [
  { id: 1, name: 'Upload Document' },
  { id: 2, name: 'Classify & Analyse' },
  { id: 3, name: 'Process Document' },
  { id: 4, name: 'Finalise' }
];

// Task Form Modal component
interface TaskFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  taskData: {
    name: string;
    description: string;
    stepId: number;
    defaultEnabled: boolean;
    isActive: boolean;
  };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  isEditing,
  taskData,
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
        
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Task Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={taskData.name}
                onChange={onChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-navy-600 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-navy-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            {/* Step ID */}
            <div>
              <label htmlFor="stepId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Workflow Step *
              </label>
              <select
                id="stepId"
                name="stepId"
                value={taskData.stepId}
                onChange={onChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-navy-600 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-navy-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {workflowSteps.map(step => (
                  <option key={step.id} value={step.id}>
                    {step.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={taskData.description}
                onChange={onChange}
                required
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-navy-600 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-navy-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            {/* Default Enabled */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="defaultEnabled"
                name="defaultEnabled"
                checked={taskData.defaultEnabled}
                onChange={onChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="defaultEnabled" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Default Enabled
              </label>
            </div>
            
            {/* Is Active */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={taskData.isActive}
                onChange={onChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
            
            {/* Form Buttons */}
            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-navy-600 dark:text-white dark:hover:bg-navy-700"
              >
                <MdClose size={16} />
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex items-center gap-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none"
              >
                <MdCheck size={16} />
                {isEditing ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Notification component for success messages
interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const bgColor = 
    type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
    type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
    'bg-blue-100 dark:bg-blue-900/30';
    
  const textColor = 
    type === 'success' ? 'text-green-700 dark:text-green-400' :
    type === 'error' ? 'text-red-700 dark:text-red-400' :
    'text-blue-700 dark:text-blue-400';
    
  const iconColor = 
    type === 'success' ? 'text-green-500' :
    type === 'error' ? 'text-red-500' :
    'text-blue-500';
  
  return (
    <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 flex items-center ${bgColor} border border-${textColor.split(' ')[0].replace('text-', '')}-200`}>
      <span className={`mr-2 ${iconColor}`}>
        {type === 'success' ? <MdCheck size={20} /> : 
         type === 'error' ? <MdInfo size={20} /> : 
         <MdInfo size={20} />}
      </span>
      <span className={textColor}>{message}</span>
      <button
        onClick={onClose}
        className={`ml-4 ${textColor} hover:${textColor.replace('400', '300').replace('700', '900')}`}
      >
        <MdClose size={18} />
      </button>
    </div>
  );
};

const WorkflowTasksConfigPage = () => {
  // State variables
  const [tasks, setTasks] = useState<WorkflowTaskConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  
  // Form state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isEditingTask, setIsEditingTask] = useState<string | null>(null);
  const [newTaskData, setNewTaskData] = useState({
    name: '',
    description: '',
    stepId: 1,
    defaultEnabled: true,
    isActive: true
  });
  
  // Delete confirmation
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // Filter state
  const [filterStep, setFilterStep] = useState<number | null>(null);
  
  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };
  
  // Fetch tasks from API
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = filterStep 
        ? `/api/update-config/workflow-tasks?stepId=${filterStep}`
        : '/api/update-config/workflow-tasks';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load workflow tasks');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load tasks on initial render and when filter changes
  useEffect(() => {
    fetchTasks();
  }, [filterStep]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewTaskData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setNewTaskData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle form submission for adding a new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/update-config/workflow-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTaskData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add task');
      }
      
      // Reset form and refresh tasks
      setNewTaskData({
        name: '',
        description: '',
        stepId: 1,
        defaultEnabled: true,
        isActive: true
      });
      setIsTaskModalOpen(false);
      await fetchTasks();
      
      // Show success notification
      showNotification('Task added successfully', 'success');
    } catch (err: any) {
      console.error('Error adding task:', err);
      setError(err.message || 'Failed to add task');
      showNotification(`Failed to add task: ${err.message}`, 'error');
    }
  };
  
  // Handle editing task
  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditingTask) return;
    
    try {
      const response = await fetch(`/api/update-config/workflow-tasks/${isEditingTask}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTaskData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
      
      // Reset form and refresh tasks
      setNewTaskData({
        name: '',
        description: '',
        stepId: 1,
        defaultEnabled: true,
        isActive: true
      });
      setIsEditingTask(null);
      setIsTaskModalOpen(false);
      await fetchTasks();
      
      // Show success notification
      showNotification('Task updated successfully', 'success');
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
      showNotification(`Failed to update task: ${err.message}`, 'error');
    }
  };
  
  // Start editing a task
  const startEditTask = (task: WorkflowTaskConfig) => {
    setNewTaskData({
      name: task.name,
      description: task.description,
      stepId: task.stepId,
      defaultEnabled: task.defaultEnabled,
      isActive: task.isActive
    });
    setIsEditingTask(task.id);
    setIsTaskModalOpen(true);
  };
  
  // Open add task modal
  const openAddTaskModal = () => {
    setNewTaskData({
      name: '',
      description: '',
      stepId: 1,
      defaultEnabled: true,
      isActive: true
    });
    setIsEditingTask(null);
    setIsTaskModalOpen(true);
  };
  
  // Handle deleting a task
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      const response = await fetch(`/api/update-config/workflow-tasks/${taskToDelete}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }
      
      // Refresh tasks after deletion
      setTaskToDelete(null);
      await fetchTasks();
      
      // Show success notification
      showNotification('Task deleted successfully', 'success');
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
      showNotification(`Failed to delete task: ${err.message}`, 'error');
    }
  };
  
  // Cancel any form operations
  const handleCancel = () => {
    setIsTaskModalOpen(false);
    setIsEditingTask(null);
    setTaskToDelete(null);
    setNewTaskData({
      name: '',
      description: '',
      stepId: 1,
      defaultEnabled: true,
      isActive: true
    });
  };
  
  // Get step name from step ID
  const getStepName = (stepId: number) => {
    const step = workflowSteps.find(s => s.id === stepId);
    return step ? step.name : `Unknown Step (${stepId})`;
  };
  
  return (
    <div className="mt-3 grid h-full grid-cols-1 gap-5">
      {/* Notification component */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="col-span-1">
        <Card extra="flex flex-col w-full p-6">
          <div className="flex items-center justify-between rounded-t-3xl p-3">
            <div className="text-2xl font-bold text-navy-700 dark:text-white">
              Document Workflow Tasks Configuration
            </div>
            
            <div className="flex items-center gap-2">
              {/* Filter dropdown */}
              <select
                value={filterStep || ''}
                onChange={(e) => setFilterStep(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 text-sm"
              >
                <option value="">All Steps</option>
                {workflowSteps.map(step => (
                  <option key={step.id} value={step.id}>
                    {step.name}
                  </option>
                ))}
              </select>
              
              {/* Add task button */}
              <button
                onClick={openAddTaskModal}
                className="flex items-center gap-1 rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600 focus:outline-none"
              >
                <MdAdd size={18} />
                Add Task
              </button>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mx-3 mb-3 flex items-center gap-2 rounded-md bg-red-100 p-3 text-sm text-red-600">
              <MdInfo size={20} className="text-red-500" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <MdClose size={18} />
              </button>
            </div>
          )}
          
          {/* Task Form Modal */}
          <TaskFormModal
            isOpen={isTaskModalOpen}
            isEditing={!!isEditingTask}
            taskData={newTaskData}
            onClose={handleCancel}
            onSubmit={isEditingTask ? handleEditTask : handleAddTask}
            onChange={handleInputChange}
          />
          
          {/* Task Table */}
          <div className="overflow-x-auto p-3">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
              <thead className="bg-gray-50 dark:bg-navy-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Task Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Workflow Step
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Default
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-700 bg-white dark:bg-navy-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"></div>
                      </div>
                      <span className="mt-2 inline-block">Loading tasks...</span>
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No workflow tasks found.
                      {filterStep && (
                        <span className="block mt-1">
                          Try <button 
                            onClick={() => setFilterStep(null)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
                          >
                            clearing the filter
                          </button> or add a new task.
                        </span>
                      )}
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-navy-800">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {task.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {task.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {getStepName(task.stepId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {task.defaultEnabled ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {task.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {/* Edit button */}
                          <button
                            onClick={() => startEditTask(task)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <MdEdit size={18} />
                          </button>
                          
                          {/* Delete button */}
                          <button
                            onClick={() => setTaskToDelete(task.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <MdDelete size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      
      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-navy-800">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Confirm Delete</h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this workflow task? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-navy-600 dark:text-white dark:hover:bg-navy-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTasksConfigPage;
