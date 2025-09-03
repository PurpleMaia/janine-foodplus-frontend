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
  //generates random string for session id
  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  // sets expiration date for session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  // inserts session into database
  await sql`
    INSERT INTO session (id, user_id, expires_at) 
    VALUES (${sessionId}, ${userId}, ${expiresAt})
  `;
  
  return sessionId;
}



export async function validateSession(sessionId: string): Promise<User | null> {
  try {
    //Looks up session in database
    //joins with user table to 
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
    //1. Looks up user by email in user table
    const userResult = await sql`SELECT * FROM "user" WHERE email = ${email}`;
    if (!userResult || userResult.length === 0) {
      return null;
    }

    const user = userResult[0];
    //2. Finds auth_key for that user
    const keyResult = await sql`SELECT * FROM auth_key WHERE user_id = ${user.id}`;
    
    if (!keyResult || keyResult.length === 0) {
      return null;
    }

    const key = keyResult[0];
    //3. Compares password using bycrypt (hashed)
    if (!key.hashed_password || !(await bcrypt.compare(password, key.hashed_password))) {
      return null;
    }

    return { id: user.id, email: user.email };  //Success
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function registerUser(email: string, password: string): Promise<User | null> {
  try {
    //1. Check if user already exists
    const existingUser = await sql`SELECT * FROM "user" WHERE email = ${email}`;
    if (existingUser && existingUser.length > 0) {
      return null; // User already exists
    }

    //2. Create new user
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    console.log('Generated user ID:', userId);
    await sql`INSERT INTO "user" (id, email) VALUES (${userId}, ${email})`;

    //3. Hash password and store in auth_key table
    const hashedPassword = await bcrypt.hash(password, 10);
    const keyId = 'key_' + Math.random().toString(36).substr(2, 9);
    console.log('Generated key ID:', keyId);
    await sql`INSERT INTO auth_key (id, user_id, hashed_password) VALUES (${keyId}, ${userId}, ${hashedPassword})`;

    return { id: userId, email }; // Return the new user
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
}

// Cookie helpers
//Gets session id from cookie
export function getSessionCookie(request: NextRequest): string | null {
  return request.cookies.get('session_id')?.value || null;
}

//Creates a secure cookie with session id
export function setSessionCookie(sessionId: string): string {
  return `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

//Removes session cookes on logout
export function clearSessionCookie(): string {
  return 'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
