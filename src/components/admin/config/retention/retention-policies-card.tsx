'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/card';
import { MdAdd, MdDelete, MdEdit, MdInfo } from 'react-icons/md';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useConfigStore } from '@/lib/config-store';
import { RetentionPolicy, StorageSolution } from '@/lib/types';
import { formatDuration } from '@/lib/utils';
import { RetentionPolicyDialog } from './retention-policy-dialog';

interface RetentionPoliciesCardProps {
  onNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const columnHelper = createColumnHelper<RetentionPolicy>();

export const RetentionPoliciesCard: React.FC<RetentionPoliciesCardProps> = ({ onNotification }) => {
  const { config } = useConfigStore();
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [storageSolutions, setStorageSolutions] = useState<StorageSolution[]>([]);
  const [currentPolicy, setCurrentPolicy] = useState<RetentionPolicy | null>(null);
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletePolicy, setDeletePolicy] = useState<RetentionPolicy | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    fetchPolicies();
    fetchStorageSolutions();
  }, []);

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/update-config/retention-policies');
      if (!response.ok) {
        throw new Error(`Failed to fetch policies: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setRetentionPolicies(data);
    } catch (error) {
      console.error('Error fetching policies:', error);
      onNotification('Failed to fetch retention policies. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStorageSolutions = async () => {
    try {
      const response = await fetch('/api/update-config/storage-solutions');
      if (!response.ok) {
        throw new Error(`Failed to fetch storage solutions: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setStorageSolutions(data);
    } catch (error) {
      console.error('Error fetching storage solutions:', error);
      onNotification('Failed to fetch storage solutions. Please try again.', 'error');
    }
  };

  const handleEdit = (policy: RetentionPolicy) => {
    setCurrentPolicy(policy);
    setIsAddingPolicy(false);
    setIsDialogOpen(true);
  };

  const handleDelete = async (policy: RetentionPolicy) => {
    setDeletePolicy(policy);
    if (confirm(`Are you sure you want to delete the retention policy "${policy.name}"?`)) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/update-config/retention-policies', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: policy.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || `HTTP error! Status: ${response.status}`);
        }

        // Update the UI
        setRetentionPolicies(retentionPolicies.filter(p => p.id !== policy.id));
        onNotification(`Retention policy "${policy.name}" has been deleted.`, 'success');
      } catch (error) {
        console.error('Error deleting policy:', error);
        onNotification(
          error instanceof Error ? error.message : 'Failed to delete retention policy.',
          'error'
        );
      } finally {
        setIsLoading(false);
        setDeletePolicy(null);
      }
    } else {
      setDeletePolicy(null);
    }
  };

  const handleSavePolicy = async (policy: RetentionPolicy) => {
    setIsLoading(true);
    try {
      const isNewPolicy = !policy.id;
      const method = isNewPolicy ? 'POST' : 'PUT';
      
      const response = await fetch('/api/update-config/retention-policies', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policy),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP error! Status: ${response.status}`);
      }

      const savedPolicy = await response.json();
      
      // Update the local state
      if (isNewPolicy) {
        setRetentionPolicies([...retentionPolicies, savedPolicy]);
      } else {
        setRetentionPolicies(
          retentionPolicies.map(p => (p.id === savedPolicy.id ? savedPolicy : p))
        );
      }

      setIsDialogOpen(false);
      onNotification(
        `Retention policy "${savedPolicy.name}" has been ${isNewPolicy ? 'created' : 'updated'}.`,
        'success'
      );
    } catch (error) {
      console.error('Error saving policy:', error);
      onNotification(
        error instanceof Error ? error.message : 'Failed to save retention policy.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get stage details
  const getStageDetails = (stage: any) => {
    const storageSolution = storageSolutions.find(s => s.id === stage.storageSolutionId);
    return {
      storageName: storageSolution?.name || 'Unknown',
      duration: formatDuration(stage.duration),
    };
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
    columnHelper.accessor('description', {
      id: 'description',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Description</span>,
      cell: (info) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('stages', {
      id: 'stages',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Stages</span>,
      cell: (info) => {
        const stages = info.getValue();
        if (!stages || !Array.isArray(stages) || stages.length === 0) {
          return <span className="text-sm text-gray-500 dark:text-gray-400">-</span>;
        }
        
        return (
          <div className="space-y-1">
            {stages.map((stage, index) => {
              const { storageName, duration } = getStageDetails(stage);
              return (
                <div key={stage.id} className="text-sm">
                  <span className="font-medium">Stage {index + 1}:</span> {storageName} ({duration})
                  {index < stages.length - 1 && <span> → </span>}
                </div>
              );
            })}
          </div>
        );
      },
    }),
    columnHelper.accessor(row => row.totalDuration || row.duration, {
      id: 'duration',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Total Duration</span>,
      cell: (info) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDuration(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('id', {
      id: 'actions',
      header: () => <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</span>,
      cell: (info) => {
        const policyId = info.getValue();
        const policy = retentionPolicies.find((p) => p.id === policyId);
        if (!policy) return null;
        
        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleEdit(policy)}
              disabled={isLoading || (deletePolicy && deletePolicy.id === policy.id)}
              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <MdEdit size={18} />
            </button>
            <button
              onClick={() => handleDelete(policy)}
              disabled={isLoading || (deletePolicy && deletePolicy.id === policy.id)}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            >
              {isLoading && deletePolicy && deletePolicy.id === policy.id ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
              ) : (
                <MdDelete size={18} />
              )}
            </button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: retentionPolicies || [],
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
            Retention Policies
          </div>
          <button
            onClick={() => {
              setCurrentPolicy(null);
              setIsAddingPolicy(true);
              setIsDialogOpen(true);
            }}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
          >
            <MdAdd size={18} />
            Add Policy
          </button>
        </div>

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
              {isLoading && retentionPolicies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"></div>
                    </div>
                    <span className="mt-2 inline-block">Loading policies...</span>
                  </td>
                </tr>
              ) : retentionPolicies.length > 0 ? (
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

      {isDialogOpen && (
        <RetentionPolicyDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          policy={currentPolicy}
          isAdding={isAddingPolicy}
          onSave={handleSavePolicy}
          storageSolutions={storageSolutions}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default RetentionPoliciesCard; 