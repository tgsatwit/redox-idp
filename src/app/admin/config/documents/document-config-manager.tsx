'use client';

import { useState } from 'react';
import { FiPlus, FiEdit } from 'react-icons/fi';
import { useDocumentConfig } from './document-config-context';

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

// Tabs components
const Tabs = ({ className, children, value: _value, onValueChange: _onValueChange }: { className?: string; children?: React.ReactNode; value?: string; onValueChange?: (value: string) => void }) => (
  <div className={`${className || ""}`} role="tablist">
    {children}
  </div>
);

const TabsList = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={`flex border-b border-gray-200 dark:border-navy-700 ${className || ""}`}>
    {children}
  </div>
);

const TabsTrigger = ({ value, children, className, disabled = false, ...props }: { value: string; children?: React.ReactNode; className?: string; disabled?: boolean; [key: string]: any }) => {
  const isActive = props.active === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium ${
        isActive ? "text-brand-500 border-b-2 border-brand-500" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className || ""}`}
      onClick={() => props.onClick(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, activeValue, className, children }: { value: string; activeValue?: string; className?: string; children?: React.ReactNode }) => {
  if (activeValue !== value) return null;
  return (
    <div role="tabpanel" className={`py-4 ${className || ""}`}>
      {children}
    </div>
  );
};


const DocumentConfigManager: React.FC = () => {
  const {
    documentTypes,
    selectedDocType,
    activeTab,
    setActiveTab
  } = useDocumentConfig();
  
  const [loading, setLoading] = useState(false);

  const handleAddNew = () => {
    // Handle add new functionality
    console.log('Add new clicked');
  };




  // Main content area (for the middle card)
  const renderMainContent = () => {
    if (loading && documentTypes.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
          <p className="ml-4 text-gray-500 dark:text-gray-400">Loading document configuration...</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger 
                value="document-types" 
                active={activeTab} 
                onClick={() => setActiveTab('document-types')}
              >
                Document Details
              </TabsTrigger>
              <TabsTrigger 
                value="sub-types" 
                active={activeTab}
                onClick={() => setActiveTab('sub-types')}
                disabled={!selectedDocType}
              >
                Sub-Types {selectedDocType ? `(${selectedDocType.name})` : ''}
              </TabsTrigger>
              <TabsTrigger 
                value="data-elements" 
                active={activeTab}
                onClick={() => setActiveTab('data-elements')}
                disabled={!selectedDocType}
              >
                Data Elements {selectedDocType ? `(${selectedDocType.name})` : ''}
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'document-types' && (
              <Button 
                onClick={handleAddNew} 
                size="sm"
              >
                <FiPlus className="mr-2" size={14} />
                Add Document Type
              </Button>
            )}
          </div>

          <TabsContent value="document-types" activeValue={activeTab} className="space-y-4">
            {!selectedDocType ? (
              <div className="flex flex-col items-center justify-center p-8">
                <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">No Document Type Selected</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Select a document type from the list or create a new one</p>
                <Button onClick={handleAddNew}>
                  <FiPlus className="mr-2" size={16} />
                  Add Document Type
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-navy-700/80 rounded-md">
                <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">
                  {selectedDocType.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {selectedDocType.description || 'No description available'}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</h4>
                    <Badge variant={selectedDocType.isActive ? 'success' : 'secondary'}>
                      {selectedDocType.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sub-Types</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedDocType.subTypes?.length || 0} sub-types configured
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Data Elements</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedDocType.dataElements?.length || 0} elements configured
                    </p>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button variant="outline" size="sm" onClick={() => {
                    setLoading(true);
                  }}>
                    <FiEdit className="mr-1" size={14} />
                    Edit Document Type
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sub-types" activeValue={activeTab} className="space-y-4">
            {selectedDocType && (
              <div className="p-4 bg-gray-50 dark:bg-navy-700/80 rounded-md">
                <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">
                  {selectedDocType.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedDocType.description || 'No description available'}
                </p>
                {/* Sub-types would be listed here */}
                <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-2">Sub-types UI under development</p>
                  <Button variant="outline" size="sm" onClick={handleAddNew}>
                    <FiPlus className="mr-2" size={14} /> Add Sub-Type
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="data-elements" activeValue={activeTab} className="space-y-4">
            {(selectedDocType) && (
              <div className="p-4 bg-gray-50 dark:bg-navy-700/80 rounded-md">
                <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">
                  {selectedDocType.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedDocType.description || 'No description available'}
                </p>
                {/* Data elements would be listed here */}
                <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-2">Data elements UI under development</p>
                  <Button variant="outline" size="sm" onClick={handleAddNew}>
                    <FiPlus className="mr-2" size={14} /> Add Data Element
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return renderMainContent();
}

export default DocumentConfigManager; 