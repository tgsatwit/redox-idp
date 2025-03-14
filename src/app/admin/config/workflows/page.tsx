'use client';

import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdCheck, 
  MdClose, 
  MdInfo,
  MdApi,
  MdPerson,
  MdWarning,
  MdLink,
  MdToggleOn,
  MdToggleOff
} from 'react-icons/md';
import Card from '@/components/card';
import { WorkflowConfig, WorkflowType, WorkflowTaskConfig } from '@/lib/types';

// Workflow type icons and labels
const workflowTypeInfo = {
  API: {
    icon: <MdApi className="text-blue-500" size={24} />,
    label: 'API Workflow',
    description: 'Automated workflow triggered by API calls with defined input/output parameters'
  },
  User: {
    icon: <MdPerson className="text-green-500" size={24} />,
    label: 'User Workflow',
    description: 'Interactive workflow with configurable service toggles and data element settings'
  },
  Exception: {
    icon: <MdWarning className="text-amber-500" size={24} />,
    label: 'Exception Workflow',
    description: 'Manual processing workflow for handling failures in API workflows'
  }
};

// Add this after the workflowTypeInfo constant
const workflowTaskGroups = {
  'Basic Settings': ['task_autocls_documents', 'task_classify_llm', 'task_scan_tfn', 'task_fraud_check'],
  'Processing': ['task_identify_data', 'task_redact_elements', 'task_create_summary'],
  'Storage': ['task_save_original', 'task_save_redacted']
};

// Form interfaces
interface WorkflowFormData {
  name: string;
  description: string;
  type: WorkflowType;
  linkedWorkflowId?: string;
  tasks: {
    taskId: string;
    enabled: boolean;
    isRequired: boolean;
  }[];
  inputParameters?: string[];
  outputParameters?: string[];
  serviceToggles?: {
    [serviceId: string]: {
      defaultEnabled: boolean;
      userModifiable: boolean;
    }
  };
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

// Workflow Form Modal component
interface WorkflowFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: WorkflowFormData;
  availableTasks: WorkflowTaskConfig[];
  apiWorkflows?: WorkflowConfig[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | 
    { target: { name: string; value: any } }
  ) => void;
  setFormData: React.Dispatch<React.SetStateAction<WorkflowFormData>>;
}

