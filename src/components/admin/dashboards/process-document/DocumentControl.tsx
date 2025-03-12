import { useState, useEffect } from 'react';
import Card from '@/components/card';
import { MdSync, MdError, MdWarning, MdCheckCircle, MdContentCopy, MdSettings, MdInfo, MdStorage } from 'react-icons/md';
import { BsCheckCircle } from 'react-icons/bs';

// Constants for configuration
const DYNAMODB_ELEMENT_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_ELEMENT_TABLE || 'document-processor-elements';

// Known document types and their IDs to help with debugging
const DOCUMENT_TYPE_MAP: Record<string, string> = {
  'ID Document': 'byvwu9fbl62ku1dj370agewe',
  // Add more as needed
};

// Known document subtypes and their IDs
const DOCUMENT_SUBTYPE_MAP: Record<string, string> = {
  'Passport': 'aafc32e1-9cbe-4ba4-9a12-a03b19563499',
  "Driver's License": '302bbb499-cb8e-48e3-8baf-4c57f2d13107',
  // Add more as needed
};

interface DocumentElement {
  id: string;
  documentTypeId: string;
  subTypeId?: string;
  name: string;
  description?: string;
  category: string;
  required: boolean;
  action: string;
  aliases: string[];
}

interface ExtractedField {
  id?: string;
  type?: string;
  name?: string;
  label?: string;
  value?: string;
  text?: string;
  confidence?: number;
}

interface DocumentControlProps {
  documentType?: string;
  documentSubType?: string;
  extractedFields?: ExtractedField[];
  onFieldsMatched?: (matchedFields: Array<{
    element: DocumentElement;
    field: ExtractedField;
    matched: boolean;
  }>) => void;
  isLoading?: boolean;
}

