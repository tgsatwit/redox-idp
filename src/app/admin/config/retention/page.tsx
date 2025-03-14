'use client';
// @ts-nocheck

import React, { useState, useEffect } from 'react';
import Card from '@/components/card';
import { MdAdd, MdDelete, MdEdit, MdCheck, MdClose, MdInfo, MdRefresh } from 'react-icons/md';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useConfigStore } from '@/lib/config-store';
import { RetentionPolicy } from '@/lib/types';
import { RetentionPolicyDialog } from '@/components/admin/config/retention/retention-policy-dialog';
import { StorageSolutionsCard } from '@/components/admin/config/retention/storage-solutions-card';

// Helper functions for converting between days and years
const daysToYears = (days: number) => Number((days / 365).toFixed(2));
const yearsToDays = (years: number) => Math.round(years * 365);

// Notification component for success messages
interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
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

const columnHelper = createColumnHelper<RetentionPolicy>();

const RetentionPoliciesPage = () => {
  const { config, addRetentionPolicy, updateRetentionPolicy, deleteRetentionPolicy, setStorageSolutions, setRetentionPolicies } = useConfigStore();
  const [isOpen, setIsOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<RetentionPolicy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationYears: 1,
  });

  // Fetch storage solutions on component mount to ensure we have fresh data
  useEffect(() => {
    const fetchStorageSolutions = async () => {
      try {
        const response = await fetch('/api/update-config/storage-solutions');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch storage solutions: ${response.status}`);
        }
        
        const solutions = await response.json();
        
        // Set the storage solutions directly from the API
        setStorageSolutions(solutions);
      } catch (error) {
        console.error('Error fetching storage solutions:', error);
      }
    };
    
    // Immediately fetch storage solutions on mount
    fetchStorageSolutions();
  }, [setStorageSolutions]);

  // Fetch retention policies from API on component mount
  useEffect(() => {
    const fetchRetentionPolicies = async () => {
      setFetchLoading(true);
      
      try {
        const response = await fetch('/api/update-config/retention-policies');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch retention policies: ${response.status}`);
        }
        
        const policies = await response.json();
        
        // Replace all retention policies at once instead of adding individually
        // This ensures the local state matches exactly what's in the database
        setRetentionPolicies(policies.map(policy => {
          // Calculate total duration if not set, for backward compatibility
          if (!policy.totalDuration && policy.stages && policy.stages.length > 0) {
            policy.totalDuration = policy.stages.reduce((total, stage) => total + stage.duration, 0);
          }
          return policy;
        }));
        
      } catch (error) {
        console.error('Error fetching retention policies:', error);
        setError(`Failed to fetch retention policies: ${error.message}`);
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchRetentionPolicies();
  }, [setRetentionPolicies]);

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  const resetForm = () => {
    setEditingPolicy(null);
    setFormData({
      name: '',
      description: '',
      durationYears: 1,
    });
  };

  const handleModalOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleModalClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (policy: RetentionPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description,
      durationYears: daysToYears(policy.duration),
    });
    setIsOpen(true);
  };

  const handleDeleteConfirmation = (id: string) => {
    setPolicyToDelete(id);
  };

  const handleCancel = () => {
    setPolicyToDelete(null);
  };

  const handleDelete = async () => {
    if (!policyToDelete) return;
    
    setIsLoading(true);
    try {
      // First update local state
      deleteRetentionPolicy(policyToDelete);

      // Then update DynamoDB via API
      console.log(`Sending DELETE request to /api/update-config/retention-policies with ID: ${policyToDelete}`);
      const response = await fetch('/api/update-config/retention-policies', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ id: policyToDelete }),
      });

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorText = await response.text();
          errorDetail = errorText;
        } catch (textError) {
          console.error('Error reading response text:', textError);
        }
        throw new Error(`Failed to delete policy from database: ${response.status} - ${errorDetail || 'No error details'}`);
      }

      // Reset policy to delete and show success notification
      setPolicyToDelete(null);
      showNotification('Retention policy deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting retention policy from database:', error);
      setError(`Failed to delete policy: ${error.message}`);
      showNotification(`Failed to delete policy: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePolicy = async (policyData: { name: string; description: string; stages: any[] }) => {
    setIsLoading(true);
    try {
      // First update local state via the store
      if (editingPolicy) {
        updateRetentionPolicy(editingPolicy.id, policyData);
      } else {
        // Calculate total duration from stages for new policies
        const totalDuration = policyData.stages.reduce((total, stage) => total + stage.duration, 0);
        addRetentionPolicy({
          ...policyData,
          totalDuration,
          duration: totalDuration, // For backward compatibility
        });
      }

      // Then update DynamoDB via API
      if (editingPolicy) {
        // Update existing policy
        try {
          const response = await fetch('/api/update-config/retention-policies', {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ id: editingPolicy.id, ...policyData }),
          });
          
          if (!response.ok) {
            let errorDetail = '';
            try {
              const errorText = await response.text();
              errorDetail = errorText;
            } catch (textError) {
              console.error('Error reading response text:', textError);
            }
            throw new Error(`Failed to update policy in database: ${response.status} - ${errorDetail || 'No error details'}`);
          }

          showNotification('Retention policy updated successfully', 'success');
        } catch (error) {
          console.error('PUT request failed:', error);
          setError(`Failed to update policy: ${error.message}`);
          showNotification(`Failed to update policy: ${error.message}`, 'error');
          throw error;
        }
      } else {
        // Create new policy
        try {
          const response = await fetch('/api/update-config/retention-policies', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(policyData),
          });
          
          if (!response.ok) {
            let errorDetail = '';
            try {
              const errorText = await response.text();
              errorDetail = errorText;
            } catch (textError) {
              console.error('Error reading response text:', textError);
            }
            throw new Error(`Failed to create policy in database: ${response.status} - ${errorDetail || 'No error details'}`);
          }

          showNotification('Retention policy added successfully', 'success');
        } catch (error) {
          console.error('POST request failed:', error);
          setError(`Failed to create policy: ${error.message}`);
          showNotification(`Failed to create policy: ${error.message}`, 'error');
          throw error;
        }
      }

      handleModalClose();
    } catch (error) {
      console.error('Error saving retention policy to database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format the stages as readable text
  const formatRetentionStages = (policy: RetentionPolicy) => {
    if (!policy.stages || policy.stages.length === 0) {
      // Legacy policy with just duration
      return <span>{daysToYears(policy.duration)} years</span>;
    }

    // Get storage solution names for the stages
    return policy.stages.map((stage, index) => {
      const solution = config.storageSolutions.find(s => s.id === stage.storageSolutionId);
      const solutionName = solution ? solution.name : 'Unknown';
      const accessLevel = solution ? solution.accessLevel : '';
      
      let accessLevelClass = '';
      if (solution) {
        switch (solution.accessLevel) {
          case 'immediate':
            accessLevelClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            break;
          case '1-day':
            accessLevelClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            break;
          case '14-day':
            accessLevelClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            break;
          default:
            accessLevelClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        }
      }
      
      return (
        <div key={stage.id} className="mb-1 flex items-center text-xs">
          {index > 0 && <span className="mr-2 text-gray-400">→</span>}
          <span className={`inline-flex items-center rounded-full ${accessLevelClass} px-2 py-0.5 mr-1`}>
            {solutionName}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {daysToYears(stage.duration).toFixed(1)} years
          </span>
        </div>
      );
    });
  };

  const columns = [
    columnHelper.accessor('name', {
      id: 'name',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Name</span>,
      cell: (info) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor((row) => row, {
      id: 'stages',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Storage Stages</span>,
      cell: (info) => formatRetentionStages(info.getValue()),
    }),
    columnHelper.accessor('totalDuration', {
      id: 'totalDuration',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Total Duration</span>,
      cell: (info) => {
        const value = info.getValue() || info.row.original.duration; // Fallback to legacy duration field
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            {daysToYears(value)} years
          </span>
        );
      },
    }),
    columnHelper.accessor('id', {
      id: 'actions',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</span>,
      cell: (info) => {
        const policyId = info.getValue();
        const policy = config.retentionPolicies.find((p) => p.id === policyId);
        if (!policy) return null;
        
        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleEdit(policy)}
              disabled={isLoading}
              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <MdEdit size={18} />
            </button>
            <button
              onClick={() => handleDeleteConfirmation(policyId)}
              disabled={isLoading}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            >
              <MdDelete size={18} />
            </button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: config.retentionPolicies || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  return (
    <div className="mt-3 grid h-full grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Notification component */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Retention Policies Card */}
      <div className="lg:col-span-7">
        <Card extra="flex flex-col w-full p-6">
          <div className="flex items-center justify-between rounded-t-3xl p-3">
            <div className="text-2xl font-bold text-navy-700 dark:text-white">
              Retention Policies
            </div>
            <div className="flex items-center gap-2">
              {fetchLoading && (
                <div className="flex items-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"></div>
                </div>
              )}
              <button
                onClick={handleModalOpen}
                disabled={isLoading || fetchLoading || config.storageSolutions.length === 0}
                className="flex items-center gap-1 rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                title={config.storageSolutions.length === 0 ? "You must create at least one storage solution first" : undefined}
              >
                <MdAdd size={18} />
                Add Policy
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-3 mb-3 flex items-center gap-2 rounded-md bg-red-100 p-3 text-sm text-red-600">
              <MdInfo size={20} className="text-red-500" />
              <span>{error}</span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => {
                    setFetchLoading(true);
                    fetch('/api/update-config/retention-policies')
                      .then(response => {
                        if (!response.ok) {
                          throw new Error(`Failed to fetch retention policies: ${response.status}`);
                        }
                        return response.json();
                      })
                      .then(policies => {
                        // Replace all retention policies at once
                        setRetentionPolicies(policies.map(policy => {
                          // Calculate total duration if not set, for backward compatibility
                          if (!policy.totalDuration && policy.stages && policy.stages.length > 0) {
                            policy.totalDuration = policy.stages.reduce((total, stage) => total + stage.duration, 0);
                          }
                          return policy;
                        }));
                        setError(null);
                      })
                      .catch(error => {
                        console.error('Error fetching retention policies:', error);
                        setError(`Failed to fetch retention policies: ${error.message}`);
                      })
                      .finally(() => {
                        setFetchLoading(false);
                      });
                  }}
                  className="text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <MdRefresh size={18} />
                  Retry
                </button>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <MdClose size={18} />
                </button>
              </div>
            </div>
          )}

          {config.storageSolutions.length === 0 && (
            <div className="mx-3 mb-3 flex items-center gap-2 rounded-md bg-yellow-100 p-3 text-sm text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              <MdInfo size={20} className="text-yellow-500" />
              <span>You need to create at least one storage solution before creating retention policies.</span>
            </div>
          )}

          {/* Task Table */}
          <div className="overflow-x-auto p-3">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
              <thead className="bg-gray-50 dark:bg-navy-800">
                <tr>
                  {table.getHeaderGroups().map((headerGroup) => (
                    headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <span>
                          {{
                            asc: ' ↑',
                            desc: ' ↓',
                          }[header.column.getIsSorted() as string] ?? null}
                        </span>
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-700 bg-white dark:bg-navy-900">
                {isLoading || fetchLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"></div>
                      </div>
                      <span className="mt-2 inline-block">
                        {fetchLoading ? 'Loading retention policies...' : 'Processing...'}
                      </span>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-navy-800">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No retention policies configured. Click "Add Policy" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Storage Solutions Card */}
      <div className="lg:col-span-5">
        <StorageSolutionsCard onNotification={showNotification} />
      </div>

      <RetentionPolicyDialog
        isOpen={isOpen}
        onClose={handleModalClose}
        onSave={handleSavePolicy}
        policy={editingPolicy}
        isAdding={editingPolicy === null}
        storageSolutions={config.storageSolutions || []}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Modal */}
      {policyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-navy-800">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Confirm Delete</h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this retention policy? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-navy-600 dark:text-white dark:hover:bg-navy-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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

export default RetentionPoliciesPage;
