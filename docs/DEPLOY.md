# Deployment Guide - Render.com

## Prerequisites

1. **GitHub repository** with your code pushed
2. **Render account** at render.com
3. **PostgreSQL database** - Choose one:
   - **Render PostgreSQL** (Step 1a)
   - **Supabase** (Step 1b - skip Step 1a)

---

## Step 1a: Create PostgreSQL Database (Render)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New → PostgreSQL**
3. Fill in:
   - **Name**: `altcredit-db`
   - **Database Name**: `altcredit_db`
   - **User**: `altcredit_user`
4. Click **Create Database**
5. **Copy connection details** shown (host, port, user, password)

---

## Step 1b: OR Use Supabase Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project or select existing
3. Go to **Settings → Database**
4. Copy **Connection string** (URI format):
   ```
   postgres://postgres.[project]:[password]@db.[project].supabase.co:5432/postgres
   ```

---

## Step 2: Deploy REST API (Required - MCP depends on it)

1. Click **New → Web Service**
2. Connect your GitHub repository
3. Fill in:

| Setting | Value |
|---------|-------|
| Name | `altcredit-api` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start --workspace=apps/api` |
| Plan | `Free` |

4. Scroll to **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DB_HOST` | paste from Step 1 |
| `DB_PORT` | `5432` |
| `DB_NAME` | `altcredit_db` |
| `DB_USER` | paste from Step 1 |
| `DB_PASSWORD` | paste from Step 1 |

5. Click **Deploy Web Service**
6. Wait for "Deployed" status (1-2 minutes)

---

## Step 3: Deploy MCP Server

1. Click **New → Web Service**
2. Connect your GitHub repository
3. Fill in:

| Setting | Value |
|---------|-------|
| Name | `altcredit-mcp` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start --workspace=mcp-server` |
| Plan | `Free` |

4. Add same **Environment Variables** as Step 2:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MCP_SECRET` | long random shared secret; do not commit it |
| `DB_HOST` | paste from Step 1 |
| `DB_PORT` | `5432` |
| `DB_NAME` | `altcredit_db` |
| `DB_USER` | paste from Step 1 |
| `DB_PASSWORD` | paste from Step 1 |

5. Click **Deploy Web Service**

---

## Step 4: Test Deployment

### Test REST API
```bash
curl https://altcredit-api.onrender.com/api/health
```

### Test MCP Server
```bash
curl -X POST https://altcredit-mcp.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "X-MCP-Secret: $MCP_CLIENT_SECRET" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

---

## Step 5: Load Underwriting Data

Import approved synthetic or production records into Supabase before using the
underwriting tools. The API and MCP service create the schema at startup, but
they do not import CSV files automatically.

---

## Step 6: Connect Claude Desktop

Edit MCP config file at `~/Library/Application Support/Claude/mcp_config.json`:

```json
{
  "mcpServers": {
    "altcredit": {
      "url": "https://altcredit-mcp.onrender.com/mcp"
    }
  }
}
```

Restart Claude Desktop.

Now ask: "Analyze user 451"

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Connection refused" | Check DB env vars are correct |
| 502 Bad Gateway | Check logs in Render dashboard |
| MCP not working | Make sure both API and MCP deployed |

---

## Cost: $0 (Free Tier)

- PostgreSQL: Free (750 hours/month)
- Web Services: Free (750 hours/month each)
