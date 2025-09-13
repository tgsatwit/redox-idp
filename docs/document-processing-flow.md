# Document Processing Flow - Technical Documentation

## Overview

The `/src/app/admin/document-processing/process/` flow implements a sophisticated 4-stage document processing pipeline that combines multiple AWS services with OpenAI's GPT-4o for intelligent document analysis, classification, and field extraction.

## Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │───▶│   Analyze   │───▶│   Process   │───▶│  Finalize   │
│             │    │             │    │             │    │             │
│ File Upload │    │ Multi-layer │    │ Field Match │    │ Redaction & │
│ Validation  │    │ Classification│   │ & Extract   │    │ Output      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Stage 1: Upload (`DocumentUpload.tsx`)

### Technical Implementation
- **Component**: `DocumentUpload.tsx`
- **File Types**: PDF, JPEG, PNG, TIFF
- **Features**: Drag-and-drop, file validation, preview generation

### Code Flow
```typescript
// File validation
const validateFile = (file: File) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
  return allowedTypes.includes(file.type);
};

// Processing modes
- Predefined workflows (API-driven)
- One-off processing (manual)
```

### Dependencies
- **React**: `useState`, `useCallback`, `useDropzone`
- **Validation**: File type and size validation
- **UI**: React Icons, Tailwind CSS

## Stage 2: Analysis (`DocumentClassification.tsx`)

### Multi-Layer Classification System

#### 2.1 Text Extraction (Primary)
**API Endpoint**: `/api/docs-2-analyse/analyse-document`

**AWS Services**:
- **Amazon Textract**: 
  - Features: `FORMS`, `TABLES`
  - Output: Structured blocks with bounding boxes
  - Confidence scores for each extraction

**Implementation Flow**:
```typescript
// API call structure
const response = await fetch('/api/docs-2-analyse/analyse-document', {
  method: 'POST',
  body: formData // Contains file + metadata
});

// Response structure
interface TextExtractionResult {
  success: boolean;
  text: string;
  extractedFields: ExtractedField[];
  textractResponse: any; // Raw AWS response
  boundingBoxes: BoundingBox[]; // For redaction
}
```

**Fallback Strategy**:
1. AWS Textract with FORMS + TABLES
2. AWS Textract with simple text detection
3. Direct PDF parsing with `pdf-parse`
4. Development mock data

#### 2.2 AWS Comprehend Classification
**API Endpoint**: `/api/docs-2-analyse/classify-comprehend`

**AWS Services**:
- **Amazon Comprehend**:
  - `DetectDominantLanguage`
  - `DetectEntities`
  - `DetectSentiment`
  - `ClassifyDocument` (custom endpoint)

**Implementation**:
```typescript
// Text processing limits
const MAX_TEXT_LENGTH = 4800; // Below 5000 limit for safety

// Entity grouping and confidence calculation
const groupedEntities = entities.reduce((acc, entity) => {
  const type = entity.Type;
  if (!acc[type]) acc[type] = [];
  acc[type].push(entity);
  return acc;
}, {});
```

#### 2.3 OpenAI GPT-4o Classification
**API Endpoint**: `/api/docs-2-analyse/classify-llm`

**LLM Configuration**:
- **Model**: `gpt-4o`
- **Temperature**: 0.2 (deterministic)
- **Response Format**: Structured JSON
- **Text Limit**: 8000 characters

**Implementation**:
```typescript
// OpenAI API call
const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  temperature: 0.2,
  response_format: { type: "json_object" },
  messages: [
    {
      role: "system",
      content: systemPrompt // Fetched from DynamoDB
    },
    {
      role: "user", 
      content: `Document Types: ${availableTypes}\n\nDocument Text: ${truncatedText}`
    }
  ]
});
```

#### 2.4 Specialized Detection Services

**TFN Detection**:
- **API**: `/api/docs-2-analyse/scan-for-tfn`
- **LLM**: GPT-4o with configurable prompts
- **Storage**: Prompts stored in DynamoDB by category

**Credit Card Detection**:
- **API**: `/api/docs-2-analyse/detect-credit-card`
- **Method**: Textract + Regex pattern matching
- **Patterns**: Luhn algorithm validation

## Stage 3: Process (`DocumentControl.tsx`)

### Field Matching and Data Extraction

#### 3.1 Document Configuration Loading
```typescript
// Fetch document-specific elements from DynamoDB
const loadDocumentElements = async (documentTypeId: string, subTypeId?: string) => {
  const response = await fetch(`/api/update-config/document-types/${documentTypeId}/elements`);
  const elements = await response.json();
  
  // Filter by subtype if specified
  return subTypeId 
    ? elements.filter(el => el.subTypeId === subTypeId)
    : elements.filter(el => !el.subTypeId);
};
```