const DocumentControl = ({
  documentType,
  documentSubType,
  extractedFields = [],
  onFieldsMatched,
  isLoading = false
}: DocumentControlProps) => {
  const [documentElements, setDocumentElements] = useState<DocumentElement[]>([]);
  const [isLoadingElements, setIsLoadingElements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedElements, setMatchedElements] = useState<Array<{
    element: DocumentElement;
    field: ExtractedField | null;
    matched: boolean;
    confidence?: number;
  }>>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  
  // Fetch document elements from DynamoDB based on document type and subtype
  useEffect(() => {
    const fetchDocumentElements = async () => {
      if (!documentType) return;
      
      setIsLoadingElements(true);
      setError(null);
      
      try {
        // API call to get document elements from DynamoDB
        const response = await fetch(`/api/document-elements?documentType=${documentType}${documentSubType ? `&subType=${documentSubType}` : ''}`);
        setFetchAttempted(true);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch document elements: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // The responseData should be an array of elements
        setDocumentElements(Array.isArray(responseData) ? responseData : []);
        
        // Match elements with extracted fields
        matchElementsWithFields(Array.isArray(responseData) ? responseData : []);
      } catch (error) {
        console.error('Error fetching document elements:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoadingElements(false);
      }
    };
    
    fetchDocumentElements();
  }, [documentType, documentSubType, extractedFields]);
  
  // Match document elements with extracted fields based on name and aliases
  const matchElementsWithFields = (elements: DocumentElement[]) => {
    if (!elements.length || !extractedFields.length) {
      setMatchedElements(elements.map(element => ({
        element,
        field: null,
        matched: false
      })));
      return;
    }
    
    const matches = elements.map(element => {
      // Try to find a match in extracted fields based on name or aliases
      const matchedField = extractedFields.find(field => {
        const fieldName = field.name || field.label || '';
        
        // Check if field name matches element name (case insensitive)
        if (fieldName.toLowerCase() === element.name.toLowerCase()) {
          return true;
        }
        
        // Check if field name matches any of the element aliases (case insensitive)
        return element.aliases.some(alias => 
          fieldName.toLowerCase() === alias.toLowerCase()
        );
      });
      
      return {
        element,
        field: matchedField || null,
        matched: !!matchedField,
        confidence: matchedField?.confidence
      };
    });
    
    setMatchedElements(matches);
    
    // Notify parent component of matched fields
    if (onFieldsMatched) {
      onFieldsMatched(matches.filter(m => m.matched).map(m => ({
        element: m.element,
        field: m.field!,
        matched: m.matched
      })));
    }
  };
  
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.7) return 'text-amber-500';
    return 'text-red-500';
  };

  // Calculate matching statistics
  const matchStats = {
    total: matchedElements.length,
    matched: matchedElements.filter(m => m.matched).length,
    requiredTotal: matchedElements.filter(m => m.element.required).length,
    requiredMatched: matchedElements.filter(m => m.element.required && m.matched).length,
  };

  // Lookup functions to help with debugging
  const getDocumentTypeId = (type: string | undefined) => {
    if (!type) return 'unknown';
    return DOCUMENT_TYPE_MAP[type] || 'Not found in mapping';
  };
  
  const getDocumentSubTypeId = (subType: string | undefined) => {
    if (!subType) return 'none';
    return DOCUMENT_SUBTYPE_MAP[subType] || 'Not found in mapping';
  };

  return (
    <Card extra="w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-navy-700 dark:text-white">Document Control</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-navy-700"
        >
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-2">
          {(isLoadingElements || isLoading) ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-navy-700 dark:text-white">Loading document elements...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 py-6 text-red-500">
              <div className="flex items-center mb-2">
                <MdError className="w-6 h-6 mr-2" />
                <span>Error loading document elements</span>
              </div>
              <p className="text-sm text-red-400 mb-3">{error}</p>
              
              <div className="w-full max-w-md p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                <div className="flex items-center mb-2">
                  <MdInfo className="w-5 h-5 mr-1 text-amber-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Troubleshooting DynamoDB Issues:</span>
                </div>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Check if your AWS credentials have DynamoDB permissions</li>
                  <li>Verify the table name <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{DYNAMODB_ELEMENT_TABLE}</code> exists</li>
                  <li>Ensure the correct AWS region is configured</li>
                  <li>Check network connectivity to AWS services</li>
                </ul>

                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                  <div className="flex items-center mb-2">
                    <MdStorage className="w-5 h-5 mr-1 text-amber-500" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Document Type Configuration:</span>
                  </div>
                  <div className="bg-white dark:bg-navy-800 p-3 rounded-md text-xs">
                    <p><span className="font-semibold">Document Type:</span> {documentType || 'Unknown'}</p>
                    <p><span className="font-semibold">Expected documentTypeId:</span> {getDocumentTypeId(documentType)}</p>
                    {documentSubType && (
                      <>
                        <p><span className="font-semibold">Document SubType:</span> {documentSubType}</p>
                        <p><span className="font-semibold">Expected subTypeId:</span> {getDocumentSubTypeId(documentSubType)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : documentElements.length === 0 && fetchAttempted ? (
            <div className="flex flex-col items-center justify-center p-6 text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <div className="flex items-center mb-3">
                <MdSettings className="w-6 h-6 mr-2 text-amber-500" />
                <span className="font-medium">No document elements configured</span>
              </div>
              <p className="text-sm text-center max-w-md">
                No data elements are configured for this document type. 
                This could be due to:
              </p>
              <ul className="text-sm mt-2 list-disc list-inside">
                <li>Missing AWS DynamoDB configuration</li>
                <li>No elements defined for this document type in the database</li>
                <li>The document type "{documentType}" needs to be set up</li>
              </ul>

              <div className="w-full max-w-md mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                <div className="flex items-center mb-2">
                  <MdStorage className="w-5 h-5 mr-1 text-amber-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Expected DynamoDB Configuration:</span>
                </div>
                <div className="bg-white dark:bg-navy-800 p-3 rounded-md text-xs">
                  <p><span className="font-semibold">DynamoDB Table:</span> {DYNAMODB_ELEMENT_TABLE}</p>
                  <p><span className="font-semibold">Document Type:</span> {documentType || 'Unknown'}</p>
                  <p><span className="font-semibold">Expected documentTypeId:</span> {getDocumentTypeId(documentType)}</p>
                  {documentSubType && (
                    <>
                      <p><span className="font-semibold">Document SubType:</span> {documentSubType}</p>
                      <p><span className="font-semibold">Expected subTypeId:</span> {getDocumentSubTypeId(documentSubType)}</p>
                    </>
                  )}
                </div>
                <p className="mt-3 text-center">
                  Contact your administrator to configure document elements for this document type
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Matching statistics */}
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {matchStats.matched}/{matchStats.total}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Elements Matched
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${
                    matchStats.requiredMatched === matchStats.requiredTotal 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {matchStats.requiredMatched}/{matchStats.requiredTotal}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Required Elements
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {matchStats.matched ? Math.round((matchStats.matched / matchStats.total) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Match Rate
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {extractedFields.length - matchStats.matched}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Unmatched Fields
                  </div>
                </div>
              </div>
              
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Required Data Elements
                    </h4>
                    <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 max-h-[350px] overflow-y-auto">
                      <div className="grid grid-cols-1 gap-2">
                        {matchedElements
                          .filter(match => match.element.required)
                          .map((match, index) => (
                            <div 
                              key={match.element.id || index}
                              className={`flex items-center justify-between p-2 rounded-md ${match.matched 
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30' 
                                : 'bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600'}`}
                            >
                              <div className="flex items-center">
                                {match.matched ? (
                                  <MdCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mr-2" />
                                ) : (
                                  <MdWarning className="w-5 h-5 text-red-500 flex-shrink-0 mr-2" />
                                )}
                                <span className="font-medium text-navy-700 dark:text-white text-sm">
                                  {match.element.name}
                                </span>
                              </div>
                              
                              {match.matched && match.field && (
                                <div className="flex items-center text-sm">
                                  <span className={`mr-2 ${getConfidenceColor(match.confidence)} text-xs`}>
                                    {match.confidence ? `${(match.confidence * 100).toFixed(0)}%` : ''}
                                  </span>
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 max-w-[150px] truncate">
                                    {match.field.value || match.field.text || 'No value'}
                                  </span>
                                </div>
                              )}
                              
                              {!match.matched && (
                                <span className="text-xs text-red-500">Missing</span>
                              )}
                            </div>
                          ))}
                      </div>
                      
                      {matchedElements.filter(match => match.element.required).length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 p-3">
                          No required elements configured
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Optional Data Elements
                    </h4>
                    <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 max-h-[350px] overflow-y-auto">
                      <div className="grid grid-cols-1 gap-2">
                        {matchedElements
                          .filter(match => !match.element.required)
                          .map((match, index) => (
                            <div 
                              key={match.element.id || index}
                              className={`flex items-center justify-between p-2 rounded-md ${match.matched 
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30' 
                                : 'bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600'}`}
                            >
                              <div className="flex items-center">
                                {match.matched ? (
                                  <MdCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mr-2" />
                                ) : (
                                  <span className="w-5 h-5 flex-shrink-0 mr-2"></span>
                                )}
                                <span className="font-medium text-navy-700 dark:text-white text-sm">
                                  {match.element.name}
                                </span>
                              </div>
                              
                              {match.matched && match.field && (
                                <div className="flex items-center text-sm">
                                  <span className={`mr-2 ${getConfidenceColor(match.confidence)} text-xs`}>
                                    {match.confidence ? `${(match.confidence * 100).toFixed(0)}%` : ''}
                                  </span>
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 max-w-[150px] truncate">
                                    {match.field.value || match.field.text || 'No value'}
                                  </span>
                                </div>
                              )}
                              
                              {!match.matched && (
                                <span className="text-xs text-gray-400">Not found</span>
                              )}
                            </div>
                          ))}
                      </div>
                      
                      {matchedElements.filter(match => !match.element.required).length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 p-3">
                          No optional elements configured
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Section for unmatched extracted fields */}
                {extractedFields.length > matchStats.matched && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Unmatched Extracted Fields
                    </h4>
                    <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {extractedFields.filter(field => 
                          !matchedElements.some(match => 
                            match.matched && match.field && 
                            (match.field.id === field.id || 
                             match.field.name === field.name || 
                             match.field.label === field.label)
                          )
                        ).map((field, index) => (
                          <div 
                            key={field.id || index}
                            className="p-2 border border-gray-200 dark:border-navy-600 rounded-md bg-white dark:bg-navy-800"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm text-navy-700 dark:text-white">
                                {field.name || field.label || `Field ${index + 1}`}
                              </span>
                              <span className={`text-xs ${getConfidenceColor(field.confidence)}`}>
                                {field.confidence ? `${(field.confidence * 100).toFixed(1)}%` : ''}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {field.value || field.text || 'No value'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default DocumentControl; 