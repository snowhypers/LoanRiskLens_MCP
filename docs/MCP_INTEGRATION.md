
# MCP Integration Guide

## MCP Transport

**Type**: HTTP (not STDIO)

The MCP server uses HTTP transport with JSON-RPC 2.0 protocol.

- `POST /mcp` - MCP tool calls
- `GET /health` - Health check

## Model Context Protocol (MCP) Overview

The AltCredit Intelligence MCP Server exposes credit analysis tools to AI clients through a standardized JSON-RPC 2.0 interface.

## Connection

### HTTP Endpoint
```
POST http://localhost:3001/mcp
GET http://localhost:3001/health
```

## Authentication

Every request to `POST /mcp` must include the same secret configured on the
server as `MCP_SECRET`. The client stores its matching value in its own
`MCP_CLIENT_SECRET` environment variable and sends it in the `X-MCP-Secret`
header. `MCP_CLIENT_SECRET` is a client-side convention; the server only reads
`MCP_SECRET`.

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "X-MCP-Secret: $MCP_CLIENT_SECRET" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

Requests with a missing or incorrect secret receive HTTP `401`. Keep both
environment variables private; never place the secret in source code.

### Initialize Connection

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {},
  "id": 1
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {
        "listChanged": true
      }
    },
    "serverInfo": {
      "name": "AltCredit Intelligence MCP Server",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

## Available Tools

### 1. tools/list

List all available tools.

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 2
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "analyze_creditworthiness",
        "description": "Analyze credit eligibility...",
        "inputSchema": {...},
        "outputSchema": {...}
      },
      ...
    ]
  },
  "id": 2
}
```

### 2. tools/call

Execute a specific tool.

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "analyze_creditworthiness",
    "arguments": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  },
  "id": 3
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"credit_score\": 78, \"risk_level\": \"LOW\", ...}"
      }
    ]
  },
  "id": 3
}
```

## Tool Definitions

### analyze_creditworthiness

**Purpose**: Analyze credit eligibility

**Input Schema**:
```javascript
{
  "user_id": "string (UUID)"  // Required
}
```

**Output Schema**:
```javascript
{
  "credit_score": "integer (0-100)",
  "risk_level": "LOW | MEDIUM | HIGH",
  "recommended_loan_amount": "integer",
  "repayment_confidence": "HIGH | MEDIUM | LOW",
  "decision": "APPROVED | REVIEW | REJECTED",
  "explanation": "string"
}
```

**Example**:
```json
{
  "credit_score": 78,
  "risk_level": "LOW",
  "recommended_loan_amount": 50000,
  "repayment_confidence": "HIGH",
  "decision": "APPROVED",
  "explanation": "User demonstrates stable savings behavior..."
}
```

---

### analyze_financial_behavior

**Purpose**: Analyze financial discipline

**Input Schema**:
```javascript
{
  "user_id": "string (UUID)"  // Required
}
```

**Output Schema**:
```javascript
{
  "behavior_profile": "Stable Saver | Seasonal Earner | ...",
  "savings_score": "integer (0-100)",
  "cashflow_stability": "HIGH | MEDIUM | LOW",
  "withdrawal_behavior": "NORMAL | HIGH | LOW | ..."
}
```

---

### generate_underwriting_report

**Purpose**: Complete underwriting summary

**Input Schema**:
```javascript
{
  "user_id": "string (UUID)"  // Required
}
```

**Output Schema**:
```javascript
{
  "user_id": "string",
  "report_date": "string (ISO 8601)",
  "credit_score": "integer",
  "risk_level": "LOW | MEDIUM | HIGH",
  "recommendation": "APPROVED | REVIEW | REJECTED",
  "recommended_amount": "integer",
  "repayment_confidence": "HIGH | MEDIUM | LOW",
  "explanation": "string",
  "financial_behavior": {
    "profile": "string",
    "savings_score": "integer",
    "cashflow_stability": "string",
    "withdrawal_behavior": "string"
  },
  "risk_factors": ["string"],
  "protective_factors": ["string"],
  "score_breakdown": {
    "overall": "integer",
    "transaction_consistency": "integer",
    "savings_discipline": "integer",
    "cashflow_stability": "integer"
  }
}
```

## Error Handling

```json
// Error Response
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "User not found"
  },
  "id": 5
}
```

### Error Codes
| Code | Meaning |
|------|---------|
| -32600 | Invalid Request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |

## Integration Examples

### Claude Desktop (Local)

Add to Claude Desktop configuration:
```json
{
  "mcpServers": {
    "altcredit": {
      "command": "node",
      "args": ["/path/to/mcp-server/src/index.js"],
      "env": {
        "MCP_PORT": "3001"
      }
    }
  }
}
```

### Claude Desktop (Remote - Render/Supabase)

Add to Claude Desktop configuration:
```json
{
  "mcpServers": {
    "altcredit": {
      "url": "https://altcredit-mcp.onrender.com/mcp"
    }
  }
}
```

### curl

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "analyze_creditworthiness",
      "arguments": {"user_id": "550e8400-e29b-41d4-a716-446655440000"}
    },
    "id": 1
  }'
```

### Python Client

```python
import requests

def call_mcp_tool(tool_name, arguments):
    response = requests.post(
        'http://localhost:3001/mcp',
        json={
            'jsonrpc': '2.0',
            'method': 'tools/call',
            'params': {
                'name': tool_name,
                'arguments': arguments
            },
            'id': 1
        }
    )
    return response.json()

# Example usage
result = call_mcp_tool('analyze_creditworthiness', {
    'user_id': '550e8400-e29b-41d4-a716-446655440000'
})
print(result)
```

## Best Practices

1. **Connection Management**: Reuse connections for multiple requests
2. **Error Handling**: Always check for errors in response
3. **Timeouts**: Set appropriate timeouts (recommended: 30s)
4. **Retry Logic**: Implement exponential backoff for failures
5. **Validation**: Validate tool responses before use
