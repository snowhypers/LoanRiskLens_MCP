# Agent Context Guide

## Main Aim

LoanRiskLens is an Alternative Credit Intelligence platform for fintech underwriting.

Its main business question is:

> Can we safely lend money to this customer?

The application is designed for customers who may not have traditional credit signals such as salary slips, CIBIL score, ITR, formal employment, or long bank-credit history. Instead, it evaluates behavioral financial data:

- Transaction consistency
- Savings discipline
- Cash-flow stability
- Failed transaction behavior
- Withdrawal behavior
- Liquidity buffer

The system returns an explainable underwriting recommendation:

- `APPROVED`
- `REVIEW`
- `REJECTED`

It also recommends a loan amount, classifies risk, and explains the decision in human-readable language.

## Business Context

Fintech companies serving self-employed and informal-income customers often need to underwrite users such as:

- Kirana shop owners
- Delivery partners
- Taxi or auto drivers
- Vegetable vendors
- Freelancers
- Tailors
- Daily earners
- Small merchants

Traditional lenders may reject these users because they lack formal credit documents. This project helps identify financially disciplined borrowers by analyzing how they actually manage money.

Example:

Rajesh Kumar owns a small grocery shop. He has no CIBIL history, but he has stable deposits, good savings, and very few failed transactions. A traditional lender may reject him. LoanRiskLens can classify him as low risk and recommend approval.

## System Shape

The repo is a Node.js monorepo with these main parts:

- `apps/api`: Express REST API
- `apps/mcp-server`: HTTP JSON-RPC MCP server
- `packages/domain`: rule-based scoring and behavior analysis
- `packages/workflows`: sequential agent workflow
- `shared`: config, database, helpers, validation
- `docs`: setup, deployment, API, MCP, and architecture docs

The main runtime flow is:

```text
MCP/API request
  -> CreditService
  -> TransactionService + SavingsService
  -> PostgreSQL repositories
  -> Credit scoring + risk analysis
  -> Underwriting report + explanation
```

## Agent Workflow

The conceptual workflow is:

```text
TransactionAgent
  -> SavingsAgent
  -> BehaviorAgent
  -> RiskAgent
  -> CreditDecisionAgent
  -> ExplanationAgent
```

### TransactionAgent

Answers:

> Is this customer's cash flow stable enough for lending?

Looks at:

- Total transactions
- Credit/debit counts
- Failed transactions
- Monthly inflow
- Monthly outflow
- Income consistency

### SavingsAgent

Answers:

> Does this customer manage money responsibly?

Looks at:

- Total deposits
- Total withdrawals
- Net savings
- Current balance
- Deposit/withdrawal count
- Liquidity
- Savings profile

### BehaviorAgent

Answers:

> What is this customer's overall financial behavior?

Combines:

```text
Overall Score =
  Transaction Consistency * 0.35
  + Savings Discipline * 0.40
  + Cashflow Stability * 0.25
```

### RiskAgent

Answers:

> How risky is it to lend money to this customer?

Outputs:

- `LOW`
- `MEDIUM`
- `HIGH`

### CreditDecisionAgent

Answers:

> What lending action should we take?

Outputs:

- Decision
- Recommended amount
- Repayment confidence
- Loan terms
- Conditions

### ExplanationAgent

Answers:

> Why was this decision made?

Outputs:

- Main explanation
- Plain language summary
- Recommendations
- Data quality/confidence metadata

## MCP Tools

The MCP server is HTTP JSON-RPC based, not stdio-based.

Endpoint:

```text
POST /mcp
GET /health
```

Tools:

```text
analyze_creditworthiness
analyze_financial_behavior
generate_underwriting_report
```

### analyze_creditworthiness

Input:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

Output shape:

```json
{
  "credit_score": 90,
  "risk_level": "LOW",
  "recommended_loan_amount": 63000,
  "repayment_confidence": "HIGH",
  "decision": "APPROVED",
  "explanation": "..."
}
```

### analyze_financial_behavior

Input:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

Output shape:

```json
{
  "behavior_profile": "Stable Saver",
  "savings_score": 85,
  "cashflow_stability": "HIGH",
  "withdrawal_behavior": "NORMAL"
}
```

### generate_underwriting_report

Input:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

