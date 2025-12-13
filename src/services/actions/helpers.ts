import { auth } from "@/lib/auth";
import { User } from "@/types/users";
import { z } from "zod";

// ============ Auth Helpers ============

type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Get current user or null (non-throwing)
export async function getUser(): Promise<User | null> {
  const session = await auth();
  return session?.user ?? null;
}

// Get current user or throw (for actions that require auth)
export async function requireUser(): Promise<User> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  return session.user;
}

// Check if user has required role
export async function requireRole(roles: string | string[]): Promise<User> {
  const user = await requireUser();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  
  return user;
}

// ============ Server Action Wrappers ============
// 

/**
 * Public action wrapper
 * @param schema - Zod schema for input validation
 * @param input - Input data to validate and process
 * @param handler - Function to handle the action
 * @returns ActionResult
 */
export async function publicAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  input: unknown,
  handler: (data: TInput) => Promise<TOutput>
): Promise<ActionResult<TOutput>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' };
  }

  try {
    const result = await handler(parsed.data);
    return { success: true, data: result };
  } catch (e) {
    console.error('Action error:', e);
    return { success: false, error: 'Something went wrong' };
  }
}

/**
 * Protected action wrapper (checks for authenticated user)
 * @param schema - Zod schema for input validation
 * @param input - Input data to validate and process
 * @param handler - Function to handle the action
 * @returns ActionResult
 */
export async function protectedAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  input: unknown,
  handler: (data: TInput, user: User) => Promise<TOutput>
): Promise<ActionResult<TOutput>> {
  try {
    const user = await requireUser();    

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Invalid input' };
    }

    const result = await handler(parsed.data, user);
    return { success: true, data: result };
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHORIZED') {
        return { success: false, error: 'Please log in' };
      }
    }
    console.error('Action error:', e);
    return { success: false, error: 'Something went wrong' };
  }
}

// Role-restricted action
export async function roleAction<TInput, TOutput>(
  roles: string | string[],
  schema: z.ZodSchema<TInput>,
  input: unknown,
  handler: (data: TInput, user: User) => Promise<TOutput>
): Promise<ActionResult<TOutput>> {
  try {
    const user = await requireRole(roles);

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Invalid input' };
    }

    const result = await handler(parsed.data, user);
    return { success: true, data: result };
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHORIZED') {
        return { success: false, error: 'Please log in' };
      }
      if (e.message === 'FORBIDDEN') {
        return { success: false, error: 'Access denied' };
      }
    }
    console.error('Action error:', e);
    return { success: false, error: 'Something went wrong' };
  }
}