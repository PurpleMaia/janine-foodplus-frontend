import { db } from '../../db/kysely/client';
import type { User } from '@/lib/auth';

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const user = await db
      .selectFrom('user')
      .select(['id', 'email', 'username', 'role'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  try {
    if (userIds.length === 0) {
      return [];
    }

    const users = await db
      .selectFrom('user')
      .select(['id', 'email', 'username', 'role'])
      .where('id', 'in', userIds)
      .execute();

    return users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    }));
  } catch (error) {
    console.error('Error fetching users by IDs:', error);
    return [];
  }
}
