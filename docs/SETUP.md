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

npm-workspaces monorepo. Dependency direction: `apps → application → domain/infrastructure → shared`.

```
LoanRiskLens_MCP/
├── package.json                 # npm workspaces root (7 workspaces)
├── .env / .env.example          # DATABASE_URL, JWT_SECRET, MCP_SECRET, ports
├── docs/                        # Documentation (7 guides)
├── apps/
│   ├── api/                     # Express REST API (port 3000)
│   │   ├── src/
│   │   │   ├── controllers/     # Route handlers (credit, user, transaction, savings)
│   │   │   ├── middleware/      # auth.js (JWT + RBAC), security.js, errorHandler.js
│   │   │   ├── routes/          # Express routers
│   │   │   └── index.js         # App bootstrap + middleware chain
│   │   └── tests/               # API tests (Jest)
│   └── mcp-server/              # MCP JSON-RPC 2.0 server (port 3001)
│       ├── src/
│       │   ├── auth/            # sharedSecretAuth.js (X-MCP-Secret check)
│       │   ├── server/          # mcpServer.js — JSON-RPC router
│       │   ├── tools/           # creditTools.js — 3 MCP tools + formatters
│       │   └── index.js         # Server bootstrap
│       └── tests/               # MCP server tests
└── packages/
    ├── application/             # @loan-risk-lens/application — use-case services
    │   ├── src/services/        # creditService, transactionService, savingsService
    │   └── tests/
    ├── domain/                  # @loan-risk-lens/domain — pure scoring, no DB calls
    │   ├── src/
    │   │   ├── scoring/         # Component scores + weighted overall + credit score
    │   │   └── analysis/        # Savings profiles, risk classification, behavior
    │   └── tests/               # Includes 5 business-scenario personas
    ├── infrastructure/          # @loan-risk-lens/infrastructure — SQL only
    │   └── src/repositories/    # user, transaction, savings, report repositories
    ├── shared/                  # shared — cross-cutting utilities
    │   ├── src/
    │   │   ├── config/          # ⭐ single source for scoring weights/thresholds
    │   │   ├── database/        # pg pool + initializeSchema()
    │   │   └── utils/           # logger (winston), helpers, validator (Joi)
    │   └── tests/
    └── workflows/               # @loan-risk-lens/workflows — DEMO only
        ├── src/
        │   ├── agents/          # 6 agents (transaction, savings, behavior,
        │   │                    #  risk, decision, explanation)
        │   └── workflows/       # creditIntelligenceWorkflow.js
        ├── tests/               # Pinned 5-scenario workflow tests
        └── README.md            # Why this package is NOT wired at runtime
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
