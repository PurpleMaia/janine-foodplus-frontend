import postgres from 'postgres';

// Create a single database connection instance with minimal connections
export const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === 'production',
  max: 1, // Use only 1 connection to avoid hitting Azure limits
  idle_timeout: 10,
  connect_timeout: 5,
  connection: {
    application_name: 'janine-foodplus-frontend'
  },
  onnotice: () => {}, // Suppress notice messages
  transform: {
    undefined: null, // Handle undefined values
  }
});

// Export the raw postgres instance for Lucia adapter
export { sql as drizzle };
