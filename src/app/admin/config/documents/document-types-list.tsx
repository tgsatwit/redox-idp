'use client';

import { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
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
  
  // Add state for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Handle document type selection
  const handleDocTypeSelect = async (docType: DocumentTypeConfig) => {
    try {
      console.log(`Selecting document type: ${docType.name} (${docType.id})`);
      
      // First set the selected document type to show immediate feedback to user
      // This will at least show basic information while we fetch the details
      setSelectedDocType(docType);
      setActiveTab('document-types');
      
      // Then try to fetch the full details
      const fullDocType = await fetchDocumentType(docType.id);
      
      if (fullDocType) {
        console.log(`Successfully fetched full document type: ${fullDocType.name}`);
        // Update with the complete data including subtypes and elements
        setSelectedDocType(fullDocType);
      } else {
        console.warn(`Could not fetch complete data for ${docType.name}, using basic info only`);
        // We already set the basic docType above, so no need to do it again
      }
    } catch (error) {
      console.error(`Error selecting document type ${docType.id}:`, error);
      // Still set the basic document type so the UI isn't broken
      setSelectedDocType(docType);
      setActiveTab('document-types');
    }
  };

  // Handle add new item button click
  const handleAddNew = () => {
    setFormMode('add');
  };
  
  // Add filtering function
  const getFilteredDocTypes = () => {
    if (!documentTypes) return [];
    
    if (!searchTerm.trim()) {
      return documentTypes;
    }
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return documentTypes.filter(docType => {
      const matchesName = docType.name.toLowerCase().includes(normalizedSearch);
      const matchesDescription = docType.description?.toLowerCase()?.includes(normalizedSearch) || false;
      
      return matchesName || matchesDescription;
    });
  };
  
  // Add pagination function
  const getPaginatedDocTypes = () => {
    const filteredItems = getFilteredDocTypes();
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

  if (loading && documentTypes.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }
  
  const { items: paginatedDocTypes, totalPages } = getPaginatedDocTypes();

  return (
    <div className="space-y-4">
      {/* Add search input */}
      {documentTypes.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search document types..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full px-3 py-2 pl-8 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <FiSearch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      )}
    
      {paginatedDocTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm ? (
            <p className="mb-2">No document types match your search</p>
          ) : (
            <p className="mb-2">No document types found</p>
          )}
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
          <div className="space-y-2">
            {paginatedDocTypes.map(docType => (
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
          </div>
          
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