#### 3.2 Auto-Matching Algorithm
```typescript
// Field matching with fuzzy string matching
const autoMatchFields = (extractedFields: ExtractedField[], elements: DataElementConfig[]) => {
  return extractedFields.map(field => {
    const bestMatch = elements.reduce((best, element) => {
      const similarity = calculateSimilarity(field.label, element.name);
      return similarity > best.score ? { element, score: similarity } : best;
    }, { element: null, score: 0 });
    
    return bestMatch.score >= 0.5 ? bestMatch.element : null;
  });
};

// String normalization for matching
const normalizeString = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\b(no|num|number)\b/g, 'number') // Expand abbreviations
    .trim();
};
```

#### 3.3 Manual Field Mapping
- **UI**: Drag-and-drop interface using `@dnd-kit/core`
- **Visual**: Side-by-side field and element lists
- **Validation**: Real-time matching status indicators

#### 3.4 Redaction Management
```typescript
// Redaction logic
const getRedactionElements = (mappings: FieldMapping[]) => {
  return mappings
    .filter(mapping => 
      mapping.element?.action?.includes('redact') || 
      mapping.manuallySelected
    )
    .map(mapping => ({
      fieldId: mapping.field.id,
      elementId: mapping.element.id,
      boundingBoxes: mapping.field.valueWordBlocks?.map(wb => wb.boundingBox) || []
    }));
};
```

## Stage 4: Finalize

### Document Output and Storage
- **Redaction**: Precise bounding box-based content removal
- **Format**: Original format preservation
- **Storage**: Configurable retention policies
- **Audit**: Complete processing history

## API Endpoints Reference

### Core Processing APIs
| Endpoint | Purpose | AWS Services | LLM Usage |
|----------|---------|--------------|-----------|
| `/api/docs-2-analyse/analyse-document` | Text extraction | Textract | None |
| `/api/docs-2-analyse/classify-comprehend` | AWS classification | Comprehend | None |
| `/api/docs-2-analyse/classify-llm` | LLM classification | S3 (storage) | GPT-4o |
| `/api/docs-2-analyse/scan-for-tfn` | TFN detection | None | GPT-4o |
| `/api/docs-2-analyse/detect-credit-card` | Credit card detection | Textract | None |
| `/api/docs-3-process/document-elements` | Field matching | DynamoDB | None |

### Configuration APIs
| Endpoint | Purpose | Data Source |
|----------|---------|-------------|
| `/api/update-config/document-types` | Document type config | DynamoDB |
| `/api/update-config/prompt-categories` | LLM prompts | DynamoDB |
| `/api/update-config/retention-policies` | Storage policies | DynamoDB |

## AWS Service Dependencies

### Amazon Textract
```typescript
// SDK Configuration
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';

const textractClient = new TextractClient({
  region: process.env.APP_REGION,
  credentials: {
    accessKeyId: process.env.APP_ACCESS_KEY_ID,
    secretAccessKey: process.env.APP_SECRET_ACCESS_KEY,
  },
});

// Feature flags
const features = ['FORMS', 'TABLES'];
```

### Amazon Comprehend
```typescript
// Multi-service integration
import { 
  ComprehendClient,
  DetectDominantLanguageCommand,
  DetectEntitiesCommand,
  DetectSentimentCommand,
  ClassifyDocumentCommand
} from '@aws-sdk/client-comprehend';
```

### Amazon S3
```typescript
// Temporary file storage
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Upload for processing
const uploadParams = {
  Bucket: process.env.S3_BUCKET,
  Key: `temp/${fileId}`,
  Body: fileBuffer,
  ContentType: file.type,
  Metadata: {
    documentType: 'unknown',
    processingMethod: 'api'
  }
};
```

### Amazon DynamoDB
```typescript
// Configuration storage
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

// Table structure
const TABLES = {
  CONFIG: 'horizon-config',
  RETENTION: 'horizon-retention-policies', 
  STORAGE: 'horizon-storage-solutions'
};
```

## LLM Integration Details

### OpenAI GPT-4o Usage

#### Document Classification
```typescript
// System prompt structure
const systemPrompt = `You are a document classification expert...
Available document types: ${JSON.stringify(documentTypes)}
Respond with valid JSON containing: type, subType, confidence, reasoning`;

// API Configuration
const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  temperature: 0.2, // Low temperature for consistency
  max_tokens: 500,
  response_format: { type: "json_object" }
});
```

