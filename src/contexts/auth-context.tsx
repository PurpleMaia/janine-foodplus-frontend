'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { User } from '@/lib/simple-auth';


type Role = 'intern' | 'supervisor' | 'admin';
type AppUser = User & { role?: Role };



interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (authString: string, password: string) => Promise<{ success: boolean, error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Update user state when NextAuth session changes
  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
    } else if (session?.user) {
      // Convert NextAuth session to our User type
      setUser({
        id: session.user.id,
        email: session.user.email,
        username: session.user.name || '',
        role: session.user.role || 'user'
      });
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [session, status]);

  /**
   * Logs in a user with the given credentials.
   * @param authString - The email/username of the user.
   * @param password - The password of the user.
   * @returns An object containing the success status and an optional error message.
   */
  const login = async (authString: string, password: string): Promise<{ success: boolean, error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authString, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return {
          success: true
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Login error'
      };
    }
  };

  /**
   * Logs out the current user by calling the logout API and clearing the user state.
   */
  const logout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Registers a new user.
   * @param email - The email of the user.
   * @param username - The username of the user.
   * @param password - The password of the user.
   * @returns A boolean indicating whether the registration was successful.
   */
  const register = async (email: string, username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        // setUser(data.user);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData.error);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

