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