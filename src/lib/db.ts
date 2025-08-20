import postgres from 'postgres';

// Create a single database connection instance
export const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === 'production',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Export the raw postgres instance for Lucia adapter
export { sql as drizzle };
