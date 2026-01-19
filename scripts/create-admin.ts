/**
 * Script to create an admin user
 * 
 * Usage:
 * 1. First, create a user in Supabase Auth dashboard
 * 2. Then run this script: npx tsx scripts/create-admin.ts <user-email>
 * 
 * Or use the API route: POST /api/admin/create-admin
 */

import { prisma } from '../src/lib/prisma';

async function createAdmin(email: string) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found in database.`);
      console.log('💡 Make sure to create the user in Supabase Auth first.');
      console.log('   Then the user profile will be auto-created on first login.');
      process.exit(1);
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   ID: ${updatedUser.id}`);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npx tsx scripts/create-admin.ts <user-email>');
  process.exit(1);
}

createAdmin(email);
