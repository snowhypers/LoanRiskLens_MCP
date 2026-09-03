# 🏦 LoanRiskLens — Alternative Credit Intelligence Platform

> **Can we safely lend money to this customer?**

LoanRiskLens is a production-grade **Alternative Credit Intelligence** platform for fintech underwriting. It evaluates behavioral financial data to make explainable lending decisions — without requiring CIBIL scores, salary slips, ITR, or formal employment history.

[![API Health](https://img.shields.io/badge/API-Live-brightgreen)](https://altcredit-apis.onrender.com/api/health)
[![MCP Health](https://img.shields.io/badge/MCP-Live-brightgreen)](https://altcredit-mcp.onrender.com/health)
[![Protocol](https://img.shields.io/badge/Protocol-MCP%20JSON--RPC%202.0-blue)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)

---

## 📋 Table of Contents

- [Business Context](#business-context)
- [System Architecture](#system-architecture)
- [Credit Scoring Pipeline](#credit-scoring-pipeline)
- [Database Schema](#database-schema)
- [Deployment Architecture](#deployment-architecture)
- [MCP Client Setup](#mcp-client-setup)
- [API Reference](#api-reference)
- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)

---

## Business Context
Business Problem

The Problem

Millions of self-employed and non-salaried people—including kirana shop owners, delivery partners, taxi drivers, freelancers, street vendors, and small merchants—are rejected for loans because they lack traditional credit indicators such as salary slips, formal employment records, or a CIBIL history.

As a result:

Good borrowers are rejected despite healthy financial habits.
Loan officers spend significant time manually reviewing applications.
Fintech companies struggle to distinguish trustworthy borrowers from risky ones.
Credit decisions are often inconsistent and difficult to explain.

Traditional underwriting relies on historical credit records instead of actual financial behavior, leaving a large underserved population without fair access to credit.


#Solution

Fintech companies serving **self-employed and informal-income customers** need to underwrite users who lack:
- Traditional CIBIL/credit scores
- Salary slips or formal ITR
- Long credit history

LoanRiskLens analyzes **behavioral financial signals** instead:

| Signal | What it measures |
|--------|-----------------|
| Transaction consistency | Regularity of income deposits |
| Savings discipline | Deposit vs withdrawal ratio |
| Cash-flow stability | Monthly inflow/outflow balance |
| Failed transaction rate | Payment reliability |
| Withdrawal behavior | Large/frequent cash-out patterns |
| Liquidity buffer | Emergency fund availability |

**Output:** `APPROVED` / `REVIEW` / `REJECTED` with recommended loan amount and human-readable explanation.

---

The MCP Server exposes this intelligence through standardized MCP tools, allowing AI assistants such as Claude Desktop, Cursor, and internal fintech applications to perform explainable credit analysis.

---


## System Architecture

```mermaid
flowchart TB

subgraph USERS["End Users / Clients"]
direction TB
U1["Claude Desktop"]
U2["Cursor IDE"]
U3["Loan Officer UI"]
U4["Founder Dashboard"]
end

subgraph CLIENT["MCP Client"]
direction TB
Q["Natural Language Request"]
end

subgraph SERVER["Alternative Credit Intelligence MCP Server"]
direction TB
T1["Analyze Creditworthiness"]
T2["Analyze Financial Behavior"]
T3["Generate Underwriting Report"]
end

subgraph GRAPH["LangGraph Multi-Agent Workflow"]

direction TB

Loader["User Context Loader"]

Transaction["Transaction Agent"]

Savings["Savings Agent"]

Behavior["Behavior Agent"]

Risk["Risk Agent"]

Decision["Credit Decision Agent"]

Explanation["Explanation Agent"]

Loader --> Transaction
Loader --> Savings

Transaction --> Behavior
Savings --> Behavior

Behavior --> Risk

Risk --> Decision

Decision --> Explanation

end

subgraph API["Express Backend"]

direction TB

Controllers["Controllers"]

Services["Services"]

Repositories["Repositories"]

end

subgraph DATABASE["PostgreSQL"]

direction TB

Users["users"]

Transactions["transactions"]

SavingsTable["savings_history"]

Reports["underwriting_reports"]

Audit["audit_logs"]

end

USERS --> CLIENT

CLIENT --> SERVER

SERVER --> GRAPH

GRAPH --> API

API --> DATABASE

DATABASE --> SERVER
```

## Credit Scoring Pipeline

```mermaid
flowchart LR
    IN(["User ID"]) --> UA["assertUserExists()"]

    UA -->|found| TA["TransactionService\nLast 6 months data"]
    UA -->|not found| ERR(["isError: true\nUser not found"])

    TA --> TX["Transaction Summary\ntotalTransactions\nfailedTransactions\nmonthlyInflow/Outflow\nincomeConsistencyScore"]

    IN --> SA["SavingsService\nAll history"]
    SA --> SV["Savings Summary\ntotalDeposits/Withdrawals\ncurrentBalance\ndepositCount"]

    TX --> S1["Transaction\nConsistency Score\nx 0.35"]
    SV --> S2["Savings\nDiscipline Score\nx 0.40"]
    TX --> S3["Cashflow\nStability Score\nx 0.25"]

    S1 --> WA["Weighted\nOverall Score\n0 to 100"]
    S2 --> WA
    S3 --> WA

    WA --> CS["Credit Score\nplus/minus adjustments\nfor bonuses/penalties"]

    CS --> RISK["Risk Level\n70+ = LOW\n40-69 = MEDIUM\nbelow 40 = HIGH"]

    RISK --> DEC["Decision\nLOW+60 = APPROVED\nMEDIUM+40 = REVIEW\nelse = REJECTED"]

    DEC --> AMT["Recommended Amount\nLOW x 0.7\nMEDIUM x 0.5\nHIGH x 0.2"]

    DEC --> OUT(["Underwriting Report\nSaved to DB"])
    RISK --> OUT
    AMT --> OUT
```

### Scoring Formula

```
Credit Score = (Transaction Consistency × 0.35)
             + (Savings Discipline     × 0.40)
             + (Cashflow Stability     × 0.25)
```

### Risk & Decision Table

| Score | Risk Level | Decision | Max Loan |
|-------|-----------|----------|----------|
| ≥ 70  | `LOW`     | **APPROVED** | Up to ₹2,00,000 |
| 40–69 | `MEDIUM`  | **REVIEW**   | Up to ₹75,000  |
| < 40  | `HIGH`    | **REJECTED** | Not applicable |

---

## Database Schema

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR name
        VARCHAR phone UK
        VARCHAR occupation
        VARCHAR employer_name
        DECIMAL monthly_income
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    transactions {
        UUID id PK
        UUID user_id FK
        DECIMAL amount
        VARCHAR type
        VARCHAR status
        VARCHAR category
        TEXT description
        TIMESTAMP timestamp
    }

    savings_history {
        UUID id PK
        UUID user_id FK
        DECIMAL deposit_amount
        DECIMAL withdrawal_amount
        DECIMAL balance
        TIMESTAMP created_at
    }

    underwriting_reports {
        UUID id PK
        UUID user_id FK
        INTEGER credit_score
        VARCHAR risk_level
        DECIMAL recommended_amount
        VARCHAR recommendation
        TEXT explanation
        JSONB details
        TIMESTAMP created_at
    }

    audit_logs {
        UUID id PK
        UUID user_id FK
        VARCHAR action
        VARCHAR resource
        JSONB details
        VARCHAR ip_address
        TIMESTAMP created_at
    }

    users ||--o{ transactions : "has"
    users ||--o{ savings_history : "has"
    users ||--o{ underwriting_reports : "has"
    users ||--o{ audit_logs : "has"
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph DEV["Local Development"]
        CODE["Source Code"]
        DATA["Imported synthetic data\nor approved production data"]
    end

    subgraph GH["GitHub"]
        REPO["Ppp111ppp111/LoanRiskLens_MCP\nbranch: main"]
    end

    subgraph RENDER["Render.com"]
        SVC1["altcredit-apis\nNode.js · PORT 3000\nnpm run dev"]
        SVC2["altcredit-mcp\nNode.js · PORT 3001\nnpm run dev:mcp"]
    end

    subgraph SUPABASE["Supabase"]
        PG["PostgreSQL\naws-ap-southeast-1\nConnection Pooling"]
    end

    CODE -- "git push" --> REPO
    REPO -- "Auto Deploy" --> SVC1
    REPO -- "Auto Deploy" --> SVC2
    SVC1 -- "DATABASE_URL" --> PG
    SVC2 -- "DATABASE_URL" --> PG
    CSV --> SEED
    SEED -- "upsert" --> PG
```

---

## MCP Client Setup

Add to your MCP client config — works with **Claude Desktop**, **Cursor**, and any MCP-compatible client:

```json
{
  "mcpServers": {
    "LoanRiskLens": {
      "url": "https://altcredit-mcp.onrender.com/mcp"
    }
  }
}
```

| Client | Config File (macOS) |
|--------|---------------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp.json` |

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `analyze_creditworthiness` | Credit score, risk level, loan amount, decision |
| `analyze_financial_behavior` | Behavior profile, savings score, cashflow, withdrawal pattern |
| `generate_underwriting_report` | Full report — all of the above + score breakdown, saved to DB |

### Example Prompts for Claude

```
Analyze the creditworthiness of user 550e8400-e29b-41d4-a716-446655440001

Generate a full underwriting report for user ID 550e8400-e29b-41d4-a716-446655440001

Check the financial behavior profile of user 85919b78-ec7d-4d17-8e67-6a02ebfca84a
```

> **Note:** Render free tier may take 30–60 seconds on first request after inactivity (cold start).

---

## API Reference

### Credit Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/credit/analyze/:userId` | Run creditworthiness analysis |
| `GET` | `/api/credit/behavior/:userId` | Get financial behavior profile |
| `POST` | `/api/credit/report/:userId` | Generate & save underwriting report |

### Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | API health check |
| `GET` | `/api/users/:id` | Get user profile |
| `GET` | `/api/transactions/:userId` | List user transactions |
| `GET` | `/api/savings/:userId` | List savings history |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Ppp111ppp111/LoanRiskLens_MCP.git
cd LoanRiskLens_MCP
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DB_HOST, DB_NAME, DB_USER, DB_PASSWORD

# 3. Import your synthetic or approved data into PostgreSQL/Supabase.
# Schema creation runs automatically when the API or MCP server starts.

# 4. Start API server (port 3000)
npm run dev

# 5. Start MCP server (port 3001, separate terminal)
npm run dev:mcp

# 6. Run tests
npm test
```

### Project Structure

```
LoanRiskLens_MCP/
├── apps/
│   └── api/                    # Express REST API (port 3000)
│       ├── src/controllers/    # Route handlers
│       ├── src/services/       # Business logic (creditService, etc.)
│       ├── src/repositories/   # DB access layer
│       └── src/middleware/     # Auth, security, error handling
├── packages/
│   └── mcp-server/             # HTTP JSON-RPC MCP Server (port 3001)
│       ├── src/server/         # mcpServer.js — JSON-RPC router
│       └── src/tools/          # creditTools.js — tool definitions
├── credit-engine/              # Pure scoring & analysis logic
│   ├── src/scoring/            # Score calculators
│   └── src/analysis/           # Risk classifier, profile analyzer
├── langgraph-workflows/        # 6-agent sequential workflow
│   ├── src/agents/             # Individual agent classes
│   └── src/workflows/          # CreditIntelligenceWorkflow
├── shared/                     # Common modules
│   ├── src/config/             # App configuration
│   ├── src/database/           # pg Pool + schema init
│   └── src/utils/              # helpers, logger, validator
└── docs/                       # Documentation
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| API Framework | Express.js |
| Protocol | MCP (Model Context Protocol) — HTTP JSON-RPC 2.0 |
| Agent Workflow | LangGraph-style 6-agent pipeline |
| Database | PostgreSQL (Supabase hosted) |
| Authentication | JWT + RBAC |
| Validation | Joi |
| Logging | Winston |
| Testing | Jest |
| Deployment | Render.com (auto-deploy from GitHub) |

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Agent Context Guide](docs/AGENT_CONTEXT.md) | Business context, demo questions, expected results |
| [Setup Guide](docs/SETUP.md) | Local development setup |
| [Architecture](docs/ARCHITECTURE.md) | Detailed technical architecture |
| [LangGraph Workflows](docs/LANGGRAPH.md) | Agent pipeline details |
| [MCP Integration](docs/MCP_INTEGRATION.md) | MCP server integration guide |
| [API Documentation](docs/API.md) | Full API reference |
## License

MIT © 2024 LoanRiskLens

