# AltCredit Intelligence Platform

## Setup Guide

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL (local) OR Supabase (cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd /Users/pradipmacair1/newprojects2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   **Option A: Local PostgreSQL:**
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=altcredit_db
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT
   JWT_SECRET=your-super-secret-key

   # Server
   PORT=3000
   MCP_PORT=3001
   NODE_ENV=development
   ```

   **Option B: Supabase:**
   ```env
   # Database (use connection string or individual params)
   DB_HOST=db.your-project.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your-supabase-password

   # JWT
   JWT_SECRET=your-super-secret-key

   # Server
   PORT=3000
   MCP_PORT=3001
   NODE_ENV=development
   ```

4. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE altcredit_db;
   ```

5. **Load data into PostgreSQL/Supabase**

   Import approved synthetic or production records using your database import
   workflow. The API and MCP server create the schema automatically at startup,
   but this repository does not include CSV seed files.

6. **Start the API server**
   ```bash
   npm run dev
   ```

7. **Start the MCP server** (in a separate terminal)
   ```bash
   npm run dev:mcp
   ```

### Running Tests

```bash
npm test
```

### Project Structure

```
/apps
  /api                    # Express.js REST API
    /src
      /controllers        # Route controllers
      /services           # Business logic
      /repositories       # Database operations
      /middleware         # Auth, error handling, security
      /routes             # Express routers
      /validators         # Request validation schemas
      /utils              # Helper utilities
    /tests                # API tests
/packages
  /mcp-server            # MCP Server implementation
    /src
      /tools              # MCP tool definitions
      /server             # MCP server core
/langgraph-workflows     # LangGraph workflow agents
  /src
    /agents               # Analysis agents
    /workflows            # Workflow definitions
/credit-engine           # Credit scoring engine
  /src
    /scoring              # Scoring algorithms
    /analysis             # Analysis functions
/shared                  # Shared code across packages
  /src
    /config               # Configuration
    /database              # Database utilities
    /types                 # Type definitions
    /utils                 # Utility functions
/docs                    # Documentation
```

### API Endpoints

#### Health Check
- `GET /api/health` - Health check endpoint

#### Users
- `POST /api/users` - Create user (registration)
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user (admin)

#### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:userId` - Get user transactions
- `GET /api/transactions/:userId/analysis` - Get transaction analysis
- `GET /api/transactions/:userId/failed` - Get failed transactions

#### Savings
- `POST /api/savings` - Create savings record
- `GET /api/savings/:userId` - Get savings records
- `GET /api/savings/:userId/analysis` - Get savings analysis
- `GET /api/savings/:userId/balance` - Get current balance

#### Credit
- `POST /api/credit/creditworthiness` - Analyze creditworthiness
- `POST /api/credit/financial-behavior` - Analyze financial behavior
- `POST /api/credit/underwriting-report` - Generate underwriting report
- `GET /api/credit/:userId/score` - Get quick credit score

### MCP Tools

#### analyze_creditworthiness
```javascript
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### analyze_financial_behavior
```javascript
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### generate_underwriting_report
```javascript
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Credit Score Ranges

| Score Range | Risk Level | Recommendation |
|-------------|------------|----------------|
| ≥ 70 | LOW | APPROVED with standard terms |
| 40-69 | MEDIUM | REVIEW required |
| < 40 | HIGH | REJECTED or manual review |

### Scoring Weights

```
Overall Score =
  (Transaction Consistency × 0.35)
  + (Savings Discipline × 0.40)
  + (Cashflow Stability × 0.25)
```

### Support

For issues or questions, please contact the development team.