#### TFN Detection
```typescript
// Configurable prompts from DynamoDB
const promptConfig = await getPromptByCategory('tfn-detection');
const userPrompt = promptConfig.content.replace('{document_text}', documentText);
```

### Prompt Management
- **Storage**: DynamoDB with versioning
- **Categories**: System, user, assistant prompts
- **Fallbacks**: Hard-coded defaults for critical functions
- **Template Variables**: `{document_text}`, `{document_types}`, `{field_names}`

## Error Handling Strategies

### Service Failure Handling
```typescript
// Cascading fallbacks
try {
  return await textractExtraction(file);
} catch (textractError) {
  console.warn('Textract failed, trying PDF parse:', textractError);
  try {
    return await pdfParseExtraction(file);
  } catch (pdfError) {
    console.error('All extraction methods failed');
    return { success: false, error: 'Unable to extract text' };
  }
}
```

### AWS Permission Errors
```typescript
// Detailed IAM guidance
if (error.code === 'AccessDenied') {
  return {
    error: 'AWS permission denied',
    iamRequirements: [
      'textract:AnalyzeDocument',
      's3:PutObject', 
      's3:GetObject',
      'comprehend:DetectEntities'
    ]
  };
}
```

## Performance Optimizations

### Parallel Processing
```typescript
// Concurrent API calls
const [textResult, awsClassification, gptClassification] = await Promise.allSettled([
  extractText(file),
  classifyWithAWS(file),
  classifyWithGPT(file)
]);
```

### Memory Management
```typescript
// Cleanup resources
useEffect(() => {
  return () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
  };
}, [fileUrl]);
```

## Security Considerations

### Data Protection
- **Temporary Storage**: S3 objects deleted after processing
- **Redaction**: Precise coordinate-based content removal
- **Audit Trail**: All processing steps logged

### Environment Variables
```env
# Required AWS configuration
APP_REGION=us-east-1
APP_ACCESS_KEY_ID=your-access-key
APP_SECRET_ACCESS_KEY=your-secret-key

# OpenAI configuration  
OPENAI_API_KEY=your-openai-key

# DynamoDB tables
DYNAMODB_CONFIG_TABLE=horizon-config
DYNAMODB_RETENTION_POLICY_TABLE=horizon-retention-policies
DYNAMODB_STORAGE_SOLUTIONS_TABLE=horizon-storage-solutions
```

## Development and Testing

### Mock Data Support
```typescript
// Development fallbacks
if (process.env.NODE_ENV === 'development') {
  return {
    success: true,
    text: 'Mock extracted text for development',
    mock: true
  };
}
```

### Error Simulation
- Network timeout handling
- AWS service unavailability
- Invalid file format processing
- LLM API failures

This technical documentation provides a comprehensive view of the document processing flow, enabling developers to understand, maintain, and extend the system effectively.


## Package Dependencies Analysis

### Core AWS Services Dependencies
These packages enable the document processing pipeline's integration with AWS services:

| Package | Version | Purpose in Processing Flow |
|---------|---------|----------------------------|
| `@aws-sdk/client-textract` | ^3.758.0 | **Primary text extraction** - Extracts text, forms, tables from documents with bounding boxes |
| `@aws-sdk/client-comprehend` | ^3.758.0 | **Document classification** - Language detection, entity recognition, sentiment analysis |
| `@aws-sdk/client-s3` | ^3.758.0 | **File storage** - Temporary document storage during processing, cleanup after analysis |
| `@aws-sdk/client-dynamodb` | ^3.758.0 | **Configuration storage** - Document types, prompts, retention policies |
| `@aws-sdk/lib-dynamodb` | ^3.758.0 | **DynamoDB document client** - Higher-level DynamoDB operations with automatic marshalling |
| `aws-sdk` | ^2.1692.0 | **Legacy AWS SDK** - Fallback for services not yet migrated to v3 |

### LLM and AI Integration
| Package | Version | Purpose in Processing Flow |
|---------|---------|----------------------------|
| `openai` | ^4.86.2 | **GPT-4o integration** - Document classification with reasoning, TFN detection, content analysis |

### PDF Processing Dependencies
| Package | Version | Purpose in Processing Flow |
|---------|---------|----------------------------|
| `pdf-lib` | ^1.17.1 | **PDF manipulation** - Document redaction, annotation, metadata modification |
| `pdf-parse` | ^1.1.1 | **Fallback text extraction** - Direct PDF parsing when Textract fails |

