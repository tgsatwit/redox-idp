'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { 
  DocumentTypeConfig, 
  DocumentSubTypeConfig, 
  DataElementConfig 
} from '@/lib/types';

// Define the context type
interface DocumentConfigContextType {
  loading: boolean;
  documentTypes: DocumentTypeConfig[];
  selectedDocType: DocumentTypeConfig | null;
  selectedSubType: DocumentSubTypeConfig | null;
  activeTab: string;
  formMode: 'none' | 'add' | 'edit';
  setSelectedDocType: (docType: DocumentTypeConfig | null) => void;
  setSelectedSubType: (subType: DocumentSubTypeConfig | null) => void;
  setActiveTab: (tab: string) => void;
  setFormMode: (mode: 'none' | 'add' | 'edit') => void;
  fetchDocumentTypes: (forceRefresh?: boolean) => Promise<void>;
  fetchDocumentType: (id: string) => Promise<DocumentTypeConfig | null>;
  createDocumentType: (documentType: Omit<DocumentTypeConfig, 'id'>) => Promise<DocumentTypeConfig | null>;
  updateDocumentType: (id: string, updates: Partial<DocumentTypeConfig>) => Promise<boolean>;
  deleteDocumentType: (id: string) => Promise<boolean>;
  createSubType: (docTypeId: string, subType: Omit<DocumentSubTypeConfig, 'id'>) => Promise<DocumentSubTypeConfig | null>;
  updateSubType: (docTypeId: string, subTypeId: string, updates: Partial<DocumentSubTypeConfig>) => Promise<boolean>;
  deleteSubType: (docTypeId: string, subTypeId: string) => Promise<boolean>;
  createDataElement: (docTypeId: string, subTypeId: string | null, element: Omit<DataElementConfig, 'id'>) => Promise<DataElementConfig | null>;
  updateDataElement: (docTypeId: string, elementId: string, subTypeId: string | null, updates: Partial<DataElementConfig>) => Promise<boolean>;
  deleteDataElement: (docTypeId: string, elementId: string, subTypeId: string | null) => Promise<boolean>;
}

// Create context with default values
const DocumentConfigContext = createContext<DocumentConfigContextType>({
  loading: true,
  documentTypes: [],
  selectedDocType: null,
  selectedSubType: null,
  activeTab: 'document-types',
  formMode: 'none',
  setSelectedDocType: () => {},
  setSelectedSubType: () => {},
  setActiveTab: () => {},
  setFormMode: () => {},
  fetchDocumentTypes: async () => {},
  fetchDocumentType: async () => null,
  createDocumentType: async () => null,
  updateDocumentType: async () => false,
  deleteDocumentType: async () => false,
  createSubType: async () => null,
  updateSubType: async () => false,
  deleteSubType: async () => false,
  createDataElement: async () => null,
  updateDataElement: async () => false,
  deleteDataElement: async () => false,
});

// Toast notification function
const toast = ({ title, description, variant = 'default' }: { title: string; description: string; variant?: 'default' | 'destructive' }) => {
  console.log(`[Toast] ${variant}: ${title} - ${description}`);
  // In a real implementation, you would call your actual toast function here
};

