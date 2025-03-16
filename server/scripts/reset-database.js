// Script to reset the database for the UUID migration
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // Get the client from the pool
        const client = await pool.connect();

        try {
            // Begin a transaction for safety
            await client.query('BEGIN');

            console.log('Dropping existing tables...');

            // Drop tables in correct order to avoid foreign key constraint issues
            const dropTablesQuery = `
        DROP TABLE IF EXISTS transactions CASCADE;
        DROP TABLE IF EXISTS milestones CASCADE;
        DROP TABLE IF EXISTS sessions CASCADE;
        DROP TABLE IF EXISTS wallets CASCADE;
        DROP TABLE IF EXISTS tokens CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        
        -- Also drop any enum types
        DROP TYPE IF EXISTS currency CASCADE;
        DROP TYPE IF EXISTS saving_method CASCADE;
        DROP TYPE IF EXISTS saving_frequency CASCADE;
      `;

            await client.query(dropTablesQuery);
            console.log('All tables dropped successfully.');

            // Commit the transaction
            await client.query('COMMIT');
            console.log('Database reset complete!');

            console.log('Now apply your new schema with:');
            console.log('  bun run migrate');

        } catch (error) {
            // Rollback on error
            await client.query('ROLLBACK');
            console.error('Database reset failed:', error);
            throw error;
        } finally {
            // Release the client
            client.release();
        }
    } catch (error) {
        console.error('Database reset script failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Prompt user for confirmation
console.log('\x1b[31m%s\x1b[0m', 'WARNING: This will DELETE ALL DATA in your database!');
console.log('Are you sure you want to continue? Type "RESET" to confirm:');

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', async (data) => {
    const input = data.toString().trim();

    if (input === 'RESET') {
        console.log('Starting database reset...');
        await resetDatabase();
        process.exit(0);
    } else {
        console.log('Database reset cancelled.');
        process.exit(0);
    }
}); 