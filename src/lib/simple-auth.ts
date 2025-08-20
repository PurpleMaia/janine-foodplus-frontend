import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface User {
  id: string;
  email: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

// Simple session management
export async function createSession(userId: string): Promise<string> {
  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await sql`
    INSERT INTO session (id, user_id, expires_at) 
    VALUES (${sessionId}, ${userId}, ${expiresAt})
  `;
  
  return sessionId;
}

export async function validateSession(sessionId: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT u.id, u.email 
      FROM session s 
      JOIN "user" u ON s.user_id = u.id 
      WHERE s.id = ${sessionId} AND s.expires_at > NOW()
    `;
    
    if (result && result.length > 0) {
      const row = result[0];
      return {
        id: row.id,
        email: row.email
      };
    }
    return null;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`DELETE FROM session WHERE id = ${sessionId}`;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const userResult = await sql`SELECT * FROM "user" WHERE email = ${email}`;
    if (!userResult || userResult.length === 0) {
      return null;
    }

    const user = userResult[0];
    const keyResult = await sql`SELECT * FROM auth_key WHERE user_id = ${user.id}`;
    
    if (!keyResult || keyResult.length === 0) {
      return null;
    }

    const key = keyResult[0];
    if (!key.hashed_password || !(await bcrypt.compare(password, key.hashed_password))) {
      return null;
    }

    return { id: user.id, email: user.email };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Cookie helpers
export function getSessionCookie(request: NextRequest): string | null {
  return request.cookies.get('session_id')?.value || null;
}

export function setSessionCookie(sessionId: string): string {
  return `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

export function clearSessionCookie(): string {
  return 'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