// Provider component
export function DocumentConfigProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeConfig[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<DocumentTypeConfig | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<DocumentSubTypeConfig | null>(null);
  const [activeTab, setActiveTab] = useState('document-types');
  const [formMode, setFormMode] = useState<'none' | 'add' | 'edit'>('none');

  // Fetch document types on load
  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  // Reset sub-type selection when document type changes
  useEffect(() => {
    setSelectedSubType(null);
  }, [selectedDocType]);

  // Add a useEffect to log selectedSubType details whenever it changes
  useEffect(() => {
    if (selectedSubType) {
      console.log(`Selected sub-type changed to: ${selectedSubType.name} (${selectedSubType.id})`);
      console.log(`Sub-type has ${selectedSubType.dataElements?.length || 0} data elements:`);
      
      if (selectedSubType.dataElements && selectedSubType.dataElements.length > 0) {
        selectedSubType.dataElements.forEach((element, index) => {
          console.log(`  Element ${index + 1}: ${element.name}, Action: ${element.action}, ID: ${element.id}, SubTypeId: ${element.subTypeId}`);
        });
      } else {
        console.warn(`No data elements found for sub-type ${selectedSubType.id}`);
        
        // Check if we can find elements for this sub-type in the raw data
        if (selectedDocType && selectedDocType.id) {
          console.log(`Inspecting document type ${selectedDocType.id} for data elements with subTypeId: ${selectedSubType.id}`);
          
          // Look through all document data elements to find any with this subTypeId
          const allElements = selectedDocType.dataElements || [];
          const matchingElements = allElements.filter(elem => elem.subTypeId === selectedSubType.id);
          
          if (matchingElements.length > 0) {
            console.log(`Found ${matchingElements.length} data elements with this subTypeId in document elements:`);
            matchingElements.forEach((elem, idx) => {
              console.log(`  Found Element ${idx + 1}: ${elem.name}, Action: ${elem.action}, ID: ${elem.id}`);
            });
            console.warn(`These elements should be associated with the sub-type but are not.`);
          } else {
            console.log(`No elements found with subTypeId: ${selectedSubType.id} in document elements.`);
          }
        }
      }
    }
  }, [selectedSubType, selectedDocType]);

  // Fetch detailed document type data when selectedDocType.id changes
  useEffect(() => {
    if (selectedDocType && selectedDocType.id) {
      // Fetch detailed document type data
      console.log(`Selected document type changed to ${selectedDocType.id}, fetching details...`);
      fetchDocumentType(selectedDocType.id);
    }
  }, [selectedDocType?.id]);

  // Fetch all document types
  const fetchDocumentTypes = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // First try the debug endpoint to check DynamoDB connectivity
      console.log('Checking DynamoDB connectivity...');
      let debugResponse;
      try {
        debugResponse = await fetch('/api/update-config/debug');
        const debugData = await debugResponse.json();
        console.log('DynamoDB Debug Info:', debugData);
        
        if (!debugData.connectionTest.success) {
          console.warn('DynamoDB connection issue detected:', debugData.connectionTest.message);
        }
      } catch (debugError) {
        console.error('Failed to check DynamoDB connectivity:', debugError);
      }
      
      // Now fetch the document types
      console.log('Fetching document types...');
      const response = await fetch('/api/update-config/document-types', {
        headers: forceRefresh ? {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        } : {}
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document types: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched document types:', data);
      
      // Validate that we received an array
      if (!Array.isArray(data)) {
        console.error('Invalid response format - expected array of document types', data);
        toast({
          title: 'Error',
          description: 'Received invalid data format from server',
          variant: 'destructive',
        });
        setDocumentTypes([]);
        return;
      }
      
      setDocumentTypes(data);
    } catch (error) {
      console.error('Error fetching document types:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch document types. Please refresh or check network connection.',
        variant: 'destructive',
      });
      setDocumentTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific document type with associated data
  const fetchDocumentType = async (id: string) => {
    setLoading(true);
    try {
      console.log(`Fetching document type ${id}...`);
      
      // Add cache-busting parameters to prevent stale data
      const response = await fetch(`/api/update-config/document-types/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        // Get the response text if possible for better debugging
        let errorDetails = '';
        try {
          const errorText = await response.text();
          errorDetails = errorText;
        } catch (textError) {
          errorDetails = 'Could not retrieve error details';
        }
        
        console.error(`Failed to fetch document type: ${response.status} ${response.statusText}. Details: ${errorDetails}`);
        
        // For 500 errors, try one more time after a short delay
        if (response.status === 500) {
          console.log('Server error (500), attempting retry after delay...');
          
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try again with a more basic request
          const retryResponse = await fetch(`/api/update-config/document-types/${id}`);
          
          if (!retryResponse.ok) {
            throw new Error(`Retry failed: ${retryResponse.status} ${retryResponse.statusText}`);
          }
          
          const retryData = await retryResponse.json();
          console.log('Retry successful, fetched document type:', retryData);
          
          // Validate data structure
          if (!retryData || !retryData.id) {
            console.error('Invalid document type data received from retry:', retryData);
            toast({
              title: 'Error',
              description: 'Received invalid document type data from server',
              variant: 'destructive',
            });
            return null;
          }
          
          setSelectedDocType(retryData);
          return retryData;
        }
        
        throw new Error(`Failed to fetch document type: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched document type:', data);
      
      // Validate data structure
      if (!data || !data.id) {
        console.error('Invalid document type data received:', data);
        toast({
          title: 'Error',
          description: 'Received invalid document type data from server',
          variant: 'destructive',
        });
        return null;
      }
      
      // Check for subtypes and data elements
      if (data.subTypes) {
        console.log(`Document type has ${data.subTypes.length} sub-types`);
        
        // Log information about data elements for each subtype
        data.subTypes.forEach((subType: DocumentSubTypeConfig) => {
          console.log(`Sub-type ${subType.id} (${subType.name}) has ${subType.dataElements?.length || 0} data elements`);
          
          if (subType.dataElements && subType.dataElements.length > 0) {
            subType.dataElements.forEach((element: DataElementConfig) => {
              console.log(`- Element ${element.id} (${element.name}): action = ${element.action}`);
            });
          }
        });
      } else {
        // Ensure subtypes is at least an empty array to prevent null references
        data.subTypes = [];
      }
      
      // Log document-level data elements
      if (data.dataElements) {
        console.log(`Document type has ${data.dataElements.length} document-level data elements`);
        
        if (data.dataElements.length > 0) {
          data.dataElements.forEach((element: DataElementConfig) => {
            console.log(`- Element ${element.id} (${element.name}): action = ${element.action}`);
          });
        }
      } else {
        // Ensure dataElements is at least an empty array to prevent null references
        data.dataElements = [];
      }
      
      setSelectedDocType(data);
      return data;
    } catch (error) {
      console.error(`Error fetching document type ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to fetch document type details. Will use basic information.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create document type
  const createDocumentType = async (documentType: Omit<DocumentTypeConfig, 'id'>) => {
    try {
      const response = await fetch('/api/update-config/document-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentType),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create document type');
      }
      
      const newDocType = await response.json();
      setDocumentTypes(prev => [...prev, newDocType]);
      toast({
        title: 'Success',
        description: 'Document type created successfully',
      });
      setFormMode('none');
      return newDocType;
    } catch (error) {
      console.error('Error creating document type:', error);
      toast({
        title: 'Error',
        description: 'Failed to create document type',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update document type
  const updateDocumentType = async (id: string, updates: Partial<DocumentTypeConfig>) => {
    try {
      const response = await fetch(`/api/update-config/document-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update document type');
      }
      
      setDocumentTypes(prev => 
        prev.map(dt => dt.id === id ? { ...dt, ...updates } : dt)
      );
      
      if (selectedDocType && selectedDocType.id === id) {
        setSelectedDocType(prev => prev ? { ...prev, ...updates } : null);
      }
      
      toast({
        title: 'Success',
        description: 'Document type updated successfully',
      });
      setFormMode('none');
      return true;
    } catch (error) {
      console.error(`Error updating document type ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to update document type',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Delete document type
  const deleteDocumentType = async (id: string) => {
    try {
      const response = await fetch(`/api/update-config/document-types/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document type');
      }
      
      setDocumentTypes(prev => prev.filter(dt => dt.id !== id));
      
      if (selectedDocType && selectedDocType.id === id) {
        setSelectedDocType(null);
      }
      
      toast({
        title: 'Success',
        description: 'Document type deleted successfully',
      });
      return true;
    } catch (error) {
      console.error(`Error deleting document type ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete document type',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Create a sub-type for a document type
  const createSubType = async (docTypeId: string, subType: Omit<DocumentSubTypeConfig, 'id'>) => {
    try {
      // Log the request
      console.log(`Creating sub-type for document type ${docTypeId}:`, subType);
      
      const response = await fetch(`/api/update-config/document-types/${docTypeId}/sub-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subType),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error creating sub-type:', errorData);
        throw new Error(`Failed to create sub-type: ${response.status} ${response.statusText}`);
      }
      
      const newSubType = await response.json();
      console.log('Created sub-type:', newSubType);
      
      // Update the local state with the new sub-type
      if (selectedDocType && selectedDocType.id === docTypeId) {
        // Update the selected document type
        setSelectedDocType(prev => {
          if (!prev) return null;
          
          const updatedSubTypes = [...(prev.subTypes || []), newSubType];
          return { ...prev, subTypes: updatedSubTypes };
        });
      }
      
      // Also update the document types list
      setDocumentTypes(prev => 
        prev.map(dt => {
          if (dt.id === docTypeId) {
            const updatedSubTypes = [...(dt.subTypes || []), newSubType];
            return { ...dt, subTypes: updatedSubTypes };
          }
          return dt;
        })
      );
      
      toast({
        title: 'Success',
        description: 'Sub-type created successfully',
      });
      
      return newSubType;
    } catch (error) {
      console.error(`Error creating sub-type for document type ${docTypeId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to create sub-type. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update a sub-type for a document type
  const updateSubType = async (docTypeId: string, subTypeId: string, updates: Partial<DocumentSubTypeConfig>) => {
    try {
      // Log the request
      console.log(`Updating sub-type ${subTypeId} for document type ${docTypeId}:`, updates);
      
      const response = await fetch(`/api/update-config/document-types/${docTypeId}/sub-types/${subTypeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error updating sub-type:', errorData);
        throw new Error(`Failed to update sub-type: ${response.status} ${response.statusText}`);
      }
      
      console.log('Sub-type updated successfully');
      
      // Update the local state with the updated sub-type
      if (selectedDocType && selectedDocType.id === docTypeId) {
        // Update the selected document type
        setSelectedDocType(prev => {
          if (!prev) return null;
          
          const updatedSubTypes = (prev.subTypes || []).map(st => 
            st.id === subTypeId ? { ...st, ...updates } : st
          );
          
          return { ...prev, subTypes: updatedSubTypes };
        });
        
        // If this is the currently selected sub-type, update it
        if (selectedSubType && selectedSubType.id === subTypeId) {
          setSelectedSubType(prev => prev ? { ...prev, ...updates } : null);
        }
      }
      
      // Also update the document types list
      setDocumentTypes(prev => 
        prev.map(dt => {
          if (dt.id === docTypeId) {
            const updatedSubTypes = (dt.subTypes || []).map(st => 
              st.id === subTypeId ? { ...st, ...updates } : st
            );
            return { ...dt, subTypes: updatedSubTypes };
          }
          return dt;
        })
      );
      
      toast({
        title: 'Success',
        description: 'Sub-type updated successfully',
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating sub-type ${subTypeId} for document type ${docTypeId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to update sub-type. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Delete a sub-type
  const deleteSubType = async (docTypeId: string, subTypeId: string) => {
    try {
      // Log the request
      console.log(`Deleting sub-type ${subTypeId} for document type ${docTypeId}`);
      
      const response = await fetch(`/api/update-config/document-types/${docTypeId}/sub-types/${subTypeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error deleting sub-type:', errorData);
        throw new Error(`Failed to delete sub-type: ${response.status} ${response.statusText}`);
      }
      
      console.log('Sub-type deleted successfully');
      
      // Update the local state to remove the deleted sub-type
      if (selectedDocType && selectedDocType.id === docTypeId) {
        // Update the selected document type
        setSelectedDocType(prev => {
          if (!prev) return null;
          
          const updatedSubTypes = (prev.subTypes || []).filter(st => st.id !== subTypeId);
          return { ...prev, subTypes: updatedSubTypes };
        });
        
        // If this is the currently selected sub-type, clear it
        if (selectedSubType && selectedSubType.id === subTypeId) {
          setSelectedSubType(null);
        }
      }
      
      // Also update the document types list
      setDocumentTypes(prev => 
        prev.map(dt => {
          if (dt.id === docTypeId) {
            const updatedSubTypes = (dt.subTypes || []).filter(st => st.id !== subTypeId);
            return { ...dt, subTypes: updatedSubTypes };
          }
          return dt;
        })
      );
      
      toast({
        title: 'Success',
        description: 'Sub-type deleted successfully',
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting sub-type ${subTypeId} for document type ${docTypeId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete sub-type. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Create data element
  const createDataElement = async (docTypeId: string, subTypeId: string | null, element: Omit<DataElementConfig, 'id'>) => {
    try {
      const endpoint = subTypeId 
        ? `/api/update-config/document-types/${docTypeId}/sub-types/${subTypeId}/elements`
        : `/api/update-config/document-types/${docTypeId}/elements`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(element),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create data element');
      }
      
      const newElement = await response.json();
      
      // Update the local state based on whether the element belongs to a sub-type or document type
      if (subTypeId && selectedSubType && selectedDocType) {
        // Update sub-type elements
        const updatedSubTypes = selectedDocType.subTypes?.map(st => {
          if (st.id === subTypeId) {
            return {
              ...st,
              dataElements: [...(st.dataElements || []), newElement],
            };
          }
          return st;
        }) || [];
        
        setSelectedDocType({
          ...selectedDocType,
          subTypes: updatedSubTypes,
        });
        
        if (selectedSubType.id === subTypeId) {
          setSelectedSubType({
            ...selectedSubType,
            dataElements: [...(selectedSubType.dataElements || []), newElement],
          });
        }
      } else if (selectedDocType && selectedDocType.id === docTypeId) {
        // Update document type elements
        setSelectedDocType({
          ...selectedDocType,
          dataElements: [...(selectedDocType.dataElements || []), newElement],
        });
      }
      
      toast({
        title: 'Success',
        description: 'Data element created successfully',
      });
      setFormMode('none');
      return newElement;
    } catch (error) {
      console.error(`Error creating data element:`, error);
      toast({
        title: 'Error',
        description: 'Failed to create data element',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update data element
  const updateDataElement = async (docTypeId: string, elementId: string, subTypeId: string | null, updates: Partial<DataElementConfig>) => {
    try {
      const endpoint = subTypeId
        ? `/api/update-config/document-types/${docTypeId}/sub-types/${subTypeId}/elements/${elementId}`
        : `/api/update-config/document-types/${docTypeId}/elements/${elementId}`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update data element');
      }
      
      // Update the local state based on whether the element belongs to a sub-type or document type
      if (subTypeId && selectedSubType && selectedDocType) {
        // Update sub-type elements
        const updatedSubTypes = selectedDocType.subTypes?.map(st => {
          if (st.id === subTypeId && st.dataElements) {
            return {
              ...st,
              dataElements: st.dataElements.map(el => 
                el.id === elementId ? { ...el, ...updates } : el
              ),
            };
          }
          return st;
        }) || [];
        
        setSelectedDocType({
          ...selectedDocType,
          subTypes: updatedSubTypes,
        });
        
        if (selectedSubType.id === subTypeId && selectedSubType.dataElements) {
          setSelectedSubType({
            ...selectedSubType,
            dataElements: selectedSubType.dataElements.map(el => 
              el.id === elementId ? { ...el, ...updates } : el
            ),
          });
        }
      } else if (selectedDocType && selectedDocType.id === docTypeId && selectedDocType.dataElements) {
        // Update document type elements
        setSelectedDocType({
          ...selectedDocType,
          dataElements: selectedDocType.dataElements.map(el => 
            el.id === elementId ? { ...el, ...updates } : el
          ),
        });
      }
      
      toast({
        title: 'Success',
        description: 'Data element updated successfully',
      });
      setFormMode('none');
      return true;
    } catch (error) {
      console.error(`Error updating data element ${elementId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to update data element',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Delete data element
  const deleteDataElement = async (docTypeId: string, elementId: string, subTypeId: string | null) => {
    try {
      const endpoint = subTypeId
        ? `/api/update-config/document-types/${docTypeId}/sub-types/${subTypeId}/elements/${elementId}`
        : `/api/update-config/document-types/${docTypeId}/elements/${elementId}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete data element');
      }
      
      // Update the local state based on whether the element belongs to a sub-type or document type
      if (subTypeId && selectedSubType && selectedDocType) {
        // Update sub-type elements
        const updatedSubTypes = selectedDocType.subTypes?.map(st => {
          if (st.id === subTypeId && st.dataElements) {
            return {
              ...st,
              dataElements: st.dataElements.filter(el => el.id !== elementId),
            };
          }
          return st;
        }) || [];
        
        setSelectedDocType({
          ...selectedDocType,
          subTypes: updatedSubTypes,
        });
        
        if (selectedSubType.id === subTypeId && selectedSubType.dataElements) {
          setSelectedSubType({
            ...selectedSubType,
            dataElements: selectedSubType.dataElements.filter(el => el.id !== elementId),
          });
        }
      } else if (selectedDocType && selectedDocType.id === docTypeId && selectedDocType.dataElements) {
        // Update document type elements
        setSelectedDocType({
          ...selectedDocType,
          dataElements: selectedDocType.dataElements.filter(el => el.id !== elementId),
        });
      }
      
      toast({
        title: 'Success',
        description: 'Data element deleted successfully',
      });
      return true;
    } catch (error) {
      console.error(`Error deleting data element ${elementId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete data element',
        variant: 'destructive',
      });
      return false;
    }
  };

  const value = {
    loading,
    documentTypes,
    selectedDocType,
    selectedSubType,
    activeTab,
    formMode,
    setSelectedDocType,
    setSelectedSubType,
    setActiveTab,
    setFormMode,
    fetchDocumentTypes,
    fetchDocumentType,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
    createSubType,
    updateSubType,
    deleteSubType,
    createDataElement,
    updateDataElement,
    deleteDataElement,
  };

  return (
    <DocumentConfigContext.Provider value={value}>
      {children}
    </DocumentConfigContext.Provider>
  );
}

// Hook for easy context consumption
export function useDocumentConfig() {
  const context = useContext(DocumentConfigContext);
  if (context === undefined) {
    throw new Error('useDocumentConfig must be used within a DocumentConfigProvider');
  }
  return context;
} 