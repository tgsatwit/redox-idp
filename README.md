# Horizon Document Management System

Horizon is a powerful document management system that provides advanced storage solutions and retention policy capabilities.

## DynamoDB Tables Setup

The application uses three separate DynamoDB tables:

1. **Config Table**: Stores general application configuration
2. **Retention Policies Table**: Stores multi-stage retention policies
3. **Storage Solutions Table**: Stores available storage solutions with different access levels

### Setting Up the Tables

You can set up all required DynamoDB tables using the provided setup script:

```bash
# Install dependencies first
npm install

# Set up DynamoDB tables with default data
node scripts/setup-dynamodb-tables.js
```

Alternatively, you can run the script with environment variables to customize the table names:

```bash
DYNAMODB_CONFIG_TABLE=custom-config-table \
DYNAMODB_RETENTION_POLICY_TABLE=custom-retention-table \
DYNAMODB_STORAGE_SOLUTIONS_TABLE=custom-storage-table \
node scripts/setup-dynamodb-tables.js
```

### Default Storage Solutions

The setup script will create the following default storage solutions:

1. **High-Performance Storage**: For frequently accessed documents
2. **Standard Storage**: For documents accessed occasionally
3. **Archive Storage**: For long-term document retention

## Environment Variables

Configure the following environment variables in your `.env` file:

```
# AWS Configuration
APP_REGION=us-east-1
APP_ACCESS_KEY_ID=your-access-key
APP_SECRET_ACCESS_KEY=your-secret-key

# DynamoDB Table Names
DYNAMODB_CONFIG_TABLE=horizon-config
DYNAMODB_RETENTION_POLICY_TABLE=horizon-retention-policies
DYNAMODB_STORAGE_SOLUTIONS_TABLE=horizon-storage-solutions
```

## API Endpoints

### Storage Solutions API

- **GET** `/api/update-config/storage-solutions`: Get all storage solutions
- **POST** `/api/update-config/storage-solutions`: Create a new storage solution
- **PUT** `/api/update-config/storage-solutions`: Update an existing storage solution
- **DELETE** `/api/update-config/storage-solutions`: Delete a storage solution

### Retention Policies API

- **GET** `/api/update-config/retention-policies`: Get all retention policies
- **POST** `/api/update-config/retention-policies`: Create a new retention policy
- **PUT** `/api/update-config/retention-policies`: Update an existing retention policy
- **DELETE** `/api/update-config/retention-policies`: Delete a retention policy

## Multi-Stage Retention Policies

The system supports configuring multi-stage retention policies with different storage solutions for each stage:

1. Create various storage solutions with different access levels (hot, warm, cold)
2. Create retention policies with multiple stages
3. Each stage defines:
   - A storage solution to use
   - A duration for storing documents in that solution
4. Documents automatically move through stages of a retention policy

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. 