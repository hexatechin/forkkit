import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL or POSTGRES_URL environment variable.");
}

let cached = global._pgPool;
if (!cached) cached = global._pgPool = { pool: null, schemaPromise: null };

export function getDb() {
  if (!cached.pool) {
    cached.pool = new Pool({ connectionString, max: 10 });
  }
  return cached.pool;
}

export async function ensureSchema() {
  if (cached.schemaPromise) return cached.schemaPromise;
  cached.schemaPromise = (async () => {
    const db = getDb();
    await db.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id text PRIMARY KEY,
        slug text NOT NULL UNIQUE,
        name text NOT NULL,
        tagline text,
        logo text,
        banner text,
        primaryColor text,
        accentColor text,
        bgTint text,
        whatsappNumber text,
        phone text,
        email text,
        address text,
        businessHours jsonb,
        deliveryFee double precision,
        minOrder double precision,
        prepTimeMins integer,
        socialLinks jsonb,
        seoTitle text,
        seoDesc text
      );

      CREATE TABLE IF NOT EXISTS categories (
        id text PRIMARY KEY,
        tenantId text REFERENCES tenants(id) ON DELETE CASCADE,
        name text,
        order_index integer,
        icon text
      );

      CREATE TABLE IF NOT EXISTS products (
        id text PRIMARY KEY,
        tenantId text REFERENCES tenants(id) ON DELETE CASCADE,
        categoryId text REFERENCES categories(id),
        name text,
        description text,
        images jsonb,
        price double precision,
        discountPrice double precision,
        rating double precision,
        badges jsonb,
        available boolean,
        isEggOption boolean,
        allowCakeMessage boolean,
        variants jsonb,
        addons jsonb
      );

      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        tenantId text REFERENCES tenants(id) ON DELETE CASCADE,
        email text UNIQUE,
        passwordHash text,
        name text,
        role text
      );

      CREATE TABLE IF NOT EXISTS orders (
        id text PRIMARY KEY,
        tenantId text REFERENCES tenants(id) ON DELETE CASCADE,
        tenantSlug text,
        customer jsonb,
        mode text,
        scheduledAt text,
        occasion text,
        cakeMessage text,
        notes text,
        items jsonb,
        subtotal double precision,
        deliveryFee double precision,
        total double precision,
        status text,
        createdAt text
      );
    `);
  })();
  return cached.schemaPromise;
}
