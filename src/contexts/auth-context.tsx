'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/lib/simple-auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdopted: boolean | null; // null = not checked yet, true/false = checked
  login: (authString: string, password: string) => Promise<{ success: boolean, error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<{ success: boolean, error?: string }>;
  checkSession: () => Promise<void>;
  checkAdoptionStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdopted, setIsAdopted] = useState<boolean | null>(null);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Check adoption status when user changes
  useEffect(() => {
    if (user) {
      checkAdoptionStatus();
    } else {
      setIsAdopted(null);
    }
  }, [user]);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          setIsAdopted(null);
        }
      } else {
        setUser(null);
        setIsAdopted(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
      setIsAdopted(null);
    } finally {
      setLoading(false);
    }
  };

  const checkAdoptionStatus = async () => {
    try {
      // Only check for interns (role === 'user')
      if (!user || user.role !== 'user') {
        setIsAdopted(true); // Supervisors/admins have full permissions
        return;
      }

      const response = await fetch('/api/user/adoption-status');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAdopted(data.isAdopted);
        } else {
          setIsAdopted(false);
        }
      } else {
        setIsAdopted(false);
      }
    } catch (error) {
      console.error('Adoption status check error:', error);
      setIsAdopted(false);
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
        // Check adoption status after login
        if (data.user) {
          await checkAdoptionStatus();
        }
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
   * @returns An object indicating whether the registration was successful and an optional error message.
   */
  const register = async (email: string, username: string, password: string): Promise<{ success: boolean, error?: string }> => {
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
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData.error);
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdopted, login, logout, register, checkSession, checkAdoptionStatus }}>
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