const WorkflowFormModal: React.FC<WorkflowFormModalProps> = ({
  isOpen,
  isEditing,
  formData,
  availableTasks,
  apiWorkflows,
  onClose,
  onSubmit,
  onChange,
  setFormData
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'userGroups' | 'apiInfo'>('details');
  
  if (!isOpen) return null;

  // Sort tasks by step order
  const sortedTasks = [...availableTasks].sort((a, b) => a.stepId - b.stepId);

  // Helper to check if task settings differ from defaults
  const hasCustomSettings = (task: WorkflowTaskConfig, taskSetting?: { enabled: boolean; isRequired: boolean }) => {
    if (!taskSetting) return false;
    return taskSetting.enabled !== task.defaultEnabled || taskSetting.isRequired === true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative mx-auto h-fit min-h-[50vh] max-h-[85vh] w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-navy-800">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 rounded-t-lg border-b border-gray-200 bg-white px-6 py-4 dark:border-navy-600 dark:bg-navy-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {isEditing ? 'Edit Workflow' : 'Add New Workflow'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <MdClose size={24} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="mt-4 flex space-x-4 border-b border-gray-200 dark:border-navy-600">
            <button
              onClick={() => setActiveTab('details')}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                activeTab === 'details'
                  ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
              }`}
            >
              Workflow Details
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                activeTab === 'tasks'
                  ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
              }`}
            >
              Task Configuration
            </button>
            {(formData.type === 'User' || formData.type === 'Exception') && (
              <button
                onClick={() => setActiveTab('userGroups')}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                  activeTab === 'userGroups'
                    ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                }`}
              >
                User Groups
              </button>
            )}
            {formData.type === 'API' && (
              <button
                onClick={() => setActiveTab('apiInfo')}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                  activeTab === 'apiInfo'
                    ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                }`}
              >
                API Information
              </button>
            )}
          </div>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          <form onSubmit={(e) => e.preventDefault()}>
            {activeTab === 'details' ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    className="block w-full px-3 py-2 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={onChange}
                    rows={3}
                    className="block w-full px-3 py-2 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Workflow Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    {Object.entries(workflowTypeInfo).map(([type, info]) => (
                      <div 
                        key={type}
                        onClick={() => onChange({ target: { name: 'type', value: type } })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.type === type
                            ? 'bg-brand-50 border-brand-500 dark:bg-brand-900/30 dark:border-brand-400'
                            : 'bg-white dark:bg-navy-700 border-gray-300 dark:border-navy-600 hover:bg-gray-50 dark:hover:bg-navy-600'
                        }`}
                      >
                        <div className="flex items-center justify-center h-10 w-10 mb-2">
                          {info.icon}
                        </div>
                        <span className={`text-sm font-medium ${
                          formData.type === type
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}>
                          {info.label}
                        </span>
                        <p className="mt-1 text-xs text-center text-gray-500 dark:text-gray-400">
                          {info.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {formData.type === 'Exception' && (
                  <div>
                    <label htmlFor="linkedWorkflowId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Linked API Workflow
                    </label>
                    <select
                      id="linkedWorkflowId"
                      name="linkedWorkflowId"
                      value={formData.linkedWorkflowId || ''}
                      onChange={onChange}
                      className="block w-full px-3 py-2 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:text-white"
                      required
                    >
                      <option value="">Select an API workflow</option>
                      {apiWorkflows.map(workflow => (
                        <option key={workflow.id} value={workflow.id}>
                          {workflow.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : activeTab === 'tasks' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Configure which tasks are included in this workflow and their settings.
                </p>
                
                {sortedTasks.map(task => {
                  const taskSetting = formData.tasks.find(t => t.taskId === task.id);
                  const isCustomized = hasCustomSettings(task, taskSetting);
                  
                  return (
                    <div
                      key={task.id}
                      className="flex items-start justify-between py-3 px-4 border-b border-gray-100 dark:border-navy-700 hover:bg-gray-50/50 dark:hover:bg-navy-800/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {task.name}
                          </h5>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-navy-700 dark:text-gray-400">
                            Step {task.stepId}
                          </span>
                          {isCustomized && (
                            <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {task.description}
                        </p>
                        {!isCustomized && (
                          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            <span className="italic">Using default settings</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Required Toggle */}
                        <div className="flex items-center">
                          <div className="relative flex flex-col items-center justify-center rounded-md p-1">
                            <span className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Required</span>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={taskSetting?.isRequired || false}
                                onChange={(e) => {
                                  const updatedTasks = [...formData.tasks];
                                  const taskIndex = updatedTasks.findIndex(t => t.taskId === task.id);
                                  if (taskIndex >= 0) {
                                    updatedTasks[taskIndex] = {
                                      ...updatedTasks[taskIndex],
                                      isRequired: e.target.checked
                                    };
                                  } else {
                                    updatedTasks.push({
                                      taskId: task.id,
                                      enabled: task.defaultEnabled,
                                      isRequired: e.target.checked
                                    });
                                  }
                                  onChange({
                                    target: {
                                      name: 'tasks',
                                      value: updatedTasks
                                    }
                                  });
                                }}
                                className="sr-only peer"
                              />
                              <div
                                className={`h-5 w-9 rounded-full transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full
                                  ${taskSetting?.isRequired 
                                    ? 'bg-amber-500 dark:bg-amber-600' 
                                    : 'bg-gray-300 dark:bg-navy-600'
                                  }`}
                              />
                            </label>
                          </div>
                        </div>
                        
                        {/* Enabled/Disabled Toggle */}
                        <div className="flex items-center">
                          <div className="relative flex flex-col items-center justify-center rounded-md p-1">
                            <span className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Enabled</span>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={taskSetting?.enabled ?? task.defaultEnabled}
                                onChange={(e) => {
                                  const updatedTasks = [...formData.tasks];
                                  const taskIndex = updatedTasks.findIndex(t => t.taskId === task.id);
                                  const newEnabled = e.target.checked;
                            
                                  if (taskIndex >= 0) {
                                    // If toggling back to default and not required, remove the task
                                    if (newEnabled === task.defaultEnabled && !updatedTasks[taskIndex].isRequired) {
                                      updatedTasks.splice(taskIndex, 1);
                                    } else {
                                      updatedTasks[taskIndex] = {
                                        ...updatedTasks[taskIndex],
                                        enabled: newEnabled
                                      };
                                    }
                                  } else if (newEnabled !== task.defaultEnabled) {
                                    updatedTasks.push({
                                      taskId: task.id,
                                      enabled: newEnabled,
                                      isRequired: false
                                    });
                                  }
                            
                                  onChange({
                                    target: {
                                      name: 'tasks',
                                      value: updatedTasks
                                    }
                                  });
                                }}
                                className="sr-only peer"
                              />
                              <div
                                className={`h-5 w-9 rounded-full transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full
                                  ${(taskSetting?.enabled ?? task.defaultEnabled) 
                                    ? 'bg-green-500 dark:bg-green-600' 
                                    : 'bg-gray-300 dark:bg-navy-600'
                                  }`}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === 'userGroups' ? (
              <div className="p-4 bg-gray-50 rounded-lg dark:bg-navy-700">
                <p className="text-gray-500 dark:text-gray-400">
                  User group configuration is not available in this prototype.
                </p>
              </div>
            ) : activeTab === 'apiInfo' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Input Parameters
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 min-h-[80px] bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md">
                    {formData.inputParameters && formData.inputParameters.map((param, index) => (
                      <div 
                        key={index}
                        className="flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-3 py-1 text-sm"
                      >
                        <span>{param}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedParams = [...formData.inputParameters || []];
                            updatedParams.splice(index, 1);
                            onChange({
                              target: {
                                name: 'inputParameters',
                                value: updatedParams
                              }
                            });
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder="Add parameter (press Enter)"
                      className="flex-1 min-w-[150px] border-0 p-1 focus:ring-0 bg-transparent dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          const newParam = e.currentTarget.value.trim();
                          if (!formData.inputParameters?.includes(newParam)) {
                            onChange({
                              target: {
                                name: 'inputParameters',
                                value: [...(formData.inputParameters || []), newParam]
                              }
                            });
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Type parameter name and press Enter to add
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Output Parameters
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 min-h-[80px] bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md">
                    {formData.outputParameters && formData.outputParameters.map((param, index) => (
                      <div 
                        key={index}
                        className="flex items-center bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full px-3 py-1 text-sm"
                      >
                        <span>{param}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedParams = [...formData.outputParameters || []];
                            updatedParams.splice(index, 1);
                            onChange({
                              target: {
                                name: 'outputParameters',
                                value: updatedParams
                              }
                            });
                          }}
                          className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder="Add parameter (press Enter)"
                      className="flex-1 min-w-[150px] border-0 p-1 focus:ring-0 bg-transparent dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          const newParam = e.currentTarget.value.trim();
                          if (!formData.outputParameters?.includes(newParam)) {
                            onChange({
                              target: {
                                name: 'outputParameters',
                                value: [...(formData.outputParameters || []), newParam]
                              }
                            });
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Type parameter name and press Enter to add
                  </p>
                </div>
              </div>
            ) : null}
          </form>
        </div>
        
        {/* Modal Footer - Sticky */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 rounded-b-lg border-t border-gray-200 bg-white px-6 py-4 dark:border-navy-600 dark:bg-navy-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-navy-600 dark:bg-navy-700 dark:text-gray-300 dark:hover:bg-navy-600"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    isActive: !prev.isActive
                  }));
                }}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              >
                <span
                  className={`${
                    formData.isActive ? 'translate-x-5 bg-green-500' : 'translate-x-0 bg-gray-300 dark:bg-navy-600'
                  } pointer-events-none relative inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out`}
                >
                  <span
                    className={`${
                      formData.isActive ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200'
                    } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                  >
                    <MdClose size={12} className="text-white" />
                  </span>
                  <span
                    className={`${
                      formData.isActive ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
                    } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                  >
                    <MdCheck size={12} className="text-white" />
                  </span>
                </span>
                <span
                  className={`${
                    formData.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-navy-600'
                  } absolute inset-0 h-full w-full rounded-full transition-colors duration-200 ease-in-out`}
                />
              </button>
            </div>
          </div>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              onSubmit(e as any);
            }}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:hover:bg-brand-400"
          >
            {isEditing ? 'Update' : 'Create'} Workflow
          </button>
        </div>
      </div>
    </div>
  );
};

// Add this after the WorkflowFormModal component
interface WorkflowSectionProps {
  type: WorkflowType;
  workflows: WorkflowConfig[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const WorkflowSection: React.FC<WorkflowSectionProps> = ({ type, workflows, onEdit, onDelete }) => {
  const typeInfo = workflowTypeInfo[type];

  return (
    <div className="mt-4 pl-6 pb-6">
      <div className="flex items-center mb-4">
        {typeInfo.icon}
        <h2 className="ml-2 text-xl font-bold text-navy-700 dark:text-white">
          {typeInfo.label}
        </h2>
      </div>
      
      {workflows.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No workflows found for this type.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map(workflow => (
            <Card 
              key={workflow.id} 
              extra="p-4 hover:shadow-lg transition-all duration-200 bg-white dark:bg-navy-700/60 border border-gray-200 dark:border-navy-600"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-medium text-navy-700 dark:text-white">
                  {workflow.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {workflow.id}
                </span>
              </div>
              
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {workflow.description}
              </p>
              
              {workflow.type === 'Exception' && workflow.linkedWorkflowId && (
                <div className="mb-2 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <MdLink size={16} />
                  <span>
                    Linked to: {workflows.find(w => w.id === workflow.linkedWorkflowId)?.name}
                  </span>
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${workflow.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                >
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(workflow.id)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-navy-600 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <MdEdit size={20} />
                  </button>
                  <button
                    onClick={() => onDelete(workflow.id)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-navy-600 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Add these new components for the redesigned UI
interface WorkflowListItemProps {
  workflow: WorkflowConfig;
  isSelected: boolean;
  onClick: () => void;
}

const WorkflowListItem: React.FC<WorkflowListItemProps> = ({ workflow, isSelected, onClick }) => {
  const typeInfo = workflowTypeInfo[workflow.type];
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 mb-2 rounded-lg transition-colors ${
        isSelected 
          ? 'bg-indigo-50 border-l-4 border-indigo-500 dark:bg-indigo-900/30 dark:border-indigo-400'
          : 'hover:bg-gray-50 dark:hover:bg-navy-700/50'
      }`}
    >
      <div className="flex items-center gap-3">
        {typeInfo.icon}
        <div className="overflow-hidden">
          <h3 className={`font-medium truncate ${
            isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
          }`}>
            {workflow.name}
          </h3>
          <div className="flex items-center mt-1">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs
                ${workflow.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }`}
            >
              {workflow.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="ml-2 text-xs text-gray-500 truncate dark:text-gray-400">
              {workflow.type}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

interface ConfigCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onEdit?: () => void;
}

const ConfigCard: React.FC<ConfigCardProps> = ({ title, icon, children, onEdit }) => {
  return (
    <Card extra="p-4 mb-4 bg-white dark:bg-navy-700/60 border border-gray-200 dark:border-navy-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {icon}
          <h3 className="ml-2 text-lg font-medium text-navy-700 dark:text-white">
            {title}
          </h3>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-navy-600 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <MdEdit size={20} />
          </button>
        )}
      </div>
      <div className="text-gray-600 dark:text-gray-400">
        {children}
      </div>
    </Card>
  );
};

// Replace the WorkflowsConfigPage component with this redesigned version
const WorkflowsConfigPage = () => {
  // State variables
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [availableTasks, setAvailableTasks] = useState<WorkflowTaskConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    type: 'API',
    tasks: [],
    inputParameters: [],
    outputParameters: [],
    isActive: true
  });
  
  // Selected workflow state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  
  // Edit card states
  const [editingCard, setEditingCard] = useState<'details' | 'tasks' | 'userGroups' | 'apiInfo' | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Load workflows and tasks on initial render
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch workflows
        const workflowsResponse = await fetch('/api/update-config/workflows');
        if (!workflowsResponse.ok) throw new Error('Failed to fetch workflows');
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData);
        
        // Set the first workflow as selected by default if any exist
        if (workflowsData.length > 0 && !selectedWorkflowId) {
          setSelectedWorkflowId(workflowsData[0].id);
        }
        
        // Fetch available tasks
        const tasksResponse = await fetch('/api/update-config/workflow-tasks');
        if (!tasksResponse.ok) throw new Error('Failed to fetch workflow tasks');
        const tasksData = await tasksResponse.json();
        setAvailableTasks(tasksData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedWorkflowId]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | 
    { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      
      // Validate API workflow requirements
      if (formData.type === 'API') {
        if (!formData.inputParameters?.length) {
          throw new Error('API workflows must define at least one input parameter');
        }
        if (!formData.outputParameters?.length) {
          throw new Error('API workflows must define at least one output parameter');
        }
      }
      
      // Validate Exception workflow requirements
      if (formData.type === 'Exception' && !formData.linkedWorkflowId) {
        throw new Error('Exception workflows must be linked to an API workflow');
      }

      const url = isEditing 
        ? `/api/update-config/workflows/${isEditing}`
        : '/api/update-config/workflows';
        
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} workflow`);
      }
      
      // Refresh workflows
      const workflowsResponse = await fetch('/api/update-config/workflows');
      if (!workflowsResponse.ok) throw new Error('Failed to fetch updated workflows');
      const workflowsData = await workflowsResponse.json();
      setWorkflows(workflowsData);
      
      // If creating new workflow, select it
      if (!isEditing) {
        // Find the new workflow (assuming it's the last one added)
        const newWorkflow = workflowsData.find(w => w.name === formData.name);
        if (newWorkflow) {
          setSelectedWorkflowId(newWorkflow.id);
        }
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        type: 'API',
        tasks: [],
        inputParameters: [],
        outputParameters: [],
        isActive: true
      });
      setIsFormOpen(false);
      setIsEditing(null);
      setEditingCard(null);
      
      // Show success notification
      setNotification({
        message: `Workflow ${isEditing ? 'updated' : 'created'} successfully`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error submitting workflow:', err);
      setNotification({
        message: err.message || `Failed to ${isEditing ? 'update' : 'create'} workflow`,
        type: 'error'
      });
    }
  };

  // Handle workflow deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      const response = await fetch(`/api/update-config/workflows/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workflow');
      }
      
      // Remove workflow from state
      setWorkflows(prev => prev.filter(w => w.id !== id));
      
      // If the deleted workflow was selected, select the first one
      if (selectedWorkflowId === id) {
        const remainingWorkflows = workflows.filter(w => w.id !== id);
        setSelectedWorkflowId(remainingWorkflows.length > 0 ? remainingWorkflows[0].id : null);
      }
      
      // Show success notification
      setNotification({
        message: 'Workflow deleted successfully',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error deleting workflow:', err);
      setNotification({
        message: err.message || 'Failed to delete workflow',
        type: 'error'
      });
    }
  };

  // Get selected workflow
  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);

  // Get API workflows for Exception workflow linking
  const apiWorkflows = workflows.filter(w => w.type === 'API');

  // Start editing a card
  const handleEditCard = (cardType: 'details' | 'tasks' | 'userGroups' | 'apiInfo') => {
    if (!selectedWorkflow) return;
    
    setEditingCard(cardType);
    setIsEditing(selectedWorkflow.id);
    setFormData({
      name: selectedWorkflow.name,
      description: selectedWorkflow.description,
      type: selectedWorkflow.type,
      linkedWorkflowId: selectedWorkflow.linkedWorkflowId,
      tasks: selectedWorkflow.tasks || [],
      inputParameters: selectedWorkflow.inputParameters || [],
      outputParameters: selectedWorkflow.outputParameters || [],
      serviceToggles: selectedWorkflow.serviceToggles,
      isActive: selectedWorkflow.isActive
    });
  };

  // Update the add workflow button click handler
  const handleAddWorkflowClick = () => {
    setIsEditing(null);
    setEditingCard(null);
    setFormData({
      name: '',
      description: '',
      type: 'API',
      tasks: [],
      inputParameters: [],
      outputParameters: [],
      isActive: true
    });
    setIsFormOpen(true);
  };

  // Find tasks for the selected workflow
  const getWorkflowTasks = () => {
    if (!selectedWorkflow || !availableTasks.length) return [];
    
    return availableTasks.map(task => {
      const workflowTask = selectedWorkflow.tasks?.find(t => t.taskId === task.id);
      return {
        ...task,
        enabled: workflowTask?.enabled ?? task.defaultEnabled,
        isRequired: workflowTask?.isRequired ?? false
      };
    }).sort((a, b) => a.stepId - b.stepId);
  };

  return (
    <div className="mt-3 h-full p-6 dark:bg-navy-900 min-h-screen">
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
            Workflow Configuration
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage and configure workflows for different types
          </p>
        </div>
          
        <button
          onClick={handleAddWorkflowClick}
          className="flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 shadow-md"
        >
          <MdAdd size={20} />
          Add Workflow
        </button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      ) : workflows.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">
            No workflows found. Click "Add Workflow" to create one.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column - Workflow List */}
          <div className="md:col-span-3 md:row-span-3">
            <Card extra="bg-white dark:bg-navy-800 shadow-sm dark:shadow-gray-900/10 overflow-hidden">
              <CardHeader>
                <div className="mb-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Workflows</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select a workflow to configure</p>
                </div>
                
                {/* Type Filters */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {Object.entries(workflowTypeInfo).map(([type, info]) => (
                    <div 
                      key={type}
                      className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-navy-700 dark:text-gray-300"
                    >
                      {info.icon}
                      <span className="text-xs">{type}</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Workflow List */}
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {workflows.map(workflow => (
                    <WorkflowListItem
                      key={workflow.id}
                      workflow={workflow}
                      isSelected={selectedWorkflowId === workflow.id}
                      onClick={() => setSelectedWorkflowId(workflow.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Configuration Cards */}
          <div className="md:col-span-9">
            {selectedWorkflow ? (
              <>
                {/* Workflow Details Header Card */}
                <div className="bg-brand-600 text-white rounded-lg shadow-sm overflow-hidden mb-6">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-2xl font-semibold text-white">
                        {selectedWorkflow.name}
                      </h2>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setFormData({
                              name: selectedWorkflow.name,
                              description: selectedWorkflow.description,
                              type: selectedWorkflow.type,
                              linkedWorkflowId: selectedWorkflow.linkedWorkflowId,
                              tasks: selectedWorkflow.tasks || [],
                              inputParameters: selectedWorkflow.inputParameters || [],
                              outputParameters: selectedWorkflow.outputParameters || [],
                              serviceToggles: selectedWorkflow.serviceToggles,
                              isActive: selectedWorkflow.isActive
                            });
                            setIsEditing(selectedWorkflow.id);
                            setIsFormOpen(true);
                          }}
                          className="border border-white/20 bg-transparent hover:bg-brand-700 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center"
                        >
                          <MdEdit className="mr-1" size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(selectedWorkflow.id)}
                          className="border border-white/20 bg-transparent hover:bg-brand-700 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center"
                        >
                          <MdDelete className="mr-1" size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-white/80 mb-3">
                      {selectedWorkflow.description || 'No description available'}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 items-center mt-3">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/update-config/workflows/${selectedWorkflow.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                isActive: !selectedWorkflow.isActive
                              })
                            });
                            
                            if (!response.ok) throw new Error('Failed to update status');
                            
                            // Update workflows
                            const updatedWorkflows = workflows.map(w => 
                              w.id === selectedWorkflow.id 
                                ? { ...w, isActive: !w.isActive } 
                                : w
                            );
                            setWorkflows(updatedWorkflows);
                            
                            setNotification({
                              message: `Workflow ${!selectedWorkflow.isActive ? 'activated' : 'deactivated'} successfully`,
                              type: 'success'
                            });
                          } catch (err: any) {
                            console.error('Error updating status:', err);
                            setNotification({
                              message: err.message || 'Failed to update status',
                              type: 'error'
                            });
                          }
                        }}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          selectedWorkflow.isActive
                            ? 'bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {selectedWorkflow.isActive ? (
                          <>
                            <MdToggleOn size={16} className="mr-1" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <MdToggleOff size={16} className="mr-1" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                      
                      <div className="text-sm text-white/80 flex items-center">
                        {workflowTypeInfo[selectedWorkflow.type].icon}
                        <span className="ml-1">{workflowTypeInfo[selectedWorkflow.type].label}</span>
                      </div>
                      
                      <div className="text-sm text-white/80 flex items-center ml-4">
                        <MdCheck className="mr-1" size={14} />
                        <span>{selectedWorkflow.tasks?.length || 0} tasks configured</span>
                      </div>
                      
                      {selectedWorkflow.type === 'Exception' && selectedWorkflow.linkedWorkflowId && (
                        <div className="text-sm text-white/80 flex items-center ml-2">
                          <MdLink className="mr-1" size={14} />
                          <span>
                            Linked to: {workflows.find(w => w.id === selectedWorkflow.linkedWorkflowId)?.name}
                          </span>
                        </div>
                      )}
                      
                      <div className="ml-auto text-xs text-white/60">
                        <span>ID: {selectedWorkflow.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tasks Configuration Card */}
                <Card extra="mb-6 bg-white dark:bg-navy-800 shadow-sm dark:shadow-gray-900/10 overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MdCheck size={24} className="text-green-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Tasks Configuration
                        </h3>
                      </div>
                      <button
                        onClick={() => handleEditCard('tasks')}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <MdEdit size={20} />
                      </button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      {getWorkflowTasks().map((task) => {
                        const isCustomized = 
                          task.enabled !== task.defaultEnabled ||
                          task.isRequired === true;
                        
                        return (
                          <div 
                            key={task.id}
                            className="flex items-start justify-between py-3 px-4 border-b border-gray-100 dark:border-navy-700 hover:bg-gray-50/50 dark:hover:bg-navy-800/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-navy-700 dark:text-white">{task.name}</h4>
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-navy-700 dark:text-gray-400">
                                  Step {task.stepId}
                                </span>
                                {isCustomized && (
                                  <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                              
                              {/* Default settings note */}
                              {!isCustomized && (
                                <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                  <span className="italic">Using default settings</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Required Toggle */}
                              <div className="flex items-center">
                                <div className="relative flex flex-col items-center justify-center rounded-md p-1">
                                  <span className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Required</span>
                                  <label className="relative inline-flex cursor-pointer items-center">
                                    <input 
                                      type="checkbox" 
                                      checked={task.isRequired}
                                      className="peer sr-only" 
                                      readOnly
                                    />
                                    <div 
                                      onClick={async () => {
                                        try {
                                          // Update tasks with new required state
                                          const updatedTasks = [...(selectedWorkflow?.tasks || [])];
                                          const taskIndex = updatedTasks.findIndex(t => t.taskId === task.id);
                                          const newRequired = !task.isRequired;
                                          
                                          if (taskIndex >= 0) {
                                            updatedTasks[taskIndex] = {
                                              ...updatedTasks[taskIndex],
                                              isRequired: newRequired
                                            };
                                          } else {
                                            updatedTasks.push({
                                              taskId: task.id,
                                              enabled: task.enabled,
                                              isRequired: newRequired
                                            });
                                          }
                                          
                                          // Update workflow
                                          const response = await fetch(`/api/update-config/workflows/${selectedWorkflow?.id}`, {
                                            method: 'PATCH',
                                            headers: {
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                              tasks: updatedTasks
                                            })
                                          });
                                          
                                          if (!response.ok) throw new Error('Failed to update task');
                                          
                                          // Update workflows
                                          const updatedWorkflows = workflows.map(w => 
                                            w.id === selectedWorkflow?.id 
                                              ? { ...w, tasks: updatedTasks } 
                                              : w
                                          );
                                          setWorkflows(updatedWorkflows);
                                          
                                          setNotification({
                                            message: `Task ${newRequired ? 'marked as required' : 'marked as optional'}`,
                                            type: 'success'
                                          });
                                        } catch (err: any) {
                                          console.error('Error updating task:', err);
                                          setNotification({
                                            message: err.message || 'Failed to update task',
                                            type: 'error'
                                          });
                                        }
                                      }}
                                      className={`h-5 w-9 rounded-full transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full
                                        ${task.isRequired 
                                          ? 'bg-amber-500 dark:bg-amber-600' 
                                          : 'bg-gray-300 dark:bg-navy-600'
                                        }`}
                                    />
                                  </label>
                                </div>
                              </div>
                              
                              {/* Enabled/Disabled Toggle */}
                              <div className="flex items-center">
                                <div className="relative flex flex-col items-center justify-center rounded-md p-1">
                                  <span className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Enabled</span>
                                  <label className="relative inline-flex cursor-pointer items-center">
                                    <input 
                                      type="checkbox" 
                                      checked={task.enabled}
                                      className="peer sr-only" 
                                      readOnly
                                    />
                                    <div 
                                      onClick={async () => {
                                        try {
                                          // Update tasks with new enabled state
                                          const updatedTasks = [...(selectedWorkflow?.tasks || [])];
                                          const taskIndex = updatedTasks.findIndex(t => t.taskId === task.id);
                                          const newEnabled = !task.enabled;
                                          
                                          if (taskIndex >= 0) {
                                            // If reverting to default and not required, remove
                                            if (newEnabled === task.defaultEnabled && !updatedTasks[taskIndex].isRequired) {
                                              updatedTasks.splice(taskIndex, 1);
                                            } else {
                                              updatedTasks[taskIndex] = {
                                                ...updatedTasks[taskIndex],
                                                enabled: newEnabled
                                              };
                                            }
                                          } else if (newEnabled !== task.defaultEnabled) {
                                            updatedTasks.push({
                                              taskId: task.id,
                                              enabled: newEnabled,
                                              isRequired: false
                                            });
                                          }
                                          
                                          // Update workflow
                                          const response = await fetch(`/api/update-config/workflows/${selectedWorkflow?.id}`, {
                                            method: 'PATCH',
                                            headers: {
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                              tasks: updatedTasks
                                            })
                                          });
                                          
                                          if (!response.ok) throw new Error('Failed to update task');
                                          
                                          // Update workflows
                                          const updatedWorkflows = workflows.map(w => 
                                            w.id === selectedWorkflow?.id 
                                              ? { ...w, tasks: updatedTasks } 
                                              : w
                                          );
                                          setWorkflows(updatedWorkflows);
                                          
                                          setNotification({
                                            message: `Task ${newEnabled ? 'enabled' : 'disabled'}`,
                                            type: 'success'
                                          });
                                        } catch (err: any) {
                                          console.error('Error updating task:', err);
                                          setNotification({
                                            message: err.message || 'Failed to update task',
                                            type: 'error'
                                          });
                                        }
                                      }}
                                      className={`h-5 w-9 rounded-full transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full
                                        ${task.enabled 
                                          ? 'bg-green-500 dark:bg-green-600' 
                                          : 'bg-gray-300 dark:bg-navy-600'
                                        }`}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                {/* API Information Card - only for API type */}
                {selectedWorkflow.type === 'API' && (
                  <Card extra="mb-6 bg-white dark:bg-navy-800 shadow-sm dark:shadow-gray-900/10 overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MdApi size={24} className="text-blue-500 mr-2" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            API Information
                          </h3>
                        </div>
                        <button
                          onClick={() => handleEditCard('apiInfo')}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <MdEdit size={20} />
                        </button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Input Parameters</h4>
                          {selectedWorkflow.inputParameters && selectedWorkflow.inputParameters.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedWorkflow.inputParameters.map((param, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                >
                                  {param}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No input parameters defined</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Output Parameters</h4>
                          {selectedWorkflow.outputParameters && selectedWorkflow.outputParameters.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedWorkflow.outputParameters.map((param, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                >
                                  {param}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No output parameters defined</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* User Groups Card - only for User and Exception types */}
                {(selectedWorkflow.type === 'User' || selectedWorkflow.type === 'Exception') && (
                  <Card extra="mb-6 bg-white dark:bg-navy-800 shadow-sm dark:shadow-gray-900/10 overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MdPerson size={24} className="text-amber-500 mr-2" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            User Groups
                          </h3>
                        </div>
                        <button
                          onClick={() => handleEditCard('userGroups')}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <MdEdit size={20} />
                        </button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm">
                        Configure which user groups have access to this workflow.
                      </p>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg dark:bg-navy-800">
                        <p className="text-sm italic text-gray-500 dark:text-gray-400">
                          User group configuration not implemented in this prototype.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-8 rounded-lg border border-dashed border-gray-200 dark:border-navy-700">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No workflow selected</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select a workflow from the list or create a new one.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workflow Form Modal */}
      <WorkflowFormModal
        isOpen={isFormOpen}
        isEditing={!!isEditing}
        formData={formData}
        availableTasks={availableTasks}
        apiWorkflows={apiWorkflows}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditing(null);
          setEditingCard(null);
          setFormData({
            name: '',
            description: '',
            type: 'API',
            tasks: [],
            inputParameters: [],
            outputParameters: [],
            isActive: true
          });
        }}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
        setFormData={setFormData}
      />
    </div>
  );
};

// Define Card components similar to documents page
const CardHeader = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={`p-4 border-b border-gray-100 dark:border-navy-700 ${className || ""}`}>
    {children}
  </div>
);

const CardContent = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={`p-4 ${className || ""}`}>
    {children}
  </div>
);

export default WorkflowsConfigPage;
