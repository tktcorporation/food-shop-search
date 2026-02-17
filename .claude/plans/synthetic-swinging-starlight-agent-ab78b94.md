# Drizzle ORM with Cloudflare D1 -- Complete Reference Guide

This document consolidates up-to-date documentation (sourced from Context7 / official Drizzle docs) on using Drizzle ORM with Cloudflare D1, including Hono integration patterns.

---

## 1. Packages Needed

```bash
# Core ORM
npm install drizzle-orm

# Dev tooling (migrations, studio, etc.)
npm install -D drizzle-kit

# For loading .env in drizzle.config.ts
npm install -D dotenv
```

No separate D1 driver package is needed -- `drizzle-orm` ships with the D1 adapter built-in (`drizzle-orm/d1`).

---

## 2. Schema Definition (SQLite Dialect)

Cloudflare D1 uses SQLite under the hood, so all schema definitions use `drizzle-orm/sqlite-core`.

### Full Example

```typescript
// src/db/schema.ts
import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users table ───
export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    age: integer('age'),
    role: text('role').$type<'guest' | 'user' | 'admin'>().default('guest'),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [uniqueIndex('email_idx').on(table.email)],
);

// ─── Posts table ───
export const posts = sqliteTable(
  'posts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    content: text('content'),
    slug: text('slug'),
    ownerId: integer('owner_id').references(() => users.id),
  },
  (table) => [
    uniqueIndex('slug_idx').on(table.slug),
    index('title_idx').on(table.title),
  ],
);

// ─── Comments table ───
export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text', { length: 256 }),
  postId: integer('post_id').references(() => posts.id),
  ownerId: integer('owner_id').references(() => users.id),
});
```

### Available SQLite Column Types

| Drizzle Function | SQLite Type | Notes                                                         |
| ---------------- | ----------- | ------------------------------------------------------------- |
| `integer("col")` | `INTEGER`   | Use `.primaryKey({ autoIncrement: true })` for auto-increment |
| `text("col")`    | `TEXT`      | Supports `.$type<T>()` for compile-time type narrowing        |
| `real("col")`    | `REAL`      | 8-byte IEEE floating point                                    |
| `blob("col")`    | `BLOB`      | Supports modes: `buffer`, `bigint`, `json`                    |

### Key Patterns

- **Primary key with auto-increment**: `integer("id").primaryKey({ autoIncrement: true })`
- **Foreign key (inline)**: `integer("owner_id").references(() => users.id)`
- **NOT NULL**: `.notNull()`
- **Default value**: `.default("value")` or `.default(sql\`(CURRENT_TIMESTAMP)\`)`
- **Custom TypeScript type**: `.$type<"a" | "b" | "c">()`
- **Unique index**: `uniqueIndex("name").on(table.column)`
- **Regular index**: `index("name").on(table.column)`

---

## 3. drizzle.config.ts Configuration for D1

```typescript
// drizzle.config.ts  (project root)
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle', // output directory for migration SQL files
  schema: './src/db/schema.ts', // path to your schema file(s)
  dialect: 'sqlite', // D1 is SQLite-based
  driver: 'd1-http', // use D1 HTTP API for remote operations
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});
```

### Required Environment Variables

```env
# .env (do NOT commit this file)
CLOUDFLARE_ACCOUNT_ID=your_account_id      # Cloudflare dashboard > Account ID
CLOUDFLARE_DATABASE_ID=your_d1_database_id  # Workers & Pages > D1 > your DB > Database ID
CLOUDFLARE_D1_TOKEN=your_api_token          # Cloudflare API token with D1 edit permissions
```

### How to Get These Values

- **Account ID**: Cloudflare Dashboard sidebar (right side of overview page)
- **Database ID**: Workers & Pages > D1 > click your database > shown at top
- **Token**: My Profile > API Tokens > Create Token > use "Edit Cloudflare D1" permission

