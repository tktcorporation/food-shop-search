import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './worker/src/db/schema.ts',
  dialect: 'sqlite',
});
