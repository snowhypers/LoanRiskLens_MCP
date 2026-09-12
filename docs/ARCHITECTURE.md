# Architecture Documentation

## System Overview

The AltCredit Intelligence Platform is a production-grade Alternative Credit Intelligence MCP Server designed for fintech companies to analyze non-traditional credit users including self-employed workers, merchants, gig workers, and daily earners.

## Architecture Layers

### 1. Client Layer
- **AI Clients**: Claude Desktop, Cursor, VSCode AI agents
- **REST Clients**: Any HTTP client (cURL, Postman, etc.)

### 2. MCP Protocol Layer
The Model Context Protocol (MCP) enables AI clients to access credit intelligence tools through a standardized interface.

```
AI Client → MCP Server → Credit Tools
```

### 3. LangGraph Workflow Engine
Orchestrates multi-agent workflows for comprehensive credit analysis:

```
START
  ↓
Transaction Analysis Agent
  ↓
Savings Analysis Agent
  ↓
Behavior Scoring Agent
  ↓
Risk Classification Agent
  ↓
Credit Decision Agent
  ↓
Explanation Agent
  ↓
END
```

### 4. Credit Intelligence Services

| Service | Purpose |
|---------|---------|
| TransactionService | Analyzes transaction patterns |
| SavingsService | Analyzes savings behavior |
| CreditService | Orchestrates credit analysis |

### 5. Repository Layer
Data access layer using raw PostgreSQL with parameterized queries:

- UserRepository
- TransactionRepository
- SavingsRepository
- ReportRepository
- AuditRepository

### 6. Database Layer
PostgreSQL database (local or Supabase) with optimized schema and indexes.

## Data Flow

1. **Request received** via REST API or MCP Protocol
2. **Authentication** via JWT middleware
3. **Validation** via Joi schemas
4. **Business Logic** via Services
5. **Data Access** via Repositories
6. **Database Operations** via pg driver
7. **Response** with structured output

## MCP-REST Dependency

**Important**: MCP Server depends on REST API services.

```
MCP Server → Application services → Repositories → PostgreSQL
```

For MCP to work, REST API must also be deployed.

## Security Architecture

### Authentication
- JWT-based authentication
- Token expiration: 24 hours
- Refresh tokens: 7 days

### Authorization (RBAC)
| Role | Permissions |
|------|------------|
| user | Read own data, submit for analysis |
| admin | Full CRUD on all resources |

### Security Middleware
- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests/minute)
- Input sanitization
- SQL injection prevention via parameterized queries

## Credit Scoring System

### Scoring Weights
```
Overall Score =
  (Transaction Consistency × 0.35)
  + (Savings Discipline × 0.40)
  + (Cashflow Stability × 0.25)
```

### Risk Thresholds
| Threshold | Risk Level |
|-----------|------------|
| ≥ 70 | LOW |
| 40-69 | MEDIUM |
| < 40 | HIGH |

### Behavior Profiles
1. **Stable Saver**: High deposits, low withdrawals
2. **Seasonal Earner**: Irregular income patterns
3. **High Withdrawal User**: Frequent large withdrawals
4. **Merchant Cash Flow User**: Balanced in/out flow
5. **New User**: Insufficient history

## Database Schema

### Core Tables
- `users`: User information
- `transactions`: Financial transactions
- `savings_history`: Savings tracking
- `underwriting_reports`: Generated reports
- `audit_logs`: Security audit trail

### Indexes
- Performance indexes on user_id and timestamp
- Composite indexes for common queries
- Partial indexes for failed transactions

## Scalability Considerations

1. **Connection Pooling**: pg Pool with max 20 connections
2. **Query Optimization**: Prepared statements, indexes
3. **Caching**: Future Redis integration point
4. **Load Balancing**: Stateless API design
5. **Horizontal Scaling**: MCP server instances

## Deployment Options

| Component | Local | Cloud (Render) |
|-----------|-------|----------------|
| REST API | Port 3000 | Web Service |
| MCP Server | Port 3001 | Web Service |
| Database | Local PostgreSQL | Render PostgreSQL OR Supabase |

## Error Handling

All errors follow a consistent format:
```json
{
  "error": "Error Type",
  "message": "Human-readable message",
  "details": {}
}
```

## Monitoring & Logging

- Winston logger with configurable log levels
- Request/response logging via Morgan
- Audit logging for security-sensitive operations
- Error tracking with stack traces

## Future Enhancements

1. Redis caching for frequent queries
2. WebSocket support for real-time updates
3. Multi-tenancy support
4. Advanced ML models for scoring
5. Integration with external data sources
