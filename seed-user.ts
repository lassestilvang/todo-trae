import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './src/db/schema';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('Seeding user...');
  await db.insert(schema.users).values({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123', // Plain text as per src/lib/auth.ts line 39
  }).onConflictDoNothing();
  
  // Create a default list for the user
  await db.insert(schema.taskLists).values({
    id: 'default-list-id',
    name: 'Inbox',
    userId: 'test-user-id',
    isDefault: true,
  }).onConflictDoNothing();

  console.log('User seeded!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
