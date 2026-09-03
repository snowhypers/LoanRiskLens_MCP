// MCP Server Implementation

const express = require('express');
const http = require('http');
const config = require('shared/config');
const db = require('shared/database');
const logger = require('shared/utils/logger');
const { TOOL_DEFINITIONS, executeTool } = require('../tools/creditTools');
const { requireMcpSecret } = require('../auth/sharedSecretAuth');

/**
 * Alternative Credit Intelligence MCP Server
 *
 * This server exposes credit intelligence tools via the Model Context Protocol,
 * enabling AI clients like Claude Desktop, Cursor, and VSCode to access
 * fintech underwriting capabilities.
 */

class AltCreditMCPServer {
  constructor(options = {}) {
    this.port = options.port || config.mcp.port;
    this.host = options.host || process.env.MCP_HOST || '0.0.0.0';
    this.server = null;
    this.expressApp = null;
    this.isRunning = false;
  }

  /**
   * Initialize the MCP server
   */
  async initialize() {
    // Create Express app for health checks
    this.expressApp = express();
    this.expressApp.use(express.json());

    // CORS headers — allow any MCP client origin (Claude Desktop, Cursor, etc.)
    this.expressApp.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, X-MCP-Secret');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
      next();
    });

    // Health check endpoint
    this.expressApp.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: config.mcp.name,
        version: config.mcp.version,
        timestamp: new Date().toISOString(),
      });
    });

    // MCP protocol endpoint
    this.expressApp.post('/mcp', requireMcpSecret, async (req, res) => {
      // Guard against missing/malformed body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error: request body must be JSON' },
          id: null,
        });
      }

      const { method, params, id } = req.body;

      try {
        switch (method) {
          case 'tools/list':
            res.json({
              jsonrpc: '2.0',
              result: { tools: TOOL_DEFINITIONS },
              id,
            });
            break;

          case 'tools/call': {
            const { name, arguments: toolArgs } = params || {};
            try {
              const result = await executeTool(name, toolArgs);
              res.json({
                jsonrpc: '2.0',
                result: {
                  content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                },
                id,
              });
            } catch (toolError) {
              // Return tool errors as MCP isError content — clients show the
              // message instead of reporting "backend unreachable".
              logger.warn('MCP tool error', { name, error: toolError.message });
              res.json({
                jsonrpc: '2.0',
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `Error: ${toolError.message}`,
                    },
                  ],
                  isError: true,
                },
                id,
              });
            }
            break;
          }

          case 'initialize':
            res.json({
              jsonrpc: '2.0',
              result: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: { listChanged: true } },
                serverInfo: { name: config.mcp.name, version: config.mcp.version },
              },
              id,
            });
            break;

          case 'tools/list_changed':
            res.json({
              jsonrpc: '2.0',
              result: { tools: TOOL_DEFINITIONS },
              id,
            });
            break;

          default:
            res.json({
              jsonrpc: '2.0',
              error: { code: -32601, message: `Method not found: ${method}` },
              id,
            });
        }
      } catch (error) {
        logger.error('MCP request error', { error: error.message });
        res.json({
          jsonrpc: '2.0',
          error: { code: -32603, message: error.message },
          id,
        });
      }
    });

    // Create HTTP server
    this.server = http.createServer(this.expressApp);

    return this;
  }

  /**
   * Start the MCP server
   */
  async start() {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    // Initialize database
    try {
      await db.initializeSchema();
      logger.info('Database initialized for MCP server');
    } catch (error) {
      logger.warn('Database initialization skipped (may already be initialized)', { error: error.message });
    }

    // Start listening
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, () => {
        this.isRunning = true;
        const displayHost = this.host === '0.0.0.0' ? 'localhost' : this.host;
        logger.info(`AltCredit MCP Server started`, {
          host: this.host,
          port: this.port,
          endpoints: {
            health: `http://${displayHost}:${this.port}/health`,
            mcp: `http://${displayHost}:${this.port}/mcp`,
          },
        });
        resolve(this);
      });

      this.server.on('error', (error) => {
        logger.error('Server error', { error: error.message });
        reject(error);
      });
    });
  }

  /**
   * Stop the MCP server
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        logger.info('MCP Server stopped');
        resolve();
      });
    });
  }

  /**
   * Check if server is running
   */
  getStatus() {
    return {
      running: this.isRunning,
      host: this.host,
      port: this.port,
      name: config.mcp.name,
      version: config.mcp.version,
    };
  }
}

// Factory function to create and start server
async function createMCPServer(options = {}) {
  const server = new AltCreditMCPServer(options);
  await server.initialize();
  return server;
}

// Run as standalone server
async function main() {
  const server = await createMCPServer({
    port: parseInt(process.env.MCP_PORT || process.env.PORT || '3001', 10),
    host: process.env.HOST || process.env.MCP_HOST || '0.0.0.0',
  });

  await server.start();

  // Handle shutdown
  process.on('SIGTERM', async () => {
    logger.info('Shutting down MCP server...');
    await server.stop();
    await db.closePool();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('Shutting down MCP server...');
    await server.stop();
    await db.closePool();
    process.exit(0);
  });
}

// Export for use as module
module.exports = {
  AltCreditMCPServer,
  createMCPServer,
  executeTool,
  getToolDefinitions: () => TOOL_DEFINITIONS,
};

// Run if standalone
if (require.main === module) {
  main().catch((error) => {
    logger.error('Failed to start MCP server', { error: error.message });
    process.exit(1);
  });
}
