import { db } from '../src/services/database';

export default async (): Promise<void> => {
  try {
    // Close the database connection pool
    await db.close();
    console.log('Database connections closed successfully');
  } catch (error) {
    console.warn('Error closing database connections:', error);
  }
}; 