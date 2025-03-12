/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
"use client";

import DocumentConfigManager from './document-config-manager';
import DocumentTypesList from './document-types-list';
import { FiPlus, FiSettings, FiEdit, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
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
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-brand-500 ${sizeClasses[size]} ${className || ""}`} />
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
        className="flex items-center justify-between bg-gray-100 dark:bg-navy-700 p-3 rounded-md cursor-pointer mb-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
          {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </button>
      </div>
      <div className={`${isOpen ? 'block' : 'hidden'}`}>
        {children}
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

  if (!selectedDocType) {
    return (
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Sub-Types</CardTitle>
          <CardDescription>Manage document sub-types</CardDescription>
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

  return (
    <Card className="md:col-span-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Sub-Types</CardTitle>
            <CardDescription>Manage document sub-types for {selectedDocType.name}</CardDescription>
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
              <div className="space-y-2">
                {selectedDocType.subTypes.map((subType) => (
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {subType.description || 'No description'}
                        </p>
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
    selectedDocType,
    selectedSubType,
    setFormMode,
    createDataElement,
    updateDataElement,
    deleteDataElement
  } = useDocumentConfig();

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: DataElementType;
    category: DataElementCategory;
    action: DataElementAction;
    pattern?: string;
    required: boolean;
    isDefault: boolean;
    aliases: string;
  }>({
    name: '',
    description: '',
    type: 'Text',
    category: 'General',
    action: 'Extract',
    pattern: '',
    required: false,
    isDefault: false,
    aliases: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'Text',
      category: 'General',
      action: 'Extract',
      pattern: '',
      required: false,
      isDefault: false,
      aliases: ''
    });
    setIsAdding(false);
    setIsEditing(false);
    setEditingElementId(null);
  };

  const handleEdit = (element: DataElementConfig) => {
    setFormData({
      name: element.name,
      description: element.description || '',
      type: element.type,
      category: element.category,
      action: element.action,
      pattern: element.pattern || '',
      required: element.required || false,
      isDefault: element.isDefault || false,
      aliases: element.aliases?.join(', ') || ''
    });
    setEditingElementId(element.id);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDocType) return;
    
    // Process aliases from comma-separated string to array
    const aliases = formData.aliases
      ? formData.aliases.split(',').map(alias => alias.trim()).filter(Boolean)
      : undefined;
    
    try {
      if (isAdding) {
        // Create new element
        await createDataElement(
          selectedDocType.id,
          selectedSubType ? selectedSubType.id : null,
          {
            name: formData.name,
            description: formData.description,
            type: formData.type,
            category: formData.category,
            action: formData.action,
            pattern: formData.pattern && formData.pattern.trim() !== '' ? formData.pattern : undefined,
            required: formData.required,
            isDefault: formData.isDefault,
            aliases: aliases,
            documentTypeId: selectedDocType.id,
            subTypeId: selectedSubType ? selectedSubType.id : undefined
          }
        );
      } else if (isEditing && editingElementId) {
        // Update existing element
        await updateDataElement(
          selectedDocType.id,
          editingElementId,
          selectedSubType ? selectedSubType.id : null,
          {
            name: formData.name,
            description: formData.description,
            type: formData.type,
            category: formData.category,
            action: formData.action,
            pattern: formData.pattern && formData.pattern.trim() !== '' ? formData.pattern : undefined,
            required: formData.required,
            isDefault: formData.isDefault,
            aliases: aliases
          }
        );
      }
      resetForm();
    } catch (error) {
      console.error('Error saving data element:', error);
    }
  };

  const handleDelete = async (elementId: string) => {
    if (!selectedDocType) return;
    
    if (confirm('Are you sure you want to delete this data element?')) {
      try {
        await deleteDataElement(
          selectedDocType.id,
          elementId,
          selectedSubType ? selectedSubType.id : null
        );
      } catch (error) {
        console.error('Error deleting data element:', error);
      }
    }
  };

  // Helper to get the current data elements based on selection
  const getCurrentDataElements = (): DataElementConfig[] => {
    if (selectedSubType) {
      return selectedSubType.dataElements || [];
    }
    if (selectedDocType) {
      return selectedDocType.dataElements || [];
    }
    return [];
  };

  // Get appropriate title for the card
  const getCardTitle = () => {
    if (selectedSubType) {
      return `Data Elements - ${selectedSubType.name}`;
    }
    if (selectedDocType) {
      return 'Data Elements';
    }
    return 'Data Elements';
  };

  // Get appropriate description for the card
  const getCardDescription = () => {
    if (selectedSubType) {
      return `Manage data elements for ${selectedSubType.name}`;
    }
    if (selectedDocType) {
      return `Manage data elements for ${selectedDocType.name}`;
    }
    return 'Manage document data elements';
  };

  // Get status badge based on data element action
  const getActionBadge = (action: DataElementAction) => {
    switch (action) {
      case 'Extract':
        return <Badge variant="success">EXTRACT</Badge>;
      case 'Redact':
        return <Badge variant="secondary">REDACT</Badge>;
      case 'ExtractAndRedact':
        return <Badge variant="default">EXTRACT & REDACT</Badge>;
      case 'Ignore':
        return <Badge variant="outline">IGNORE</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (!selectedDocType) {
    return (
      <Card className="md:col-span-8">
        <CardHeader>
          <CardTitle>Data Elements</CardTitle>
          <CardDescription>Manage document data elements</CardDescription>
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
    <Card className="md:col-span-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{getCardTitle()}</CardTitle>
            <CardDescription>{getCardDescription()}</CardDescription>
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
      <CardContent className="p-0">
        {isAdding || isEditing ? (
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <input
                  id="name"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Element name"
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
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Data Type</Label>
                  <select
                    id="type"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as DataElementType })}
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
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as DataElementCategory })}
                  >
                    <option value="General">General</option>
                    <option value="PII">PII</option>
                    <option value="Financial">Financial</option>
                    <option value="Medical">Medical</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <select
                  id="action"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value as DataElementAction })}
                >
                  <option value="Extract">Extract</option>
                  <option value="Redact">Redact</option>
                  <option value="ExtractAndRedact">Extract and Redact</option>
                  <option value="Ignore">Ignore</option>
                </select>
              </div>
              {formData.type === 'Custom' && (
                <div className="space-y-2">
                  <Label htmlFor="pattern">Regex Pattern</Label>
                  <input
                    id="pattern"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                    value={formData.pattern || ''}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    placeholder="Regular expression pattern"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="aliases">Aliases</Label>
                <input
                  id="aliases"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                  value={formData.aliases}
                  onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                  placeholder="Comma-separated list of aliases"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Alternative names for this field (comma separated)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="required"
                    className="rounded border-gray-300 dark:border-navy-600 text-brand-600 focus:ring-brand-500"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  />
                  <Label htmlFor="required" className="mb-0">Required Field</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    className="rounded border-gray-300 dark:border-navy-600 text-brand-600 focus:ring-brand-500"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  <Label htmlFor="isDefault" className="mb-0">Default Field</Label>
                </div>
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
                  {isEditing ? 'Update' : 'Create'} Data Element
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {getCurrentDataElements().length > 0 ? (
              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-navy-700 text-white">
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
                              onClick={() => handleDelete(element.id)}
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
                  onClick={() => setIsAdding(true)}
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
    selectedDocType,
    setFormMode,
    createDataElement,
    updateDataElement,
    deleteDataElement
  } = useDocumentConfig();

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: DataElementType;
    category: DataElementCategory;
    action: DataElementAction;
    pattern?: string;
    required: boolean;
    isDefault: boolean;
    aliases: string;
  }>({
    name: '',
    description: '',
    type: 'Text',
    category: 'General',
    action: 'Extract',
    pattern: '',
    required: false,
    isDefault: false,
    aliases: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'Text',
      category: 'General',
      action: 'Extract',
      pattern: '',
      required: false,
      isDefault: false,
      aliases: ''
    });
    setIsAdding(false);
    setIsEditing(false);
    setEditingElementId(null);
  };

  const handleEdit = (element: DataElementConfig) => {
    setFormData({
      name: element.name,
      description: element.description || '',
      type: element.type,
      category: element.category,
      action: element.action,
      pattern: element.pattern || '',
      required: element.required || false,
      isDefault: element.isDefault || false,
      aliases: element.aliases?.join(', ') || ''
    });
    setEditingElementId(element.id);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDocType) return;
    
    // Process aliases from comma-separated string to array
    const aliases = formData.aliases
      ? formData.aliases.split(',').map(alias => alias.trim()).filter(Boolean)
      : undefined;
    
    try {
      if (isAdding) {
        // Create new element at document level only
        await createDataElement(
          selectedDocType.id,
          null, // No sub-type
          {
            name: formData.name,
            description: formData.description,
            type: formData.type,
            category: formData.category,
            action: formData.action,
            pattern: formData.pattern && formData.pattern.trim() !== '' ? formData.pattern : undefined,
            required: formData.required,
            isDefault: formData.isDefault,
            aliases: aliases,
            documentTypeId: selectedDocType.id,
          }
        );
      } else if (isEditing && editingElementId) {
        // Update existing element at document level only
        await updateDataElement(
          selectedDocType.id,
          editingElementId,
          null, // No sub-type
          {
            name: formData.name,
            description: formData.description,
            type: formData.type,
            category: formData.category,
            action: formData.action,
            pattern: formData.pattern && formData.pattern.trim() !== '' ? formData.pattern : undefined,
            required: formData.required,
            isDefault: formData.isDefault,
            aliases: aliases
          }
        );
      }
      resetForm();
    } catch (error) {
      console.error('Error saving data element:', error);
    }
  };

  const handleDelete = async (elementId: string) => {
    if (!selectedDocType) return;
    
    if (confirm('Are you sure you want to delete this data element?')) {
      try {
        await deleteDataElement(
          selectedDocType.id,
          elementId,
          null // No sub-type
        );
      } catch (error) {
        console.error('Error deleting data element:', error);
      }
    }
  };

  // Only get document-level data elements
  const getDocumentDataElements = (): DataElementConfig[] => {
    if (selectedDocType) {
      return selectedDocType.dataElements || [];
    }
    return [];
  };

  // Get status badge based on data element action
  const getActionBadge = (action: DataElementAction) => {
    switch (action) {
      case 'Extract':
        return <Badge variant="success">EXTRACT</Badge>;
      case 'Redact':
        return <Badge variant="secondary">REDACT</Badge>;
      case 'ExtractAndRedact':
        return <Badge variant="default">EXTRACT & REDACT</Badge>;
      case 'Ignore':
        return <Badge variant="outline">IGNORE</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Document Data Elements</CardTitle>
            <CardDescription>Manage data elements for {selectedDocType.name}</CardDescription>
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
      <CardContent className="p-0">
        {isAdding || isEditing ? (
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <input
                  id="name"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Element name"
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
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Data Type</Label>
                  <select
                    id="type"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as DataElementType })}
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
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as DataElementCategory })}
                  >
                    <option value="General">General</option>
                    <option value="PII">PII</option>
                    <option value="Financial">Financial</option>
                    <option value="Medical">Medical</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <select
                  id="action"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value as DataElementAction })}
                >
                  <option value="Extract">Extract</option>
                  <option value="Redact">Redact</option>
                  <option value="ExtractAndRedact">Extract and Redact</option>
                  <option value="Ignore">Ignore</option>
                </select>
              </div>
              {formData.type === 'Custom' && (
                <div className="space-y-2">
                  <Label htmlFor="pattern">Regex Pattern</Label>
                  <input
                    id="pattern"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                    value={formData.pattern || ''}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    placeholder="Regular expression pattern"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="aliases">Aliases</Label>
                <input
                  id="aliases"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
                  value={formData.aliases}
                  onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                  placeholder="Comma-separated list of aliases"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Alternative names for this field (comma separated)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="required"
                    className="rounded border-gray-300 dark:border-navy-600 text-brand-600 focus:ring-brand-500"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  />
                  <Label htmlFor="required" className="mb-0">Required Field</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    className="rounded border-gray-300 dark:border-navy-600 text-brand-600 focus:ring-brand-500"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  <Label htmlFor="isDefault" className="mb-0">Default Field</Label>
                </div>
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
                  {isEditing ? 'Update' : 'Create'} Data Element
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {getDocumentDataElements().length > 0 ? (
              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-navy-700 text-white">
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
                              onClick={() => handleDelete(element.id)}
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
                  onClick={() => setIsAdding(true)}
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
