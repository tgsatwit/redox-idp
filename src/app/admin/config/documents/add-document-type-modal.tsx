'use client';

import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { useDocumentConfig } from './document-config-context';
import { DataElementConfig, DocumentTypeConfig } from '@/lib/types';
import { createId } from '@paralleldrive/cuid2';

// Define available AWS Textract analysis types
const AWS_ANALYSIS_TYPES = [
  { value: 'TEXTRACT_ANALYZE_DOCUMENT', label: 'Analyze Document' },
  { value: 'TEXTRACT_ANALYZE_ID', label: 'Analyze ID Document' },
  { value: 'TEXTRACT_DETECT_TEXT', label: 'Detect Text Only' },
  { value: 'TEXTRACT_ANALYZE_EXPENSE', label: 'Analyze Expense' },
  { value: 'TEXTRACT_ANALYZE_LENDING', label: 'Analyze Lending Document' }
];

// Standard data elements for specific document types
const STANDARD_DATA_ELEMENTS: Record<string, DataElementConfig[]> = {
  'TEXTRACT_ANALYZE_ID': [
    {
      id: createId(),
      name: 'First Name',
      type: 'Text',
      category: 'PII',
      action: 'Extract',
      required: true,
      isDefault: true,
      aliases: ['first_name', 'given_name', 'firstName']
    },
    {
      id: createId(),
      name: 'Last Name',
      type: 'Text',
      category: 'PII',
      action: 'Extract',
      required: true,
      isDefault: true,
      aliases: ['last_name', 'surname', 'lastName']
    },
    {
      id: createId(),
      name: 'Date of Birth',
      type: 'Date',
      category: 'PII',
      action: 'Extract',
      required: false,
      isDefault: true,
      aliases: ['dob', 'birthdate', 'birth_date']
    },
    {
      id: createId(),
      name: 'Document Number',
      type: 'Text',
      category: 'General',
      action: 'Extract',
      required: true,
      isDefault: true,
      aliases: ['id_number', 'license_number', 'document_number']
    },
    {
      id: createId(),
      name: 'Expiration Date',
      type: 'Date',
      category: 'General',
      action: 'Extract',
      required: false,
      isDefault: true,
      aliases: ['expiry_date', 'expiration', 'valid_until']
    },
    {
      id: createId(),
      name: 'Address',
      type: 'Address',
      category: 'PII',
      action: 'Extract',
      required: false,
      isDefault: true,
      aliases: ['residential_address', 'mailing_address']
    }
  ],
  'TEXTRACT_ANALYZE_EXPENSE': [
    {
      id: createId(),
      name: 'Vendor Name',
      type: 'Text',
      category: 'General',
      action: 'Extract',
      required: true,
      isDefault: true,
      aliases: ['merchant', 'supplier', 'store_name']
    },
    {
      id: createId(),
      name: 'Receipt Date',
      type: 'Date',
      category: 'General',
      action: 'Extract',
      required: true,
      isDefault: true,
      aliases: ['date', 'purchase_date', 'transaction_date']
    },
    {
      id: createId(),
      name: 'Total Amount',
      type: 'Currency',
      category: 'Financial',
      action: 'Extract',
      required: true,
      isDefault: true,
      aliases: ['total', 'grand_total', 'amount']
    },
    {
      id: createId(),
      name: 'Tax Amount',
      type: 'Currency',
      category: 'Financial',
      action: 'Extract',
      required: false,
      isDefault: true,
      aliases: ['tax', 'sales_tax', 'vat', 'gst']
    },
    {
      id: createId(),
      name: 'Receipt Number',
      type: 'Text',
      category: 'General',
      action: 'Extract',
      required: false,
      isDefault: true,
      aliases: ['receipt_id', 'transaction_id', 'invoice_number']
    }
  ],
  'TEXTRACT_ANALYZE_LENDING': [
    {
      id: createId(),
      name: 'Borrower Name',
      type: 'Name',
      category: 'PII',
      action: 'Extract',
      required: true,
      isDefault: true,
      aliases: ['applicant_name', 'customer_name']
    },
    {
      id: createId(),
      name: 'Loan Amount',
      type: 'Currency',
      category: 'Financial',
      action: 'Extract',
      required: true,
      isDefault: true,
      aliases: ['principal', 'amount', 'loan_value']
    },
    {
      id: createId(),
      name: 'Interest Rate',
      type: 'Number',
      category: 'Financial',
      action: 'Extract',
      required: true,
      isDefault: true,
      aliases: ['rate', 'apr', 'annual_rate']
    },
    {
      id: createId(),
      name: 'Loan Term',
      type: 'Text',
      category: 'General',
      action: 'Extract',
      required: true,
      isDefault: true,
      aliases: ['term', 'duration', 'period']
    },
    {
      id: createId(),
      name: 'Property Address',
      type: 'Address',
      category: 'PII',
      action: 'Extract',
      required: false,
      isDefault: true,
      aliases: ['address', 'property_location']
    }
  ]
};

