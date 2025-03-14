/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
"use client";

import DocumentConfigManager from './document-config-manager';
import DocumentTypesList from './document-types-list';
import { FiPlus, FiSettings, FiEdit, FiTrash2, FiChevronDown, FiChevronUp, FiRefreshCw } from "react-icons/fi";
import { DocumentConfigProvider, useDocumentConfig } from './document-config-context';
import { useState } from 'react';
import { 
  DocumentSubTypeConfig,
  DataElementConfig,
  DataElementType,
  DataElementCategory,
  DataElementAction
} from '@/lib/types';

// UI Components - Fixed children prop issues
const Card = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => (
  <div className={`bg-white dark:bg-navy-800 rounded-lg shadow-sm dark:shadow-gray-900/10 overflow-hidden ${className || ""}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => (
  <div className={`p-4 border-b border-gray-100 dark:border-navy-700 ${className || ""}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => (
  <h3 className={`text-lg font-medium text-gray-900 dark:text-white ${className || ""}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => (
  <p className={`text-sm text-gray-500 dark:text-gray-400 ${className || ""}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => (
  <div className={`p-4 ${className || ""}`} {...props}>
    {children}
  </div>
);

// Button component
const Button = ({ 
  variant = 'default', 
  size = 'default', 
  children, 
  className, 
  ...props 
}: { 
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  
  const variantStyles = {
    default: "bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500",
    outline: "border border-gray-300 dark:border-navy-600 bg-transparent hover:bg-gray-50 dark:hover:bg-navy-700/50 text-gray-700 dark:text-gray-300",
    destructive: "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
  };
  
  const sizeStyles = {
    default: "h-9 px-4 py-2 rounded-md text-sm",
    sm: "h-8 px-3 rounded-md text-xs",
    lg: "h-10 px-8 rounded-md text-base"
  };
  
  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Badge component
const Badge = ({ 
  variant = 'default', 
  children, 
  className, 
  ...props 
}: { 
  variant?: 'default' | 'outline' | 'secondary' | 'success';
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => {
  const baseStyle = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variantStyles = {
    default: "bg-brand-500/10 text-brand-500 hover:bg-brand-500/15 dark:bg-brand-500/20 dark:text-brand-400",
    outline: "text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-600 hover:bg-gray-50 dark:hover:bg-navy-700/50",
    secondary: "bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600",
    success: "bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400"
  };
  
  return (
    <div
      className={`${baseStyle} ${variantStyles[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Label component
const Label = ({ className, ...props }: { className?: string; [key: string]: any }) => (
  <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className || ""}`} {...props} />
);

// Spinner component
const Spinner = ({ size = 'default', className }: { size?: 'default' | 'sm' | 'lg'; className?: string }) => {
  const sizeClasses = {
    default: 'h-6 w-6',
    sm: 'h-4 w-4',
    lg: 'h-8 w-8',
  };
  
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}></div>
    </div>
  );
};

// Collapsable Section Component
const CollapsableSection = ({ 
  title, 
  defaultOpen = true, 
  children 
}: { 
  title: string; 
  defaultOpen?: boolean; 
  children: React.ReactNode 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-6">
      <div 
        className="flex items-center justify-between bg-gray-50 dark:bg-navy-700/50 p-4 rounded-lg cursor-pointer mb-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium text-lg text-gray-900 dark:text-white">{title}</h3>
        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
          {isOpen ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
        </button>
      </div>
      <div className={`${isOpen ? 'block' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
};

// Modal component for DataElements
const DataElementModal = ({ 
  isOpen, 
  onClose, 
  title,
  element, 
  onSubmit,
  setElement,
  isLoading,
  isSubTypeElement = false
}: { 
  isOpen: boolean;
  onClose: () => void;
  title: string;
  element: Partial<DataElementConfig>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  setElement: React.Dispatch<React.SetStateAction<Partial<DataElementConfig>>>;
  isLoading: boolean;
  isSubTypeElement?: boolean;
}) => {
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  // Handle aliases as tags
  const [newAlias, setNewAlias] = useState('');
  
  const handleAliasKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newAlias.trim()) {
      e.preventDefault();
      const currentAliases = element.aliases ? [...element.aliases] : [];
      if (!currentAliases.includes(newAlias.trim())) {
        setElement({ ...element, aliases: [...currentAliases, newAlias.trim()] });
      }
      setNewAlias('');
    }
  };
  
  const removeAlias = (alias: string) => {
    const currentAliases = element.aliases ? [...element.aliases] : [];
    setElement({ 
      ...element, 
      aliases: currentAliases.filter(a => a !== alias) 
    });
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-navy-800 p-6 text-left align-middle shadow-xl transition-all">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
          
          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="elementName">Name</Label>
                <input
                  id="elementName"
                  type="text"
                  value={element.name || ''}
                  onChange={(e) => setElement({ ...element, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="elementAction">Action</Label>
                <select
                  id="elementAction"
                  value={element.action || 'Extract'}
                  onChange={(e) => setElement({ ...element, action: e.target.value as DataElementAction })}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:text-white"
                >
                  <option value="Extract">Extract</option>
                  <option value="Redact">Redact</option>
                  <option value="ExtractAndRedact">Extract & Redact</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="elementType">Type</Label>
                <select
                  id="elementType"
                  value={element.type || 'Text'}
                  onChange={(e) => setElement({ ...element, type: e.target.value as DataElementType })}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:text-white"
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date</option>
                  <option value="Currency">Currency</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="Address">Address</option>
                  <option value="Name">Name</option>
                  <option value="SSN">SSN</option>
                  <option value="CreditCard">Credit Card</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="elementDescription">Description</Label>
                <textarea
                  id="elementDescription"
                  value={element.description || ''}
                  onChange={(e) => setElement({ ...element, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:text-white"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="elementCategory">Category</Label>
                <select
                  id="elementCategory"
                  value={element.category || 'General'}
                  onChange={(e) => setElement({ ...element, category: e.target.value as DataElementCategory })}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:text-white"
                >
                  <option value="General">General</option>
                  <option value="PII">PII</option>
                  <option value="Financial">Financial</option>
                  <option value="Medical">Medical</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="elementAliases">Aliases</Label>
                <div className="mt-1 flex flex-wrap gap-2 p-2 border rounded-md border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-700 min-h-[70px]">
                  {element.aliases && element.aliases.map((alias, index) => (
                    <div 
                      key={index} 
                      className="flex items-center bg-brand-600 text-white rounded-full py-1 px-3 text-xs"
                    >
                      <span>{alias}</span>
                      <button 
                        type="button" 
                        onClick={() => removeAlias(alias)} 
                        className="ml-1 text-white hover:text-white/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <input
                    id="elementAliases"
                    type="text"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    onKeyDown={handleAliasKeyDown}
                    placeholder="Type and press Enter to add"
                    className="flex-grow min-w-[150px] border-0 p-1 mt-1 rounded-md focus:ring-0 bg-transparent dark:bg-navy-700/50 dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Type an alias and press Enter to add it</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Document Details Card Component
const DocumentDetailsCard = () => {
  const { 
    selectedDocType, 
    setFormMode
  } = useDocumentConfig();

  if (!selectedDocType) {
    return (
      <div className="md:col-span-9">
        <div className="p-6 rounded-lg border border-dashed border-gray-200 dark:border-navy-700 h-full flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="mb-2">No document type selected</p>
            <p className="text-sm">Select a document type from the list to view details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:col-span-9">
      <div className="bg-brand-600 text-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-semibold text-white">
              {selectedDocType.name}
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setFormMode('edit')} className="border-white/20 text-white hover:bg-brand-700">
                <FiEdit className="mr-1" size={14} />
                Edit
              </Button>
            </div>
          </div>
          
          <p className="text-white/80 mb-3">
            {selectedDocType.description || 'No description available'}
          </p>
          
          <div className="flex flex-wrap gap-3 items-center mt-3">
            <Badge variant={selectedDocType.isActive ? 'success' : 'secondary'} className="px-3 py-1">
              {selectedDocType.isActive ? 'Active' : 'Inactive'}
            </Badge>
            
            <div className="text-sm text-white/80 flex items-center">
              <FiSettings className="mr-1" size={14} />
              <span>{selectedDocType.subTypes?.length || 0} sub-types</span>
            </div>
            
            <div className="text-sm text-white/80 flex items-center ml-4">
              <span>{selectedDocType.dataElements?.length || 0} data elements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-Types Card Component
const SubTypesCard = () => {
  const { 
    selectedDocType,
    setFormMode,
    setSelectedSubType,
    createSubType,
    updateSubType,
    deleteSubType
  } = useDocumentConfig();

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSubTypeId, setEditingSubTypeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    awsAnalysisType: 'GENERAL'
  });
  
  // Add new state for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      awsAnalysisType: 'GENERAL'
    });
    setIsAdding(false);
    setIsEditing(false);
    setEditingSubTypeId(null);
  };

  const handleEdit = (subType: DocumentSubTypeConfig) => {
    setFormData({
      name: subType.name,
      description: subType.description || '',
      isActive: subType.isActive !== false, // default to true if undefined
      awsAnalysisType: subType.awsAnalysisType || 'GENERAL'
    });
    setEditingSubTypeId(subType.id);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDocType) return;
    
    try {
      if (isAdding) {
        await createSubType(selectedDocType.id, {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          awsAnalysisType: formData.awsAnalysisType,
          documentTypeId: selectedDocType.id,
          dataElements: []
        });
      } else if (isEditing && editingSubTypeId) {
        await updateSubType(selectedDocType.id, editingSubTypeId, {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          awsAnalysisType: formData.awsAnalysisType
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving sub-type:', error);
    }
  };

  const handleDelete = async (subTypeId: string) => {
    if (!selectedDocType) return;
    
    if (confirm('Are you sure you want to delete this sub-type?')) {
      try {
        await deleteSubType(selectedDocType.id, subTypeId);
      } catch (error) {
        console.error('Error deleting sub-type:', error);
      }
    }
  };
  
  // Add filtering function for sub-types
  const getFilteredSubTypes = () => {
    if (!selectedDocType || !selectedDocType.subTypes) return [];
    
    if (!searchTerm.trim()) {
      return selectedDocType.subTypes;
    }
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return selectedDocType.subTypes.filter(subType => {
      const matchesName = subType.name.toLowerCase().includes(normalizedSearch);
      const matchesDescription = subType.description?.toLowerCase()?.includes(normalizedSearch) || false;
      const matchesAnalysisType = (subType.awsAnalysisType || '').toLowerCase().includes(normalizedSearch);
      
      return matchesName || matchesDescription || matchesAnalysisType;
    });
  };
  
  // Add pagination function
  const getPaginatedSubTypes = () => {
    const filteredItems = getFilteredSubTypes();
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    
    // Ensure current page is valid
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      items: filteredItems.slice(startIndex, endIndex),
      totalPages,
      currentPage
    };
  };

  if (!selectedDocType) {
    return (
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Sub-Types</CardTitle>
          <CardDescription>Select a document sub-type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="mb-2">No document type selected</p>
            <p className="text-sm">Select a document type to manage sub-types</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { items: paginatedSubTypes, totalPages } = getPaginatedSubTypes();

  return (
    <Card className="md:col-span-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Sub-Types</CardTitle>
            <CardDescription>Select a document sub-type</CardDescription>
          </div>
          {!isAdding && !isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAdding(true)}
            >
              <FiPlus className="mr-2" size={14} />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding || isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <input
                id="name"
                className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Sub-type name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description (optional)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awsAnalysisType">Analysis Type</Label>
              <select
                id="awsAnalysisType"
                className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                value={formData.awsAnalysisType}
                onChange={(e) => setFormData({ ...formData, awsAnalysisType: e.target.value })}
              >
                <option value="GENERAL">General</option>
                <option value="EXPENSE">Expense</option>
                <option value="IDENTITY">Identity Document</option>
                <option value="INVOICE">Invoice</option>
                <option value="LENDING">Lending</option>
                <option value="MORTGAGE">Mortgage</option>
                <option value="PAY_STUB">Pay Stub</option>
                <option value="TAX_US">US Tax Form</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                className="rounded border-gray-300 dark:border-navy-600 text-brand-600 focus:ring-brand-500"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="isActive" className="mb-0">Active</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update' : 'Create'} Sub-Type
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {selectedDocType.subTypes && selectedDocType.subTypes.length > 0 ? (
              <>
                {/* Add search input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search sub-types..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                    className="w-full px-3 py-2 pl-8 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                </div>
                
                {paginatedSubTypes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">No sub-types match your search</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedSubTypes.map((subType) => (
                      <div 
                        key={subType.id}
                        className="p-3 bg-gray-50 dark:bg-navy-700/80 rounded-md hover:bg-gray-100 dark:hover:bg-navy-700 cursor-pointer"
                        onClick={() => setSelectedSubType(subType)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                              {subType.name}
                              {subType.isActive !== false && (
                                <Badge variant="success" className="ml-2">Active</Badge>
                              )}
                              {subType.isActive === false && (
                                <Badge variant="secondary" className="ml-2">Inactive</Badge>
                              )}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {subType.dataElements?.length || 0} data elements • {subType.awsAnalysisType || 'General'} analysis
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(subType);
                              }}
                            >
                              <FiEdit size={14} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(subType.id);
                              }}
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add pagination controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="mb-2">No sub-types defined</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAdding(true)}
                >
                  <FiPlus className="mr-2" size={14} />
                  Add Your First Sub-Type
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Data Elements Card Component
const DataElementsCard = () => {
  const {
    loading,
    selectedDocType,
    selectedSubType,
    formMode,
    setFormMode,
    createDataElement,
    updateDataElement,
    deleteDataElement,
    fetchDocumentType,
    fetchDocumentTypes
  } = useDocumentConfig();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newElement, setNewElement] = useState<Partial<DataElementConfig>>({
    name: '',
    description: '',
    action: 'Extract',
    aliases: [],
    type: 'Text',
    category: 'General'
  });
  
  const resetForm = () => {
    setNewElement({
      name: '',
      description: '',
      action: 'Extract',
      aliases: [],
      type: 'Text',
      category: 'General'
    });
  };
  
  const handleAddClick = () => {
    resetForm();
    setFormMode('add');
    setIsModalOpen(true);
  };
  
  const handleEdit = (element: DataElementConfig) => {
    setNewElement({
      ...element,
      aliases: element.aliases || []
    });
    setFormMode('edit');
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormMode('none');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if document type or sub-type is selected, as needed
    if (!selectedDocType) {
      console.error('No document type selected');
      return;
    }
    
    const subTypeId = selectedSubType?.id || null;
    
    try {
      if (formMode === 'add') {
        // Ensure subTypeId is set correctly for new elements
        const elementToCreate = {
          ...newElement,
          subTypeId
        };
        
        await createDataElement(
          selectedDocType.id,
          subTypeId,
          elementToCreate as Omit<DataElementConfig, 'id'>
        );
        
        console.log(`Created new data element for ${subTypeId ? `sub-type ${subTypeId}` : 'document type'}`);
      } else if (formMode === 'edit' && newElement.id) {
        await updateDataElement(
          selectedDocType.id,
          newElement.id,
          subTypeId,
          newElement
        );
        
        console.log(`Updated data element ${newElement.id}`);
      }
      
      handleCloseModal();
      // Optional: Refresh data
      if (selectedDocType.id) {
        fetchDocumentType(selectedDocType.id);
      }
    } catch (error) {
      console.error('Error saving data element:', error);
    }
  };

  // Helper to get the current data elements based on selection
  const getCurrentDataElements = (): DataElementConfig[] => {
    if (selectedSubType && selectedSubType.id) {
      // First, try to get elements from the subType.dataElements array
      if (selectedSubType.dataElements && selectedSubType.dataElements.length > 0) {
        console.log(`Using ${selectedSubType.dataElements.length} data elements from selectedSubType.dataElements`);
        return selectedSubType.dataElements;
      }
      
      // If no elements found in subType, try searching in the document's dataElements array
      // for elements with a matching subTypeId
      if (selectedDocType && selectedDocType.dataElements) {
        const matchingElements = selectedDocType.dataElements.filter(
          element => element.subTypeId === selectedSubType.id
        );
        
        if (matchingElements.length > 0) {
          console.log(`Found ${matchingElements.length} data elements with matching subTypeId in document's elements`);
          return matchingElements;
        }
      }
      
      console.warn(`No data elements found for sub-type ${selectedSubType.id}`);
      return [];
    }
    
    // If no sub-type is selected, show document-level elements (those without a subTypeId)
    if (selectedDocType && selectedDocType.dataElements) {
      const docElements = selectedDocType.dataElements.filter(
        element => !element.subTypeId
      );
      console.log(`Using ${docElements.length} document-level data elements (no subTypeId)`);
      return docElements;
    }
    
    return [];
  };

  // Get appropriate title for the card
  const getCardTitle = () => {
    if (selectedSubType && selectedSubType.name) {
      return `Data Elements - ${selectedSubType.name}`;
    }
    if (selectedDocType && selectedDocType.name) {
      return 'Data Elements';
    }
    return 'Data Elements';
  };

  // Get appropriate description for the card
  const getCardDescription = () => {
    if (selectedSubType && selectedSubType.name) {
      return `Manage data elements for ${selectedSubType.name}`;
    }
    if (selectedDocType && selectedDocType.name) {
      return `Manage data elements for ${selectedDocType.name}`;
    }
    return 'Manage document data elements';
  };

  // Get status badge based on data element action
  const getActionBadge = (action: DataElementAction) => {
    console.log(`Rendering action badge for: ${action} (${typeof action})`);
    
    // Normalize the action value to handle potential casing differences
    // or string formatting issues
    let normalizedAction = 'unknown';
    
    if (typeof action === 'string') {
      normalizedAction = action.toLowerCase().trim().replace(/\s+/g, '');
      console.log(`Normalized action to: ${normalizedAction}`);
    }
    
    switch (normalizedAction) {
      case 'extract':
        return <Badge variant="success">EXTRACT</Badge>;
      case 'redact':
        return <Badge variant="secondary">REDACT</Badge>;
      case 'extractandredact':
      case 'extract&redact':
      case 'extractredact':
        console.log('Rendering EXTRACT & REDACT badge');
        return <Badge variant="default">EXTRACT & REDACT</Badge>;
      case 'ignore':
        return <Badge variant="outline">IGNORE</Badge>;
      default:
        // For unknown or new actions, display as-is
        console.log(`Unknown action type: ${action}`);
        return <Badge variant="outline">{action || 'Unknown'}</Badge>;
    }
  };

  return (
    <Card className="md:col-span-8">
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <div>
            <CardTitle>{getCardTitle()}</CardTitle>
            <CardDescription>{getCardDescription()}</CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('Forcing data refresh...');
                
                // Force a refresh of all document types first
                fetchDocumentTypes(true).then(() => {
                  if (selectedDocType && selectedDocType.id) {
                    // Then fetch the specific document with all its subtypes and elements
                    fetchDocumentType(selectedDocType.id);
                  }
                });
              }}
              title="Refresh data from database"
            >
              <FiRefreshCw className="mr-1" size={14} />
              Refresh
            </Button>
            
            {!isModalOpen && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddClick}
              >
                <FiPlus className="mr-1" size={14} />
                Add
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isModalOpen ? (
          <DataElementModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={formMode === 'add' ? "Add Data Element" : "Edit Data Element"}
            element={newElement}
            onSubmit={handleSubmit}
            setElement={setNewElement}
            isLoading={loading}
            isSubTypeElement={selectedSubType !== null}
          />
        ) : (
          <>
            {getCurrentDataElements().length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 text-gray-800 dark:bg-navy-700 dark:text-white">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium text-sm">NAME</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">TYPE</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">CATEGORY</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">ACTION</th>
                      <th className="py-3 px-4 text-right font-medium text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentDataElements().map((element, index) => (
                      <tr 
                        key={element.id} 
                        className={`border-b border-gray-100 dark:border-navy-700 ${index % 2 === 0 ? 'bg-white dark:bg-navy-800' : 'bg-gray-50 dark:bg-navy-700'}`}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{element.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{element.description}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-800 dark:text-gray-300">
                            {element.type}
                            {element.required && (
                              <span className="ml-1 text-xs text-red-500">*</span>
                            )}
                            {element.isDefault && (
                              <span className="ml-1 text-xs text-blue-500">(Default)</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-800 dark:text-gray-300">{element.category}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getActionBadge(element.action)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(element)}
                              className="p-2 h-auto w-auto"
                            >
                              <FiEdit size={14} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteDataElement(selectedDocType.id, element.id, selectedSubType && selectedSubType.id ? selectedSubType.id : null)}
                              className="p-2 h-auto w-auto"
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="mb-2">No data elements defined</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddClick}
                  className="mt-2"
                >
                  <FiPlus className="mr-2" size={14} />
                  Add Your First Data Element
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Document Data Elements Card Component (only for document-level elements)
const DocumentDataElementsCard = () => {
  const {
    loading,
    selectedDocType,
    formMode,
    setFormMode,
    createDataElement,
    updateDataElement,
    deleteDataElement,
    fetchDocumentType,
    fetchDocumentTypes
  } = useDocumentConfig();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newElement, setNewElement] = useState<Partial<DataElementConfig>>({
    name: '',
    description: '',
    action: 'Extract',
    aliases: [],
    type: 'Text',
    category: 'General'
  });
  
  const resetForm = () => {
    setNewElement({
      name: '',
      description: '',
      action: 'Extract',
      aliases: [],
      type: 'Text',
      category: 'General'
    });
  };
  
  const handleAddClick = () => {
    resetForm();
    setFormMode('add');
    setIsModalOpen(true);
  };
  
  const handleEdit = (element: DataElementConfig) => {
    setNewElement({
      ...element,
      aliases: element.aliases || []
    });
    setFormMode('edit');
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormMode('none');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDocType) {
      console.error('No document type selected');
      return;
    }
    
    try {
      if (formMode === 'add') {
        // Create new element at document level
        await createDataElement(
          selectedDocType.id,
          null,
          newElement as Omit<DataElementConfig, 'id'>
        );
        
        console.log('Created new document-level data element');
      } else if (formMode === 'edit' && newElement.id) {
        // Update existing element at document level
        await updateDataElement(
          selectedDocType.id,
          newElement.id,
          null,
          newElement
        );
        
        console.log(`Updated document-level data element ${newElement.id}`);
      }
      
      handleCloseModal();
      // Optional: Refresh data
      if (selectedDocType.id) {
        fetchDocumentType(selectedDocType.id);
      }
    } catch (error) {
      console.error('Error saving data element:', error);
    }
  };
  
  const getDocumentDataElements = (): DataElementConfig[] => {
    if (!selectedDocType || !selectedDocType.dataElements) return [];
    return selectedDocType.dataElements.filter(e => !e.subTypeId) || [];
  };
  
  const getActionBadge = (action: DataElementAction) => {
    console.log(`Rendering action badge for: ${action} (${typeof action})`);
    
    // Normalize the action value to handle potential casing differences
    // or string formatting issues
    let normalizedAction = 'unknown';
    
    if (typeof action === 'string') {
      normalizedAction = action.toLowerCase().trim().replace(/\s+/g, '');
      console.log(`Normalized action to: ${normalizedAction}`);
    }
    
    switch (normalizedAction) {
      case 'extract':
        return <Badge variant="success">EXTRACT</Badge>;
      case 'redact':
        return <Badge variant="secondary">REDACT</Badge>;
      case 'extractandredact':
      case 'extract&redact':
      case 'extractredact':
        console.log('Rendering EXTRACT & REDACT badge');
        return <Badge variant="default">EXTRACT & REDACT</Badge>;
      case 'ignore':
        return <Badge variant="outline">IGNORE</Badge>;
      default:
        // For unknown or new actions, display as-is
        console.log(`Unknown action type: ${action}`);
        return <Badge variant="outline">{action || 'Unknown'}</Badge>;
    }
  };

  if (!selectedDocType) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Data Elements</CardTitle>
          <CardDescription>Manage data elements for the document type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="mb-2">No document type selected</p>
            <p className="text-sm">Select a document type to manage data elements</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <div>
            <CardTitle>Document Data Elements</CardTitle>
            <CardDescription>
              Elements that apply to all types of {selectedDocType?.name || 'this document'}
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isModalOpen && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddClick}
              >
                <FiPlus className="mr-1" size={14} />
                Add
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isModalOpen ? (
          <DataElementModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={formMode === 'add' ? "Add Document Element" : "Edit Document Element"}
            element={newElement}
            onSubmit={handleSubmit}
            setElement={setNewElement}
            isLoading={loading}
            isSubTypeElement={false}
          />
        ) : (
          <>
            {getDocumentDataElements().length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 text-gray-800 dark:bg-navy-700 dark:text-white">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium text-sm">NAME</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">TYPE</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">CATEGORY</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">ACTION</th>
                      <th className="py-3 px-4 text-right font-medium text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDocumentDataElements().map((element, index) => (
                      <tr 
                        key={element.id} 
                        className={`border-b border-gray-100 dark:border-navy-700 ${index % 2 === 0 ? 'bg-white dark:bg-navy-800' : 'bg-gray-50 dark:bg-navy-700'}`}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{element.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{element.description}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-800 dark:text-gray-300">
                            {element.type}
                            {element.required && (
                              <span className="ml-1 text-xs text-red-500">*</span>
                            )}
                            {element.isDefault && (
                              <span className="ml-1 text-xs text-blue-500">(Default)</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-800 dark:text-gray-300">{element.category}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getActionBadge(element.action)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(element)}
                              className="p-2 h-auto w-auto"
                            >
                              <FiEdit size={14} />
                            </Button>
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this data element?')) {
                                  deleteDataElement(selectedDocType.id, element.id, null);
                                }
                              }}
                              className="p-2 h-auto w-auto"
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="mb-2">No document-level data elements defined</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddClick}
                  className="mt-2"
                >
                  <FiPlus className="mr-2" size={14} />
                  Add Your First Document Data Element
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Main page component
const DocumentConfigPageContent = () => {
  return (
    <div className="p-6 dark:bg-navy-900 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Document Types List */}
        <div className="md:col-span-3 md:row-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Document Types</CardTitle>
              <CardDescription>Manage document types and classifications</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTypesList />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="md:col-span-9">
          {/* Top Row - Document Details Header */}
          <DocumentDetailsCard />
          
          {/* Middle Row - Document Data Elements Section */}
          <div className="mt-6">
            <CollapsableSection title="Document Data Elements">
              <DocumentDataElementsCard />
            </CollapsableSection>
          </div>
          
          {/* Bottom Row - Document Sub-Types Section */}
          <div className="mt-6">
            <CollapsableSection title="Document Sub-Types">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Sub-Types Card */}
                <div className="md:col-span-4">
                  <SubTypesCard />
                </div>
                
                {/* Data Elements Card for Sub-Types */}
                <div className="md:col-span-8">
                  <DataElementsCard />
                </div>
              </div>
            </CollapsableSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DocumentConfigPage() {
  return (
    <DocumentConfigProvider>
      <DocumentConfigPageContent />
    </DocumentConfigProvider>
  );
}
