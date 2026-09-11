// Test-only environment defaults so `npm test` works without a .env file.
// Real deployments validate strict values via src/env.ts (Zod).
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET ??= "test-secret-min-32-chars-long-abcdef";
