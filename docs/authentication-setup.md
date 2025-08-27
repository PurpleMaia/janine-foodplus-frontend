# Authentication Setup Guide

This guide explains how to set up and use the authentication system for your kanban board.

## Overview

The authentication system provides:
- **Public View**: Read-only access to the kanban board for anyone
- **Admin View**: Full editing capabilities when logged in
- **Session Management**: Secure login/logout with "remember me" functionality

## Setup

### 1. Database Tables

The authentication system uses these PostgreSQL tables (which you've already created):

```sql
-- users
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- login methods (email/password)
CREATE TABLE IF NOT EXISTS auth_key (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  hashed_password TEXT
);

-- sessions
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
```

### 2. Create a Test User

Run the user creation script to create your first admin user:

```bash
# Make sure you have the DATABASE_URL environment variable set
export DATABASE_URL="postgres://postgres:94312229465d9b0153cc6513ecf4a62b@dokku-pmf-sandbox.westus2.cloudapp.azure.com:358/civtrack_dev"

# Run the script
node scripts/create-user.js
```

This will create a user with:
- Email: `admin@example.com`
- Password: `admin123`

### 3. Environment Variables

Make sure you have these environment variables set:

```bash
DATABASE_URL=postgres://postgres:94312229465d9b0153cc6513ecf4a62b@dokku-pmf-sandbox.westus2.cloudapp.azure.com:358/civtrack_dev
```

## Usage

### Public View (Not Logged In)

When users visit your site without logging in:
- They can see all bills and their current status
- They can search and filter bills
- They cannot drag and drop bills between columns
- They cannot edit any bill information
- They see a "Public View" message

### Admin View (Logged In)

When users log in:
- They have full access to all editing features
- They can drag and drop bills between columns
- They can update bill statuses
- They can access all admin functions
- They see their email in the top-right user menu

### Login/Logout

- **Login**: Click the "Login" button in the top-right corner
- **Logout**: Click your user avatar and select "Log out"

## Security Features

- Passwords are hashed using bcrypt
- Sessions are managed securely with Lucia
- No sensitive data is exposed to unauthenticated users
- CSRF protection built-in

## Customization

### Adding More Users

To add more users, you can either:
1. Modify the `scripts/create-user.js` script
2. Create users directly in your database
3. Build a user management interface

### Changing Session Duration

Edit `src/lib/auth.ts` to modify session settings:

```typescript
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false, // Change this to set session duration
  },
  // ... other options
});
```

### Adding User Roles

To implement different user roles (e.g., admin vs regular user), you can:
1. Add a `role` field to your user table
2. Modify the authentication context to include role information
3. Update the protected components to check for specific roles

## Troubleshooting

### Common Issues

1. **"Cannot find name 'readOnly'"**: Make sure you've updated all components with the readOnly prop
2. **Database connection errors**: Verify your DATABASE_URL is correct
3. **Login not working**: Check that the user exists in your database

### Testing

1. Test the public view by visiting without logging in
2. Test login with the credentials from the user creation script
3. Verify that drag and drop works when logged in
4. Verify that drag and drop is disabled when not logged in

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your database tables are set up correctly
3. Ensure all environment variables are set
4. Check that the authentication context is properly wrapped around your app
