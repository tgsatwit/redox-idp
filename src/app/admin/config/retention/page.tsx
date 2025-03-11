'use client';
// @ts-nocheck

import React, { useState } from 'react';
import Card from '@/components/card';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
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

// Helper functions for converting between days and years
const daysToYears = (days: number) => Number((days / 365).toFixed(2));
const yearsToDays = (years: number) => Math.round(years * 365);

const columnHelper = createColumnHelper<RetentionPolicy>();

const RetentionPoliciesPage = () => {
  const { config, addRetentionPolicy, updateRetentionPolicy, deleteRetentionPolicy } = useConfigStore();
  const [isOpen, setIsOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RetentionPolicy | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationYears: 1,
  });

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this retention policy?')) {
      return;
    }

    setIsLoading(true);
    try {
      // First update local state
      deleteRetentionPolicy(id);

      // Then update DynamoDB via API
      console.log(`Sending DELETE request to /api/update-config/retention-policies with ID: ${id}`);
      const response = await fetch('/api/update-config/retention-policies', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ id }),
      });

      console.log('DELETE response status:', response.status);
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          errorDetail = errorText;
        } catch (textError) {
          console.error('Error reading response text:', textError);
        }
        throw new Error(`Failed to delete policy from database: ${response.status} - ${errorDetail || 'No error details'}`);
      }

      console.log('Retention policy deleted successfully');
    } catch (error) {
      console.error('Error deleting retention policy from database:', error);
      // Error notification would go here
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePolicy = async (policyData: { name: string; description: string; duration: number }) => {
    setIsLoading(true);
    try {
      // First update local state via the store
      if (editingPolicy) {
        updateRetentionPolicy(editingPolicy.id, policyData);
      } else {
        addRetentionPolicy(policyData);
      }

      // Then update DynamoDB via API
      if (editingPolicy) {
        // Update existing policy
        try {
          console.log('Sending PUT request with data:', { id: editingPolicy.id, ...policyData });
          const response = await fetch('/api/update-config/retention-policies', {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ id: editingPolicy.id, ...policyData }),
          });

          console.log('PUT response status:', response.status);
          const contentType = response.headers.get('content-type');
          console.log('Response content type:', contentType);
          
          if (!response.ok) {
            let errorDetail = '';
            try {
              const errorText = await response.text();
              console.error('Error response body:', errorText);
              errorDetail = errorText;
            } catch (textError) {
              console.error('Error reading response text:', textError);
            }
            throw new Error(`Failed to update policy in database: ${response.status} - ${errorDetail || 'No error details'}`);
          }

          console.log('Retention policy updated successfully');
        } catch (error) {
          console.error('PUT request failed:', error);
          throw error;
        }
      } else {
        // Create new policy
        try {
          console.log('Sending POST request with data:', policyData);
          const response = await fetch('/api/update-config/retention-policies', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(policyData),
          });

          console.log('POST response status:', response.status);
          const contentType = response.headers.get('content-type');
          console.log('Response content type:', contentType);
          
          if (!response.ok) {
            let errorDetail = '';
            try {
              const errorText = await response.text();
              console.error('Error response body:', errorText);
              errorDetail = errorText;
            } catch (textError) {
              console.error('Error reading response text:', textError);
            }
            throw new Error(`Failed to create policy in database: ${response.status} - ${errorDetail || 'No error details'}`);
          }

          console.log('Retention policy added successfully');
        } catch (error) {
          console.error('POST request failed:', error);
          throw error;
        }
      }

      handleModalClose();
    } catch (error) {
      console.error('Error saving retention policy to database:', error);
      // Error notification would go here
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    columnHelper.accessor('name', {
      id: 'name',
      header: () => <span className="text-sm font-bold text-gray-300">Name</span>,
      cell: (info) => (
        <span className="text-sm font-medium text-white">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('description', {
      id: 'description',
      header: () => <span className="text-sm font-bold text-gray-300">Description</span>,
      cell: (info) => (
        <span className="text-sm font-medium text-white">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('duration', {
      id: 'duration',
      header: () => <span className="text-sm font-bold text-gray-300">Duration</span>,
      cell: (info) => (
        <span className="text-sm font-medium text-white">
          {daysToYears(info.getValue())} years
        </span>
      ),
    }),
    columnHelper.accessor('id', {
      id: 'actions',
      header: () => <span className="text-sm font-bold text-gray-300">Actions</span>,
      cell: (info) => {
        const policyId = info.getValue();
        const policy = config.retentionPolicies.find((p) => p.id === policyId);
        if (!policy) return null;
        
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleEdit(policy)}
              disabled={isLoading}
              className="flex items-center justify-center rounded-lg bg-navy-700 p-2 text-blue-400 transition duration-200 hover:cursor-pointer hover:bg-navy-800"
            >
              <MdEdit size={16} />
            </button>
            <button
              onClick={() => handleDelete(policyId)}
              disabled={isLoading}
              className="flex items-center justify-center rounded-lg bg-navy-700 p-2 text-red-400 transition duration-200 hover:cursor-pointer hover:bg-navy-800"
            >
              <MdDelete size={16} />
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
    <div className="mt-5">
      <Card extra={'w-full h-full px-6 pb-6 sm:overflow-x-auto bg-navy-800 dark:bg-navy-900'}>
        <div className="relative flex items-center justify-between pt-4">
          <div className="text-xl font-bold text-white">
            Retention Policies
          </div>
          <button
            onClick={handleModalOpen}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <MdAdd size={16} />
            Add Policy
          </button>
        </div>

        <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-navy-700">
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        onClick={header.column.getToggleSortingHandler()}
                        className="cursor-pointer pb-2 pr-4 pt-4 text-start"
                      >
                        <div className="items-center justify-between text-xs">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: '',
                            desc: '',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => {
                  return (
                    <tr key={row.id} className="border-b border-navy-700">
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <td
                            key={cell.id}
                            className="min-w-[150px] py-3 pr-4"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-sm text-gray-400">
                    No retention policies configured. Click "Add Policy" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RetentionPolicyDialog
        isOpen={isOpen}
        onClose={handleModalClose}
        onSave={handleSavePolicy}
        editingPolicy={editingPolicy}
        isLoading={isLoading}
      />
    </div>
  );
};

export default RetentionPoliciesPage;
