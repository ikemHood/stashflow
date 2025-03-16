// Script to check which tables exist in the database
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkTables() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        console.log('Tables in the database:');
        if (result.rows.length === 0) {
            console.log('  No tables found');
        } else {
            result.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        }

        // Check if specific tables exist
        const expectedTables = ['users', 'tokens', 'milestones', 'wallets', 'transactions', 'sessions'];
        const missingTables = expectedTables.filter(
            table => !result.rows.some(row => row.table_name === table)
        );

        if (missingTables.length > 0) {
            console.log('\nMissing tables that are referenced in the migration:');
            missingTables.forEach(table => {
                console.log(`  - ${table}`);
            });
            console.log('\nYou need to create these tables before running the UUID migration.');
        } else {
            console.log('\nAll tables required for the migration exist.');
        }

    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        await pool.end();
    }
}

checkTables(); 