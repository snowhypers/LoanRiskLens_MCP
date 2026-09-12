// MCP Server Entry Point

const { createMCPServer } = require('./server/mcpServer');
const logger = require('shared/utils/logger');

async function main() {
  try {
    const server = await createMCPServer({
      // Local API and MCP processes share .env, so prefer MCP_PORT locally.
      // Render supplies PORT and MCP_PORT is intentionally left unset there.
      port: parseInt(process.env.MCP_PORT || process.env.PORT || '3001', 10),
      host: process.env.HOST || process.env.MCP_HOST || '0.0.0.0',
    });

    await server.start();
    const displayHost = server.host === '0.0.0.0' ? 'localhost' : server.host;

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     AltCredit Intelligence MCP Server                       ║
║     Version: 1.0.0                                          ║
╠══════════════════════════════════════════════════════════════╣
║  MCP Endpoint: http://${displayHost}:${server.port}/mcp                ║
║  Health Check: http://${displayHost}:${server.port}/health             ║
╠══════════════════════════════════════════════════════════════╣
║  Available Tools:                                            ║
║    • analyze_creditworthiness                               ║
║    • analyze_financial_behavior                             ║
║    • generate_underwriting_report                           ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // Graceful shutdown handlers
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down...');
      await server.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start MCP server', { error: error.message });
    process.exit(1);
  }
}

main();
