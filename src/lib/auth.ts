import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '../../db/kysely/client';
import crypto from 'crypto';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user already exists by Google ID
          const existingUser = await db
            .selectFrom('user')
            .selectAll()
            .where('google_id', '=', profile?.sub || '')
            .executeTakeFirst();

          if (existingUser) {
            console.log('Found existing Google user:', existingUser.email, 'Status:', existingUser.account_status);
            // Check if user is approved (same logic as regular auth)
            if (existingUser.account_status !== 'active' && existingUser.requested_admin === false) {
              console.error('Account not active for Google user:', existingUser.email);
              return false; // Block sign-in for unapproved users
            }
            console.log('Google user approved, allowing sign-in');
            // User exists and is approved, allow sign in
            return true;
          }

          // Check if user exists by email (for account linking)
          const existingByEmail = await db
            .selectFrom('user')
            .selectAll()
            .where('email', '=', user.email || '')
            .executeTakeFirst();

          if (existingByEmail) {
            // Link Google account to existing user
            await db
              .updateTable('user')
              .set({
                google_id: profile?.sub || '',
                profile_picture_url: user.image || '',
                auth_provider: 'google'
              })
              .where('id', '=', existingByEmail.id)
              .execute();

            return true;
          }

          // Create new user - IMPORTANT: Set account_status to 'pending' for admin approval
          const userId = crypto.randomUUID();
          const authKeyId = crypto.randomUUID();
          
          const newUser = await db
            .insertInto('user')
            .values({
              id: userId,
              email: user.email || '',
              username: user.name || user.email?.split('@')[0] || '',
              google_id: profile?.sub || '',
              profile_picture_url: user.image || '',
              auth_provider: 'google',
              role: 'user',
              account_status: 'pending', // 🔥 ADMIN APPROVAL REQUIRED
              requested_admin: false,
              created_at: new Date()
            })
            .returning('id')
            .executeTakeFirst();

          if (!newUser?.id) {
            return false;
          }

          // Create auth_key entry (even though Google users don't have passwords)
          await db
            .insertInto('auth_key')
            .values({
              id: authKeyId,
              user_id: newUser.id,
              hashed_password: null, // Google users don't have passwords
              google_refresh_token: account.refresh_token || null,
              created_at: new Date()
            })
            .execute();

          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      console.log('Session callback - token.sub:', token?.sub);
      if (token?.sub) {
        // Get user from database
        const user = await db
          .selectFrom('user')
          .selectAll()
          .where('google_id', '=', token.sub)
          .executeTakeFirst();

        console.log('Session callback - user found:', user?.email, 'Status:', user?.account_status);
        if (user) {
          // Extend the session with additional user data
          const extendedSession = {
            ...session,
            user: {
              ...session.user,
              id: user.id,
              role: user.role,
              account_status: user.account_status
            }
          };
          console.log('Session callback - returning extended session:', extendedSession.user?.email);
          return extendedSession;
        }
      }
      console.log('Session callback - returning original session');
      return session;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback - account:', account?.provider, 'user:', user?.email);
      if (account?.provider === 'google' && user) {
        token.sub = account.providerAccountId; // Google user ID
        console.log('JWT callback - set token.sub to:', token.sub);
      }
      console.log('JWT callback - returning token with sub:', token.sub);
      return token;
    }
  },
  session: {
    strategy: 'jwt',
  },
};

export default NextAuth(authOptions);