**Important**: Requires `drizzle-kit` version >= 0.21.3 for the `d1-http` driver.

---

## 4. Migrations with drizzle-kit

### Generate Migration Files

After changing your schema, generate SQL migration files:

```bash
npx drizzle-kit generate
```

This reads your `drizzle.config.ts`, compares the current schema against the previous snapshot, and outputs `.sql` migration files into the `out` directory (e.g., `./drizzle/`).

### Apply Migrations Remotely (via D1 HTTP API)

```bash
npx drizzle-kit migrate
```

This applies pending migrations to your remote D1 database using the HTTP API credentials.

### Push Schema Directly (Development)

For rapid development iteration (skips migration files, applies schema diff directly):

```bash
npx drizzle-kit push
```

### Apply Migrations via Wrangler (Alternative)

You can also apply migrations using Wrangler by setting `migrations_dir` in `wrangler.toml`:

```toml
# wrangler.toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
node_compat = true

[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"
migrations_dir = "drizzle"
```

Then run:

```bash
# Apply to local D1 (for development)
npx wrangler d1 migrations apply my-database --local

# Apply to remote D1 (production)
npx wrangler d1 migrations apply my-database --remote
```

### Drizzle Studio (GUI)

```bash
npx drizzle-kit studio
```

Opens a browser-based GUI for browsing/editing your D1 data.

### Introspect Existing Database

```bash
npx drizzle-kit introspect
```

Generates a Drizzle schema from an existing D1 database.

---

## 5. Initialize Drizzle with D1 Binding in a Cloudflare Worker

### Basic Worker (No Framework)

```typescript
// src/index.ts
import { drizzle } from 'drizzle-orm/d1';
import { users } from './db/schema';

export interface Env {
  DB: D1Database; // must match the `binding` name in wrangler.toml
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = drizzle(env.DB);

    const allUsers = await db.select().from(users).all();

    return Response.json(allUsers);
  },
};
```

Key points:

- Import `drizzle` from `"drizzle-orm/d1"` (NOT `drizzle-orm/d1-http` -- that is for drizzle-kit only).
- Pass the D1 binding (`env.DB`) directly to `drizzle()`.
- The binding name (`DB`) must match what is declared in `wrangler.toml` under `[[d1_databases]]`.

---

## 6. Query Examples (Insert, Select, Update, Delete)

```typescript
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from './db/schema';

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = drizzle(env.DB);

    // ─── INSERT ───
    const newUser: typeof users.$inferInsert = {
      name: 'John',
      age: 30,
      email: 'john@example.com',
    };
    await db.insert(users).values(newUser);

    // Insert multiple rows
    await db.insert(users).values([
      { name: 'Alice', age: 25, email: 'alice@example.com' },
      { name: 'Bob', age: 35, email: 'bob@example.com' },
    ]);

    // ─── SELECT ───
    // Select all
    const allUsers = await db.select().from(users).all();

    // Select with WHERE
    const john = await db
      .select()
      .from(users)
      .where(eq(users.email, 'john@example.com'));

    // Select specific columns
    const names = await db
      .select({ name: users.name, email: users.email })
      .from(users);

    // ─── UPDATE ───
    await db
      .update(users)
      .set({ age: 31 })
      .where(eq(users.email, 'john@example.com'));

    // ─── DELETE ───
    await db.delete(users).where(eq(users.email, 'john@example.com'));

    return Response.json(allUsers);
  },
};
```

### Type Helpers

```typescript
// Infer the INSERT type (all columns, respecting defaults/nullable)
type NewUser = typeof users.$inferInsert;

// Infer the SELECT type (what you get back from queries)
type User = typeof users.$inferSelect;
```

---

## 7. Hono + Drizzle + D1 Integration

### Basic Setup