### Frontend Framework and Core
| Package | Version | Purpose in Processing Flow |
|---------|---------|----------------------------|
| `next` | ^15.1.5 | **Core framework** - API routes for processing endpoints, SSR for document viewer |
| `react` | ^19.0.0-rc.1 | **UI framework** - Document processing interface components |
| `react-dom` | ^19.0.0-rc.1 | **DOM rendering** - Client-side document viewer and form interactions |
| `typescript` | ^4.9.4 | **Type safety** - Ensures type safety across complex document processing types |

### UI Components and Interaction
| Package | Version | Purpose in Processing Flow |
|---------|---------|----------------------------|
| `@dnd-kit/core` | ^6.3.1 | **Drag & drop** - Field-to-element mapping interface in Process stage |
| `@dnd-kit/sortable` | ^7.0.2 | **Sortable lists** - Reordering document elements and fields |
| `@dnd-kit/utilities` | ^3.2.2 | **DnD utilities** - Helper functions for drag-and-drop operations |
| `react-dropzone` | ^14.2.3 | **File upload** - Document upload interface with validation |
| `react-hook-form` | ^7.54.2 | **Form management** - Document processing configuration forms |
| `@hookform/resolvers` | ^4.1.3 | **Form validation** - Zod schema validation for processing parameters |

### Chakra UI Components (Document Processing UI)
| Package | Version | Purpose in Processing Flow |
|---------|---------|----------------------------|
| `@chakra-ui/react` | ^3.12.0 | **Core UI library** - Base components for document processing interface |
| `@chakra-ui/modal` | ^2.2.9 | **Modal dialogs** - Document classification results, error dialogs |
| `@chakra-ui/accordion` | ^2.1.4 | **Collapsible sections** - Document analysis results display |
| `@chakra-ui/tooltip` | ^2.2.6 | **Tooltips** - Field descriptions and processing status indicators |
| `@chakra-ui/icons` | ^2.0.19 | **UI icons** - Processing status icons, document type indicators |

### State Management and Data
| Package | Version | Purpose in Processing Flow |
|---------|---------|----------------------------|
| `zustand` | ^5.0.3 | **Global state** - Document processing state, configuration cache |
| `zod` | ^3.24.2 | **Schema validation** - API request/response validation, form data validation |

### Utility Libraries
| Package | Version | Purpose in Processing Flow |
|---------|---------|----------------------------|
| `@paralleldrive/cuid2` | ^2.2.2 | **Unique IDs** - Document processing session IDs, field matching IDs |
| `uuid` | ^11.1.0 | **UUID generation** - Document identifiers, processing job IDs |
| `clsx` | ^2.1.1 | **Conditional classes** - Dynamic styling based on processing status |
| `tailwind-merge` | ^3.0.2 | **CSS class merging** - Resolving Tailwind class conflicts in components |

### Processing Flow Stage Mapping

#### Stage 1: Upload
- `react-dropzone` - File upload interface
- `zod` - File validation schemas
- `@paralleldrive/cuid2` - Session ID generation

#### Stage 2: Analysis  
- `@aws-sdk/client-textract` - Text extraction API calls
- `@aws-sdk/client-comprehend` - Classification API calls
- `@aws-sdk/client-s3` - Document storage for processing
- `openai` - GPT-4o classification requests
- `pdf-parse` - Fallback text extraction

#### Stage 3: Process
- `@dnd-kit/core` - Field matching drag-and-drop
- `@aws-sdk/client-dynamodb` - Document type configuration lookup
- `react-hook-form` - Processing options forms
- `zustand` - Processing state management

#### Stage 4: Finalize
- `pdf-lib` - Document redaction and output
- `@aws-sdk/client-s3` - Final document storage
- `uuid` - Output document identification

### Development and Testing Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@testing-library/react` | ^13.3.0 | Component testing for document processing UI |
| `@testing-library/user-event` | ^13.5.0 | User interaction testing for workflows |
| `@types/node` | ^12.20.55 | Node.js type definitions for API routes |
| `ts-node` | ^10.9.2 | TypeScript execution for database setup scripts |

### Critical Dependencies for Processing Flow
The following dependencies are **essential** for the document processing workflow to function:

1. **AWS SDK packages** - Core processing capabilities
2. **openai** - LLM-based classification and analysis  
3. **pdf-lib + pdf-parse** - PDF processing and fallback
4. **react-dropzone** - Document upload interface
5. **@dnd-kit/core** - Field matching interface
6. **zustand** - Processing state management
7. **zod** - Data validation throughout pipeline

### Dependency Upgrade Considerations
- **AWS SDK v3**: All AWS services use latest v3 SDK for better performance
- **React 19 RC**: Uses bleeding-edge React features for concurrent processing
- **Next.js 15**: Latest App Router for optimized API routes
- **OpenAI v4**: Latest API client with structured output support
