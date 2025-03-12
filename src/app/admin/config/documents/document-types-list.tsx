'use client';

import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useDocumentConfig } from './document-config-context';
import { DocumentTypeConfig } from '@/lib/types';

// Custom UI Components
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

export default function DocumentTypesList() {
  const { 
    loading, 
    documentTypes, 
    selectedDocType, 
    fetchDocumentType,
    setSelectedDocType,
    setActiveTab,
    setFormMode,
    deleteDocumentType
  } = useDocumentConfig();

  // Handle document type selection
  const handleDocTypeSelect = async (docType: DocumentTypeConfig) => {
    const fullDocType = await fetchDocumentType(docType.id);
    if (fullDocType) {
      setSelectedDocType(fullDocType);
      setActiveTab('document-types');
    }
  };

  // Handle add new item button click
  const handleAddNew = () => {
    setFormMode('add');
  };

  if (loading && documentTypes.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documentTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="mb-2">No document types found</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={handleAddNew}
          >
            Create one
          </Button>
        </div>
      ) : (
        <>
          {documentTypes.map(docType => (
            <div 
              key={docType.id}
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                selectedDocType?.id === docType.id 
                  ? 'bg-gray-100 dark:bg-navy-700 shadow-md border-l-4 border-l-brand-500 dark:border-l-brand-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-navy-700 bg-gray-50 dark:bg-navy-700/80'
              }`}
              onClick={() => handleDocTypeSelect(docType)}
            >
              <div>
                <p className={`font-medium ${selectedDocType?.id === docType.id ? 'text-brand-800 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                  {docType.name}
                </p>
                <p className={`text-xs ${selectedDocType?.id === docType.id ? 'text-brand-600 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                  {docType.subTypes?.length || 0} sub-types
                </p>
              </div>
              <button
                className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-navy-700"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this document type?')) {
                    deleteDocumentType(docType.id);
                  }
                }}
              >
                <FiTrash2 size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ))}
          
          {/* Add divider and Add Document Type button */}
          <div className="pt-2">
            <div className="h-px bg-gray-200 dark:bg-navy-700 my-2"></div>
            <Button 
              variant="outline"
              size="sm"
              className="w-full justify-center mt-1"
              onClick={handleAddNew}
            >
              <FiPlus className="mr-2" size={14} />
              Add Document Type
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 