```typescript
// src/index.ts
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from './db/schema';

// Define the bindings type
type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// ─── GET all users ───
app.get('/users', async (c) => {
  const db = drizzle(c.env.DB);
  const allUsers = await db.select().from(users).all();
  return c.json(allUsers);
});

// ─── GET user by ID ───
app.get('/users/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number(c.req.param('id'));
  const user = await db.select().from(users).where(eq(users.id, id));
  if (user.length === 0) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(user[0]);
});

// ─── POST create user ───
app.post('/users', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json<typeof users.$inferInsert>();
  await db.insert(users).values(body);
  return c.json({ success: true }, 201);
});

// ─── PUT update user ───
app.put('/users/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  await db.update(users).set(body).where(eq(users.id, id));
  return c.json({ success: true });
});

// ─── DELETE user ───
app.delete('/users/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(users).where(eq(users.id, id));
  return c.json({ success: true });
});

export default app;
```

### Middleware Pattern (Reusable DB Instance)

If you want to avoid calling `drizzle(c.env.DB)` in every route, create a middleware:

```typescript
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './db/schema';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  db: DrizzleD1Database<typeof schema>;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware to initialize drizzle once per request
const dbMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  c.set('db', drizzle(c.env.DB, { schema }));
  await next();
});

app.use('*', dbMiddleware);

// Now use c.var.db in routes
app.get('/users', async (c) => {
  const db = c.var.db;
  const allUsers = await db.select().from(schema.users).all();
  return c.json(allUsers);
});

export default app;
```

### wrangler.toml for Hono + D1

```toml
name = "my-hono-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
migrations_dir = "drizzle"
```

---

## 8. Complete Project Setup Checklist

### Step-by-step

1. **Create D1 database**

   ```bash
   npx wrangler d1 create my-database
   ```

2. **Install dependencies**

   ```bash
   npm install hono drizzle-orm
   npm install -D drizzle-kit dotenv wrangler
   ```

3. **Configure wrangler.toml** with the D1 binding (see above)

4. **Create schema file** at `src/db/schema.ts` (see Section 2)

5. **Create drizzle.config.ts** at project root (see Section 3)

6. **Set up .env** with Cloudflare credentials (see Section 3)

7. **Generate migrations**

   ```bash
   npx drizzle-kit generate
   ```

8. **Apply migrations**

   ```bash
   # Local development
   npx wrangler d1 migrations apply my-database --local

   # Remote (production)
   npx drizzle-kit migrate
   # OR
   npx wrangler d1 migrations apply my-database --remote
   ```

9. **Write your Worker/Hono app** (see Section 5-7)

10. **Run locally**

    ```bash
    npx wrangler dev
    ```

11. **Deploy**
    ```bash
    npx wrangler deploy
    ```

---

## 9. Key Differences: d1-http vs d1 Driver

| Aspect     | `drizzle-orm/d1`       | `d1-http` (drizzle-kit only)         |
| ---------- | ---------------------- | ------------------------------------ |
| Used in    | Worker runtime code    | `drizzle.config.ts` only             |
| Connection | D1 binding (`env.DB`)  | HTTP API (account ID + token)        |
| Purpose    | Run queries at runtime | Migrations, push, studio, introspect |
| Package    | `drizzle-orm`          | `drizzle-kit`                        |

**Do NOT use `d1-http` in your Worker code.** It is exclusively for drizzle-kit tooling operations that run outside the Worker runtime (e.g., on your local machine or in CI).

---

## 10. Sources

All documentation sourced via Context7 from:

- Drizzle ORM official docs: https://orm.drizzle.team/docs/get-started/d1-new
- Drizzle ORM GitHub docs: https://github.com/drizzle-team/drizzle-orm-docs
- Drizzle D1 HTTP guide: https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit
- Drizzle D1 connection docs: https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/connect-cloudflare-d1.mdx
- Hono docs: https://hono.dev/docs/api/context
- Cloudflare Workers wrangler config: https://developers.cloudflare.com/workers/wrangler/configuration
