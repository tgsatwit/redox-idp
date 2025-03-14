'use client';

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
import { StorageSolution } from '@/lib/types';
import { StorageSolutionDialog } from './storage-solution-dialog';

interface StorageSolutionsCardProps {
  onNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const columnHelper = createColumnHelper<StorageSolution>();

export const StorageSolutionsCard: React.FC<StorageSolutionsCardProps> = ({ onNotification }) => {
  const { config, addStorageSolution, updateStorageSolution, deleteStorageSolution, setStorageSolutions } = useConfigStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editingSolution, setEditingSolution] = useState<StorageSolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solutionToDelete, setSolutionToDelete] = useState<string | null>(null);

  // Fetch storage solutions from API on component mount
  const fetchStorageSolutions = async () => {
    setFetchLoading(true);
    setError(null);
    
    try {
      // Always start with an empty array to avoid any duplicates
      setStorageSolutions([]);
      
      const response = await fetch('/api/update-config/storage-solutions');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch storage solutions: ${response.status}`);
      }
      
      const solutions = await response.json();
      
      // Replace all storage solutions at once
      setStorageSolutions(solutions);
      
    } catch (error) {
      console.error('Error fetching storage solutions:', error);
      handleApiError(error, 'fetching');
    } finally {
      setFetchLoading(false);
    }
  };

  // Immediately fetch storage solutions when component mounts
  useEffect(() => {
    fetchStorageSolutions();
  }, []);

  const resetForm = () => {
    setEditingSolution(null);
  };

  const handleModalOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleModalClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (solution: StorageSolution) => {
    setEditingSolution(solution);
    setIsOpen(true);
  };

  const handleDeleteConfirmation = (id: string) => {
    setSolutionToDelete(id);
  };

  const handleCancel = () => {
    setSolutionToDelete(null);
  };

  // Handle API errors more gracefully
  const handleApiError = (error: any, operation: string) => {
    console.error(`Error ${operation} storage solution:`, error);
    let errorMessage = `Failed to ${operation} storage solution`;
    
    if (error.response) {
      try {
        // Try to extract error message from response
        const errorData = error.response.data;
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    setError(errorMessage);
    onNotification(errorMessage, 'error');
  };

  const handleSaveSolution = async (solutionData: Omit<StorageSolution, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let apiResponse;
      
      if (editingSolution) {
        // Update via API first
        const response = await fetch('/api/update-config/storage-solutions', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ id: editingSolution.id, ...solutionData }),
        });
        
        if (!response.ok) {
          let errorDetail = '';
          try {
            const errorData = await response.json();
            errorDetail = errorData.error || errorData.details || '';
          } catch (textError) {
            const errorText = await response.text();
            errorDetail = errorText;
          }
          throw new Error(`Failed to update storage solution in database: ${response.status} - ${errorDetail || 'No error details'}`);
        }
        
        // If API succeeds, update local state
        apiResponse = await response.json();
        updateStorageSolution(editingSolution.id, apiResponse);
        onNotification('Storage solution updated successfully', 'success');
      } else {
        // Create via API first
        const response = await fetch('/api/update-config/storage-solutions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(solutionData),
        });
        
        if (!response.ok) {
          let errorDetail = '';
          try {
            const errorData = await response.json();
            errorDetail = errorData.error || errorData.details || '';
          } catch (textError) {
            const errorText = await response.text();
            errorDetail = errorText;
          }
          throw new Error(`Failed to create storage solution in database: ${response.status} - ${errorDetail || 'No error details'}`);
        }
        
        // If API succeeds, update local state with the response
        apiResponse = await response.json();
        addStorageSolution(apiResponse);
        onNotification('Storage solution added successfully', 'success');
      }

      handleModalClose();
    } catch (error) {
      handleApiError(error, editingSolution ? 'updating' : 'creating');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!solutionToDelete) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if the storage solution is used by any retention policy before removing from local state
      const isUsed = config.retentionPolicies.some(policy => 
        policy.stages && policy.stages.some(stage => stage.storageSolutionId === solutionToDelete)
      );
      
      if (isUsed) {
        throw new Error('Cannot delete storage solution that is in use by retention policies');
      }
      
      // Try to delete via API first
      const response = await fetch('/api/update-config/storage-solutions', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ id: solutionToDelete }),
      });

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || errorData.details || '';
        } catch (textError) {
          const errorText = await response.text();
          errorDetail = errorText;
        }
        throw new Error(`Failed to delete storage solution from database: ${response.status} - ${errorDetail || 'No error details'}`);
      }

      // Only update local state if API delete was successful
      deleteStorageSolution(solutionToDelete);
      
      // Reset solution to delete and show success notification
      setSolutionToDelete(null);
      onNotification('Storage solution deleted successfully', 'success');
    } catch (error) {
      handleApiError(error, 'deleting');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAccessLevel = (level: string) => {
    switch (level) {
      case 'immediate':
        return 'Immediate Access';
      case '1-day':
        return '1-Day Retrieval';
      case '14-day':
        return '14-Day Retrieval';
      default:
        return level;
    }
  };

  const accessLevelColorClass = (level: string) => {
    switch (level) {
      case 'immediate':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case '1-day':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case '14-day':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
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
    columnHelper.accessor('accessLevel', {
      id: 'accessLevel',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Access Level</span>,
      cell: (info) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${accessLevelColorClass(info.getValue())}`}>
          {formatAccessLevel(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('costPerGbPerMonth', {
      id: 'costPerGbPerMonth',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Cost (¢/GB/month)</span>,
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {(value !== undefined && value !== null) ? value.toFixed(4) : '0.0000'}¢
          </span>
        );
      },
    }),
    columnHelper.accessor('id', {
      id: 'actions',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</span>,
      cell: (info) => {
        const solutionId = info.getValue();
        const solution = config.storageSolutions.find((s) => s.id === solutionId);
        if (!solution) return null;
        
        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleEdit(solution)}
              disabled={isLoading}
              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <MdEdit size={18} />
            </button>
            <button
              onClick={() => handleDeleteConfirmation(solutionId)}
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
    data: config.storageSolutions || [],
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
    <>
      <Card extra="flex flex-col w-full p-6">
        <div className="flex items-center justify-between rounded-t-3xl p-3">
          <div className="text-2xl font-bold text-navy-700 dark:text-white">
            Storage Solutions
          </div>
          <div className="flex items-center gap-2">
            {fetchLoading && (
              <div className="flex items-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"></div>
              </div>
            )}
            <button
              onClick={handleModalOpen}
              disabled={isLoading || fetchLoading}
              className="flex items-center gap-1 rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              <MdAdd size={18} />
              Add Solution
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
                onClick={() => fetchStorageSolutions()}
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

        {/* Storage Solutions Table */}
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
                      {fetchLoading ? 'Loading storage solutions...' : 'Processing...'}
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
                    No storage solutions configured. Click "Add Solution" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <StorageSolutionDialog
        isOpen={isOpen}
        onClose={handleModalClose}
        onSave={handleSaveSolution}
        editingSolution={editingSolution}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Modal */}
      {solutionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-navy-800">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Confirm Delete</h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this storage solution? This action cannot be undone.
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
    </>
  );
}; 