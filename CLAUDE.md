# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Redox Demo** - a Next.js 15 document processing system that uses AI to classify, extract, and process various document types. The application provides a complete workflow for intelligent document management with AWS services integration and OpenAI-powered analysis.

## Technology Stack

- **Frontend**: Next.js 15, React 19 RC, TypeScript
- **Styling**: Tailwind CSS, Chakra UI
- **State Management**: Zustand
- **Database**: DynamoDB (with local storage fallback)
- **Storage**: AWS S3
- **AI/ML**: AWS Textract, AWS Comprehend, OpenAI GPT-4
- **PDF Processing**: pdf-lib, pdf-parse
- **Form Management**: React Hook Form with Zod validation

## Common Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Development server (localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Export static site
npm run export
```

### Database Setup
```bash
# Set up all DynamoDB tables with default data
node scripts/setup-dynamodb-tables.js

# Set up workflow tables
npm run setup-workflow-tables

# Force rebuild workflow tables
npm run setup-workflow-tables:force

# Initialize workflow tasks
npm run init-workflow-tasks
```

### TypeScript
```bash
# Run TypeScript compiler
npx tsc

# Run TypeScript in watch mode
npx tsc --watch
```

## Application Architecture

### Document Processing Pipeline

The application follows a 4-phase document processing workflow:

1. **Upload & Preprocessing** (`/api/docs-1-preprocess/`)
2. **Analysis & Classification** (`/api/docs-2-analyse/`)
   - Text extraction using AWS Textract
   - Document classification via AWS Comprehend + OpenAI GPT-4
   - Specialized detection (credit cards, TFNs, IDs)
3. **Processing & Extraction** (`/api/docs-3-process/`)
   - Data element extraction based on configuration
   - Field mapping and validation
4. **Finalization** (`/api/docs-4-finalise/`)
   - Retention policy application
   - Storage solution assignment

### Key Components

- **Document Processor** (`src/components/document-processor/`): Core processing UI
- **Configuration Manager** (`src/components/admin/config/`): System configuration
- **Document Viewer** (`src/components/document-viewer.tsx`): PDF viewing with annotations
- **Config Store** (`src/lib/config-store.ts`): Zustand-based configuration state
- **Document Processing** (`src/lib/document-processing.ts`): Core processing logic

### API Structure

APIs are organized by processing phase:
- `/api/docs-2-analyse/` - Classification and analysis endpoints
- `/api/update-config/` - Configuration management endpoints
- `/api/train-models/` - Model training endpoints

### Database Schema

The application uses multiple DynamoDB tables:
- Document types and sub-types configuration
- Data elements and extraction rules
- Retention policies and storage solutions
- Training datasets and model configurations
- Workflow tasks and configurations

## Environment Variables

Required environment variables (create `.env.local`):

```env
# AWS Configuration
APP_REGION=us-east-1
APP_ACCESS_KEY_ID=your-access-key
APP_SECRET_ACCESS_KEY=your-secret-key

# DynamoDB Table Names
DYNAMODB_CONFIG_TABLE=horizon-config
DYNAMODB_RETENTION_POLICY_TABLE=horizon-retention-policies
DYNAMODB_STORAGE_SOLUTIONS_TABLE=horizon-storage-solutions

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

## Code Organization

### Frontend Structure
- `src/app/` - Next.js 15 app router pages
- `src/components/` - React components organized by feature
- `src/lib/` - Utility functions and core logic
- `src/types/` - TypeScript type definitions

### Key Files
- `src/lib/types.ts` - Core type definitions for the application
- `src/routes.tsx` - Navigation route definitions
- `src/lib/config-store.ts` - Configuration state management
- `src/lib/document-processing.ts` - Core document processing logic

### Component Architecture
- Admin dashboard with collapsible sidebar navigation
- Document processing workflow with stepper interface
- Configuration management with modal dialogs
- Real-time document viewer with annotation support

## Development Workflow

### Adding New Document Types
1. Use the Document Types configuration page (`/admin/config/documents`)
2. Define data elements and extraction rules
3. Configure sub-types if needed
4. Set up training datasets for custom models

### Modifying Processing Logic
- Core processing: `src/lib/document-processing.ts`
- API endpoints: `src/app/api/docs-*-*/` directories
- Component logic: `src/components/document-processor/`

### Working with Configuration
- Configuration state: `src/lib/config-store.ts`
- DynamoDB service: `src/lib/services/dynamodb-config-service.ts`
- UI components: `src/components/admin/config/`

## Testing

The project includes Testing Library setup but currently has no custom test files. When adding tests:

```bash
# Run tests (once tests are added)
npm test

# Run tests in watch mode
npm run test:watch
```

## Key Patterns

### State Management
- Use Zustand for global state (configuration, processing state)
- React Hook Form for form state management
- Local storage fallback for configuration persistence

### API Patterns
- Next.js API routes with proper error handling
- AWS SDK v3 integration patterns
- OpenAI API integration with fallback strategies

### TypeScript Usage
- Comprehensive type definitions in `src/lib/types.ts`
- Strict typing for document processing workflows
- Interface definitions for all configuration objects

## Common Tasks

### Adding New Data Elements
1. Define in `DataElementConfig` interface
2. Add to document type configuration
3. Update extraction logic in processing pipeline
4. Configure UI components for element management

### Modifying Document Classification
1. Update classification logic in `/api/docs-2-analyse/classify-*` endpoints
2. Configure prompt templates for OpenAI classification
3. Update confidence thresholds and fallback logic

### Adding New Storage Solutions
1. Configure via Retention Policies admin page
2. Define storage characteristics (access level, cost)
3. Update retention policy workflows