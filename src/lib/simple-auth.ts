import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { db } from '../../db/kysely/client';
import { createHash, randomUUID } from 'crypto';

export interface User {
  id: string;
  email: string;
  role: string;
  username: string;
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
  const result = await db
    .insertInto('sessions')
    .values({
      id: randomUUID(),
      created_at: new Date(),
      expires_at: expiresAt,
      session_token: hashed_token,
      user_id: userId
    })
    .returning('session_token')
    .executeTakeFirst();  

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
    const result = await db
      .selectFrom('sessions as s')
      .innerJoin('user as u', 's.user_id', 'u.id')
      .select(['u.id', 'u.role', 'u.email', 'u.username', 'u.email_verified'])
      .where('s.session_token', '=', hashedToken)
      .where('s.expires_at', '>', new Date())
      .executeTakeFirst();    
    
    if (result) {
      // Debug log to see what role is being returned
      console.log('🔍 [DEBUG] Session validation - User role from DB:', result.role, 'User email:', result.email);
      
      return {
        id: result.id,
        email: result.email,
        role: result.role || result.role, // Ensure role is returned as-is from DB
        username: result.username
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
  await db
    .deleteFrom('sessions')
    .where('session_token', '=', hashedToken)
    .execute();
}

export async function authenticateUser(authString: string, password: string): Promise<User> {
  //1. Looks up user by email or username in user table
  const userResult = await db
    .selectFrom('user')
    .select(['id', 'email', 'username', 'role', 'account_status', 'requested_admin', 'email_verified'])
    .where((eb: any) => eb.or([
      eb('email', '=', authString),
      eb('username', '=', authString)  // using email parameter as it could be either email or username
    ]))
    .executeTakeFirst();      
  if (!userResult) {
    throw new Error('USER_NOT_FOUND');
  }
  
  // Only accounts with 'active' status can log in
  // This ensures ALL users (both old and new) require admin approval before they can log in
  // Note: Using snake_case because we're using (db as any) which returns raw DB column names
  if (userResult.account_status !== 'active') {
    // For new accounts: check if email is verified (for better error message)
    if (userResult.account_status === 'unverified' || userResult.account_status === 'pending') {
      if (!userResult.email_verified) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }
      // Email is verified but account is pending admin approval
      console.error('Account pending admin approval for user:', userResult.email);
      throw new Error('ACCOUNT_INACTIVE');
    }
    // Any other non-active status (denied, etc.)
    console.error('Account not active for user:', userResult.email, 'Status:', userResult.account_status);
    throw new Error('ACCOUNT_INACTIVE');
  }
  
  // Account is active - can log in
  // Note: For old accounts created before email verification, we don't require email_verified
  // But all accounts (old and new) MUST have account_status = 'active' to log in 

  //2. Finds auth_key for that user
  const keyResult = await db
    .selectFrom('auth_key')
    .select(['id', 'user_id', 'hashed_password'])
    .where('user_id', '=', userResult.id)
    .executeTakeFirst();

  if (!keyResult) {
    throw new Error('AUTH_KEY_NOT_FOUND');
  }

  //3. Compares password using bycrypt (hashed)
  if (!keyResult.hashed_password || !(await bcrypt.compare(password, keyResult.hashed_password))) {
    throw new Error('INVALID_CREDENTIALS');
  }

  return { id: userResult.id, email: userResult.email, role: userResult.role, username: userResult.username };  //Success
} 

export async function registerUser(email: string, username: string, password: string): Promise<{ user: User | null; verificationToken: string | null }> {
  try {
    //1. Check if user already exists
    const existingUser = await db.selectFrom('user')
      .selectAll()
      .where((eb) => eb.or([
        eb('email', '=', email),
        eb('username', '=', username)
      ]))
      .executeTakeFirst();

    if (existingUser) {
      return { user: null, verificationToken: null }; // User already exists
    }

    //2. Generate verification token
    const verificationTokenBytes = new Uint8Array(32);
    crypto.getRandomValues(verificationTokenBytes);
    const verificationToken = Buffer.from(verificationTokenBytes).toString('hex');

    //3. Create new user (status: 'unverified' - waiting for email verification)
    const userResult = await db.insertInto('user').values({
      email: email, 
      created_at: new Date(),
      role: 'user',
      account_status: 'unverified', // Will be set to 'pending' after email verification
      username: username,
      requested_admin: false,
      email_verified: false,
      verification_token: verificationToken
    }).returning('id').executeTakeFirst();

    if (!userResult || !userResult.id) {
      throw new Error('Failed to create user');
    }

    const userId = userResult.id;

    //4. Hash password and store in auth_key table
    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .insertInto('auth_key')
      .values({ id: randomUUID(), user_id: userId, hashed_password: hashedPassword })
      .execute();

    return { 
      user: { id: userId, email, role: 'user', username }, 
      verificationToken 
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { user: null, verificationToken: null };
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
