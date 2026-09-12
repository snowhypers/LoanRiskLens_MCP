# @loan-risk-lens/workflows — Demo / Reference Orchestration

> **This package is a DEMO. It is NOT wired at runtime.**

## What this package is

A 6-agent LangGraph-style orchestration that demonstrates how the credit
analysis steps fit together:

```
START → TransactionAnalysisAgent → SavingsAnalysisAgent
      → BehaviorScoringAgent → RiskClassificationAgent
      → CreditDecisionAgent → ExplanationAgent → END
```

Each agent returns its own result, so the workflow produces a
`detailedAnalysis` breakdown — useful for tests, debugging, and as a
readable reference for the analysis steps.

## What runs in production (the runtime brain)

The API and MCP server do **not** use this package. Both call:

```
creditService.analyzeCreditworthiness(userId)
(@loan-risk-lens/application)
```

- API:   `apps/api/src/controllers/creditController.js`
- MCP:   `apps/mcp-server/src/tools/creditTools.js`

## Why there is only one scoring formula

Both paths share the same domain scoring engine — the single source of
truth for credit scoring math:

```
@loan-risk-lens/domain/scoring   (+ weights from shared/config)
```

- `BehaviorScoringAgent` (here) delegates to the engine — it owns no math
- `creditService` (runtime) calls the same engine directly

Changing a weight in `shared/config.scoring.weights` therefore updates
both the demo and production paths at once.

## Where this demo is pinned

`tests/creditIntelligenceWorkflow.test.js` pins the demo end-to-end with
5 scenarios (decision + riskLevel + agent names + creditScore equality):

| Scenario      | Expected        |
|---------------|-----------------|
| Rajesh Kumar  | LOW / APPROVED  |
| Amit Singh    | MEDIUM / REVIEW |
| Pooja Devi    | MEDIUM / REVIEW |
| Ravi Sharma   | HIGH / REJECTED |
| Sanjay Gupta  | LOW / APPROVED  |

## When to use what

| You want to...                        | Use                                       |
|---------------------------------------|-------------------------------------------|
| Serve analysis from the API/MCP       | `creditService` (runtime brain)           |
| Read/modify the scoring math          | domain engine (`@loan-risk-lens/domain`)  |
| Change a scoring weight               | `shared/config.scoring.weights`           |
| Understand the step-by-step flow      | this package (demo)                       |
| Add per-agent detailed breakdowns     | this package (demo)                       |
