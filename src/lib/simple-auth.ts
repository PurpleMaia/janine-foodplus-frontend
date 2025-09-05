import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { db } from '../../db/kysely/client';
import { createHash } from 'crypto';

export interface User {
  id: string;
  email: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export async function createSession(userId: string): Promise<string> {

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

  return rawToken;
}



export async function validateSession(token: string): Promise<User | null> {
  try {
    // // Hash the token from the cookie
    const hashedToken = createHash('sha256').update(token).digest('hex');

    // Query the database for the session and associated user
    const result = await db.selectFrom('sessions as s')
      .innerJoin('user as u', 's.user_id', 'u.id')
      .select(['u.id', 'u.email'])
      .where('s.session_token', '=', hashedToken)
      .where('s.expires_at', '>', new Date())
      .executeTakeFirst();    
    
    if (result) {      
      return {
        id: result.id,
        email: result.email
      };
    }
    return null;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  const hashedToken = createHash('sha256').update(token).digest('hex');
  await db.deleteFrom('sessions').where('session_token', '=', hashedToken).execute();
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

export async function registerUser(email: string, password: string): Promise<User | null> {
  try {
    //1. Check if user already exists
    const existingUser = await db.selectFrom('user')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    if (existingUser) {
      return null; // User already exists
    }

    //2. Create new user
    const userResult = await db.insertInto('user').values({
      email, 
      created_at: new Date(),
      role: 'user',
      account_status: 'pending',
      username: email.split('@')[0], // Simple username from email
      requested_admin: false
    }).returning('id').executeTakeFirst();

    if (!userResult || !userResult.id) {
      throw new Error('Failed to create user');
    }

    const userId = userResult.id;

    //3. Hash password and store in auth_key table
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.insertInto('auth_key').values({ user_id: userId, hashed_password: hashedPassword }).execute();

    return { id: userId, email }; // Return the new user
  } catch (error) {
    console.error('Registration error:', error);
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
