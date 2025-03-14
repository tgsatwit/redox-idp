'use client';
import { useState } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdPlayArrow, 
  MdPause,
  MdContentCopy,
  MdMoreVert,
  MdFilterList,
  MdSearch
} from 'react-icons/md';
import { FaRegClock } from 'react-icons/fa';

type Workflow = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  documentTypes: string[];
  createdAt: string;
  lastModified: string;
  runCount: number;
  accuracy: number;
};

/**
 * Component for creating and managing document processing workflows
 */
const WorkflowManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  
  // Mock workflow data
  const workflows: Workflow[] = [
    {
      id: 'wf-1234',
      name: 'Invoice Processing',
      description: 'Extract data from vendor invoices',
      status: 'active',
      documentTypes: ['Invoice', 'Receipt'],
      createdAt: '2023-06-15',
      lastModified: '2023-07-28',
      runCount: 1245,
      accuracy: 97.3
    },
    {
      id: 'wf-2345',
      name: 'Purchase Order Processing',
      description: 'Extract and validate PO data',
      status: 'active',
      documentTypes: ['Purchase Order'],
      createdAt: '2023-05-11',
      lastModified: '2023-07-19',
      runCount: 892,
      accuracy: 96.8
    },
    {
      id: 'wf-3456',
      name: 'Contract Analysis',
      description: 'Extract key terms and clauses',
      status: 'paused',
      documentTypes: ['Contract', 'Agreement'],
      createdAt: '2023-04-20',
      lastModified: '2023-06-10',
      runCount: 347,
      accuracy: 93.2
    },
    {
      id: 'wf-4567',
      name: 'ID Verification',
      description: 'Extract and verify ID document information',
      status: 'draft',
      documentTypes: ['Passport', 'Driver License', 'ID Card'],
      createdAt: '2023-07-05',
      lastModified: '2023-07-05',
      runCount: 0,
      accuracy: 0
    },
  ];
  
  // Filter workflows based on search term and status filter
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = 
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || workflow.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'paused':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  return (
    <div className="w-full bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">Workflow Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage document processing workflows
          </p>
        </div>
        
        <button 
          type="button"
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <MdAdd className="mr-2 h-5 w-5" />
          Create Workflow
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search workflows..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-navy-600 rounded-md bg-white dark:bg-navy-900 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <MdFilterList className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
          <select
            className="text-sm border border-gray-300 dark:border-navy-600 rounded-md bg-white dark:bg-navy-900 p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
      
      {/* Workflow list */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
          <thead className="bg-gray-50 dark:bg-navy-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Workflow
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Document Types
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stats
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Modified
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-navy-800 divide-y divide-gray-200 dark:divide-navy-700">
            {filteredWorkflows.map((workflow) => (
              <tr key={workflow.id} className="hover:bg-gray-50 dark:hover:bg-navy-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">{workflow.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{workflow.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(workflow.status)}`}>
                    {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {workflow.documentTypes.map((type, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-navy-700 dark:text-gray-300">
                        {type}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col">
                    <span>Runs: {workflow.runCount.toLocaleString()}</span>
                    {workflow.accuracy > 0 && (
                      <span>Accuracy: {workflow.accuracy}%</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <FaRegClock className="mr-1 h-3 w-3" />
                    {workflow.lastModified}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Edit workflow"
                    >
                      <MdEdit className="h-5 w-5" />
                    </button>
                    {workflow.status === 'active' ? (
                      <button 
                        className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                        title="Pause workflow"
                      >
                        <MdPause className="h-5 w-5" />
                      </button>
                    ) : (
                      <button 
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Activate workflow"
                      >
                        <MdPlayArrow className="h-5 w-5" />
                      </button>
                    )}
                    <button 
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Duplicate workflow"
                    >
                      <MdContentCopy className="h-5 w-5" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete workflow"
                    >
                      <MdDelete className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredWorkflows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No workflows found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination (simplified) */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredWorkflows.length}</span> of{' '}
          <span className="font-medium">{workflows.length}</span> workflows
        </div>
        <div className="flex gap-2">
          <button
            disabled
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-navy-600 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 bg-white dark:bg-navy-800 cursor-not-allowed"
          >
            Previous
          </button>
          <button
            disabled
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-navy-600 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 bg-white dark:bg-navy-800 cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowManagement; 