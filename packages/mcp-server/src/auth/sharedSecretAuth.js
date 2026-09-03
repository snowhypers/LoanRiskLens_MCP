const crypto = require('crypto');
const config = require('shared/config');
const logger = require('shared/utils/logger');

const MCP_SECRET_HEADER = 'x-mcp-secret';

function secretsMatch(clientSecret, serverSecret) {
  if (typeof clientSecret !== 'string' || typeof serverSecret !== 'string') {
    return false;
  }

  const client = Buffer.from(clientSecret);
  const server = Buffer.from(serverSecret);
  return client.length === server.length && crypto.timingSafeEqual(client, server);
}

function requireMcpSecret(req, res, next) {
  const serverSecret = config.mcp.secret;
  if (!serverSecret) {
    logger.error('MCP_SECRET is not configured');
    return res.status(503).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'MCP authentication is not configured.' },
      id: req.body?.id ?? null,
    });
  }

  const clientSecret = req.get(MCP_SECRET_HEADER);
  if (!secretsMatch(clientSecret, serverSecret)) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Authentication failed.' },
      id: req.body?.id ?? null,
    });
  }

  return next();
}

module.exports = { MCP_SECRET_HEADER, requireMcpSecret, secretsMatch };
