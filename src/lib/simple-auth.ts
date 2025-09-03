import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { db } from '../../db/kysely/client';
import { createHash } from 'crypto';

export interface User {
  id: number;
  email: string;
}

export interface Session {
  id: number;
  userId: number;
  expiresAt: Date;
}

export async function createSession(userId: number): Promise<string> {

  // Generate a secure random token
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const rawToken = Buffer.from(bytes).toString('hex');
  const hashed_token = createHash('sha256').update(rawToken).digest('hex');

  // sets expiration date for session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // inserts session into database
  const result = await db.insertInto('sessions').values({        
    created_at: new Date(),
    expires_at: expiresAt,
    session_token: hashed_token,
    user_id: userId
  }).returning('session_token').executeTakeFirst();  

  if (!result || !result.session_token) {
    throw new Error('Failed to create session');
  }

  return result.session_token;
}



export async function validateSession(token: string): Promise<User | null> {
  try {
    // Hash the token from the cookie
    const hashedToken = createHash('sha256').update(token).digest('hex');

    // Query the database for the session and associated user
    const result = await db.selectFrom('sessions as s')
      .innerJoin('user as u', 's.user_id', 'u.id')
      .select(['u.id', 'u.email'])
      .where('s.session_token', '=', hashedToken)
      .where('s.expires_at', '>', new Date())
      .execute();    
    
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

export async function deleteSession(sessionId: number): Promise<void> {
  await db.deleteFrom('sessions').where('id', '=', sessionId).execute();
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    //1. Looks up user by email in user table
    const userResult = await db
      .selectFrom('user')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();      
    if (!userResult) {
      return null;
    }

    //2. Finds auth_key for that user
    const keyResult = await db
      .selectFrom('auth_key')
      .selectAll()
      .where('user_id', '=', userResult.id)
      .executeTakeFirst();

    if (!keyResult) {
      return null;
    }

    //3. Compares password using bycrypt (hashed)
    if (!keyResult.hashed_password || !(await bcrypt.compare(password, keyResult.hashed_password))) {
      return null;
    }

    return { id: userResult.id, email: userResult.email };  //Success
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Cookie helpers
//Gets session id from cookie
export function getSessionCookie(request: NextRequest): string | null {
  return request.cookies.get('session')?.value || null;
}

//Creates a secure cookie with session token
export function setSessionCookie(token: string): string {
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

//Removes session cookes on logout
export function clearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
