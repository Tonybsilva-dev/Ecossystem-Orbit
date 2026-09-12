import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : import.meta.env.BETTER_AUTH_URL || 'http://localhost:5180',
});

export const { signIn, signOut, useSession, signUp } = authClient;
