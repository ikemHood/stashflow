import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection string
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stashflow';

// Create a postgres client
const client = postgres(connectionString);

// Create a drizzle instance
export const db = drizzle(client, { schema }); 