// Custom components
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

// Simple toast notification
const Toast = ({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-close after 3 seconds
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center px-4 py-3 rounded-md shadow-lg ${
      type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300' : 
      'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'
    }`}>
      {type === 'success' ? 
        <FiCheckCircle className="mr-2" size={18} /> : 
        <FiInfo className="mr-2" size={18} />
      }
      <p>{message}</p>
      <button 
        onClick={onClose} 
        className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <FiX size={16} />
      </button>
    </div>
  );
};

interface AddDocumentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDocumentTypeModal({ isOpen, onClose }: AddDocumentTypeModalProps) {
  const { createDocumentType } = useDocumentConfig();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [awsAnalysisType, setAwsAnalysisType] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [useStandardElements, setUseStandardElements] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStandardElements, setHasStandardElements] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setAwsAnalysisType('');
      setIsActive(true);
      setUseStandardElements(true);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Check if selected analysis type has standard elements
  useEffect(() => {
    setHasStandardElements(Boolean(awsAnalysisType && STANDARD_DATA_ELEMENTS[awsAnalysisType]));
  }, [awsAnalysisType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Document type name is required');
      return;
    }
    
    if (!awsAnalysisType) {
      setError('Please select an AWS analysis type');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare data elements based on selection
      const dataElements: DataElementConfig[] = [];
      
      if (useStandardElements && hasStandardElements) {
        // Clone the standard elements to avoid reference issues
        dataElements.push(...JSON.parse(JSON.stringify(STANDARD_DATA_ELEMENTS[awsAnalysisType])));
      }
      
      // Create new document type with a default subtype containing the AWS analysis type
      const newDocumentType: Omit<DocumentTypeConfig, 'id'> = {
        name,
        description: description || undefined,
        isActive,
        dataElements,
        awsAnalysisType, // Set it directly on the document type as well
        // Create a default subtype with the analysis type
        subTypes: [
          {
            id: createId(),
            name: `Default ${name} Subtype`,
            description: 'Default subtype created with document type',
            dataElements: [],
            awsAnalysisType, // Set analysis type in the subtype
            isActive: true,
            documentTypeId: '' // This will be set by the service when the document type is created
          }
        ]
      };
      
      const result = await createDocumentType(newDocumentType);
      
      if (result) {
        console.log('Document type created successfully:', result);
        setToast({
          message: `Document type "${name}" created successfully`,
          type: 'success'
        });
        onClose();
      } else {
        setError('Failed to create document type. Please try again.');
      }
    } catch (err) {
      console.error('Error creating document type:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-navy-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Document Type</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiX size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Document Type Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-700 dark:text-white"
                placeholder="Enter document type name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-700 dark:text-white"
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                AWS Textract Analysis Type *
              </label>
              <select
                value={awsAnalysisType}
                onChange={(e) => setAwsAnalysisType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-700 dark:text-white"
                required
              >
                <option value="">Select an analysis type</option>
                {AWS_ANALYSIS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                <FiInfo className="inline mr-1" size={12} />
                The analysis type will determine how AWS Textract processes this document
              </p>
            </div>
            
            {hasStandardElements && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useStandardElements"
                    checked={useStandardElements}
                    onChange={(e) => setUseStandardElements(e.target.checked)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-navy-600 dark:bg-navy-700"
                  />
                  <label htmlFor="useStandardElements" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Use standard data elements for this document type
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 pl-5">
                  Pre-populates common data elements for {AWS_ANALYSIS_TYPES.find(t => t.value === awsAnalysisType)?.label}
                </p>
                
                {useStandardElements && (
                  <div className="mt-2 pl-5">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Standard elements that will be added:</p>
                    <div className="bg-gray-50 dark:bg-navy-700/50 p-2 rounded-md max-h-48 overflow-y-auto">
                      <ul className="text-xs space-y-1">
                        {STANDARD_DATA_ELEMENTS[awsAnalysisType]?.map((element) => (
                          <li key={element.id} className="flex justify-between">
                            <span>{element.name}</span>
                            <span className="text-gray-500 dark:text-gray-400">{element.type}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-navy-600 dark:bg-navy-700"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-navy-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Spinner size="sm" className="mr-2" />
                    <span>Creating...</span>
                  </div>
                ) : 'Create Document Type'}
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
} 