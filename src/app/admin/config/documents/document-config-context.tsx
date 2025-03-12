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
  fetchDocumentTypes: () => Promise<void>;
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

  // Fetch all document types
  const fetchDocumentTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/update-config/document-types');
      if (!response.ok) {
        throw new Error('Failed to fetch document types');
      }
      const data = await response.json();
      setDocumentTypes(data);
    } catch (error) {
      console.error('Error fetching document types:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch document types',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific document type with associated data
  const fetchDocumentType = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/update-config/document-types/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch document type');
      }
      const data = await response.json();
      setSelectedDocType(data);
      return data;
    } catch (error) {
      console.error(`Error fetching document type ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to fetch document type details',
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

  // Create sub-type
  const createSubType = async (docTypeId: string, subType: Omit<DocumentSubTypeConfig, 'id'>) => {
    try {
      const response = await fetch(`/api/update-config/document-types/${docTypeId}/sub-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subType),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create sub-type');
      }
      
      const newSubType = await response.json();
      
      // Update the selected document type with the new sub-type
      if (selectedDocType && selectedDocType.id === docTypeId) {
        const updatedSubTypes = [...(selectedDocType.subTypes || []), newSubType];
        setSelectedDocType({
          ...selectedDocType,
          subTypes: updatedSubTypes,
        });
      }
      
      toast({
        title: 'Success',
        description: 'Sub-type created successfully',
      });
      setFormMode('none');
      return newSubType;
    } catch (error) {
      console.error(`Error creating sub-type for document type ${docTypeId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to create sub-type',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update sub-type
  const updateSubType = async (docTypeId: string, subTypeId: string, updates: Partial<DocumentSubTypeConfig>) => {
    try {
      const response = await fetch(`/api/update-config/document-types/${docTypeId}/sub-types/${subTypeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update sub-type');
      }
      
      // Update the selected document type with the updated sub-type
      if (selectedDocType && selectedDocType.id === docTypeId && selectedDocType.subTypes) {
        const updatedSubTypes = selectedDocType.subTypes.map(st => 
          st.id === subTypeId ? { ...st, ...updates } : st
        );
        
        setSelectedDocType({
          ...selectedDocType,
          subTypes: updatedSubTypes,
        });
      }
      
      // Update selected sub-type if it's the one being edited
      if (selectedSubType && selectedSubType.id === subTypeId) {
        setSelectedSubType({ ...selectedSubType, ...updates });
      }
      
      toast({
        title: 'Success',
        description: 'Sub-type updated successfully',
      });
      setFormMode('none');
      return true;
    } catch (error) {
      console.error(`Error updating sub-type ${subTypeId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to update sub-type',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Delete sub-type
  const deleteSubType = async (docTypeId: string, subTypeId: string) => {
    try {
      const response = await fetch(`/api/update-config/document-types/${docTypeId}/sub-types/${subTypeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete sub-type');
      }
      
      // Update the selected document type by removing the deleted sub-type
      if (selectedDocType && selectedDocType.id === docTypeId && selectedDocType.subTypes) {
        const updatedSubTypes = selectedDocType.subTypes.filter(st => st.id !== subTypeId);
        
        setSelectedDocType({
          ...selectedDocType,
          subTypes: updatedSubTypes,
        });
      }
      
      // Clear selected sub-type if it's the one being deleted
      if (selectedSubType && selectedSubType.id === subTypeId) {
        setSelectedSubType(null);
      }
      
      toast({
        title: 'Success',
        description: 'Sub-type deleted successfully',
      });
      return true;
    } catch (error) {
      console.error(`Error deleting sub-type ${subTypeId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete sub-type',
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