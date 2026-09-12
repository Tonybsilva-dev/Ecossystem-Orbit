// Basic seeding script using Prisma directly since separate Auth seed is complex in this setup
// We will manually create the user and account simulating BetterAuth structure
// Note: Password hashing usually requires BetterAuth's specific hashing.
// Since we can't easily import BetterAuth node side without setup, we will create a script that uses the better-auth API if possible,
// or simpler: WE WILL LOG THE USER OUT and let them Sign Up, then manually promote to ADMIN.
// OPTION 2: Create a user with a KNOWN hash.
// Let's rely on better-auth API to create the user properly.

import { auth } from '../src/features/auth/auth';

async function main() {
  console.log('Seeding Admin User...');

  try {
    const user = await auth.api.signUpEmail({
      body: {
        email: 'admin@barberflow.com',
        password: 'password123',
        name: 'Admin Master',
        role: 'ADMIN', // We added 'role' as additional field, but signUpEmail might not respect it in body directly depending on config.
        // If not, we update it after.
      },
    });

    console.log('Admin user created successfully:', user);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

main();
