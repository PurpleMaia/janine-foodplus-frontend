'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/lib/simple-auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (authString: string, password: string) => Promise<{ success: boolean, error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<boolean>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

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
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
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
    <AuthContext.Provider value={{ user, loading, login, logout, register, checkSession }}>
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