Output shape:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "credit_score": 90,
  "risk_level": "LOW",
  "recommendation": "APPROVED",
  "recommended_amount": 63000,
  "repayment_confidence": "HIGH",
  "explanation": "...",
  "financial_behavior": {
    "profile": "Stable Saver",
    "savings_score": 85,
    "cashflow_stability": "HIGH",
    "withdrawal_behavior": "NORMAL"
  },
  "risk_factors": [],
  "protective_factors": ["Consistent transaction history"],
  "score_breakdown": {
    "overall": 85,
    "transaction_consistency": 89,
    "savings_discipline": 80,
    "cashflow_stability": 87
  }
}
```

## Demo Users

Use these five synthetic underwriting scenarios after importing equivalent
records into the connected database:

| User | Expected Result |
| --- | --- |
| Rajesh Kumar | `LOW`, `APPROVED`, high confidence |
| Amit Singh | `MEDIUM`, `REVIEW` |
| Pooja Devi | `MEDIUM`, `REVIEW` |
| Ravi Sharma | `HIGH`, `REJECTED` |
| Sanjay Gupta | `LOW`, `APPROVED` |

If these users are not found by API/MCP, the app is connected to a different
database or the records have not been imported.

## Example Demo Questions

These are good questions for another agentic IDE, MCP client, or demo operator to ask.

### 1. Can we approve Rajesh Kumar?

Use:

```text
generate_underwriting_report
```

Input:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

Expected result:

```text
LOW risk
APPROVED
Recommended amount around INR 50,000-75,000
Repayment confidence HIGH
```

### 2. Why was Ravi Sharma rejected?

Use:

```text
generate_underwriting_report
```

Input:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440004"
}
```

Expected result:

```text
HIGH risk
REJECTED
Reasons include failed transactions, negative balance, withdrawals exceeding deposits, and unstable cash flow.
```

### 3. How much can we safely lend to Amit Singh?

Use:

```text
analyze_creditworthiness
```

Input:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

Expected result:

```text
MEDIUM risk
REVIEW
Recommended amount around INR 20,000-35,000
```

### 4. Generate a complete underwriting report for Pooja Devi.

Use:

```text
generate_underwriting_report
```

Input:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440003"
}
```

Expected result:

```text
MEDIUM risk
REVIEW
Explanation should mention low savings buffer and manual review need.
```

### 5. Is Sanjay Gupta a safe borrower?

Use:

```text
analyze_creditworthiness
```

Input:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440005"
}
```

Expected result:

```text
LOW risk
APPROVED
Healthy business income and savings behavior.
```

## Example MCP JSON-RPC Calls

List tools:

```bash
curl -s http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

Call underwriting report:

```bash
curl -s http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"generate_underwriting_report",
      "arguments":{
        "user_id":"550e8400-e29b-41d4-a716-446655440001"
      }
    },
    "id":2
  }'
```

## How To Run

Install and test:

```bash
npm install
npm test
```

Start API:

```bash
npm run dev
```

Start MCP:

```bash
npm run dev:mcp
```

Health checks:

```bash
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:3001/health
```

## What Is Working

The current system supports:

- API-based underwriting
- MCP-based underwriting
- Rule-based credit scoring
- Explainable recommendations
- Dataset seeding
- User ownership checks for API routes
- Report persistence
- Scenario tests for five customer profiles
- Workflow tests for all six agents

## Known Limitations

Another agentic IDE should understand these before claiming production readiness:

1. The MCP server is HTTP JSON-RPC, not stdio MCP.
2. Portfolio-level tools are not yet implemented.
   Examples missing:
   - `list_high_risk_customers`
   - `list_manual_review_customers`
   - `summarize_lending_portfolio`
   - `find_safe_borrowers`
3. The current tools analyze one user at a time.
4. Data quality matters. Users with no recent transactions will receive conservative decisions.
5. Production should use versioned migrations instead of relying only on automatic schema upgrades.
6. MCP access should be protected before real internal deployment.
7. Requested loan amount analysis is not yet implemented. The system recommends a safe amount, but does not yet answer "Can we approve exactly INR 50,000?" as a first-class input.

## Best Positioning

This project is ready for:

```text
Internal underwriting assistant
Credit analyst copilot
Fintech demo
Founder/interviewer walkthrough
Rules-based pilot
```

It is not yet ready for:

```text
Fully automated loan disbursal without human review
```

## One-Sentence Pitch

LoanRiskLens helps fintech teams underwrite borrowers without traditional credit history by analyzing transaction behavior, savings discipline, and cash-flow stability, then producing explainable lending recommendations through API and MCP tools.
