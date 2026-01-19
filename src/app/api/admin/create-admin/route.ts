import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * API route to create an admin user
 * 
 * POST /api/admin/create-admin
 * Body: { email: string }
 * 
 * Requires authentication - only existing admins can create new admins
 * Or you can call this directly after creating a user in Supabase Auth
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if current user is admin (optional - remove this check if you want to allow anyone to create admin)
    const currentUserProfile = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    // Optional: Uncomment to restrict admin creation to existing admins
    // if (currentUserProfile?.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Forbidden: Only admins can create admin users' },
    //     { status: 403 }
    //   );
    // }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: `User with email ${email} not found. Please create the user in Supabase Auth first, then log in once to create the profile.` },
        { status: 404 }
      );
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    return NextResponse.json({
      success: true,
      user: {
        email: updatedUser.email,
        role: updatedUser.role,
        id: updatedUser.id,
      },
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
