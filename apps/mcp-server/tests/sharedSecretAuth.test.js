jest.mock('shared/config', () => ({
  mcp: { secret: 'correct-shared-secret' },
}));

jest.mock('shared/utils/logger', () => ({
  error: jest.fn(),
}));

const { requireMcpSecret, secretsMatch } = require('../src/auth/sharedSecretAuth');

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function request(secret) {
  return {
    body: { id: 1 },
    get: jest.fn((header) => (header === 'x-mcp-secret' ? secret : undefined)),
  };
}

describe('MCP shared-secret authentication', () => {
  it('allows a request with the correct secret', () => {
    const next = jest.fn();
    requireMcpSecret(request('correct-shared-secret'), response(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing secret', () => {
    const res = response();
    requireMcpSecret(request(undefined), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects an incorrect secret', () => {
    const res = response();
    requireMcpSecret(request('incorrect-secret'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('does not match secrets with different lengths', () => {
    expect(secretsMatch('short', 'longer-secret')).toBe(false);
  });
});
