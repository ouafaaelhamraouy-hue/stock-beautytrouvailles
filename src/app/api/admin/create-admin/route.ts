import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission, canManageRoles } from '@/lib/permissions';
import { UserRole } from '@prisma/client';

/**
 * API route to update a user's role
 * 
 * POST /api/admin/create-admin
 * Body: { email: string, role?: 'ADMIN' | 'STAFF' | 'SUPER_ADMIN' }
 * 
 * Requires authentication and USERS_MANAGE_ROLES permission
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

    // Check if current user has permission to manage roles
    const currentUserProfile = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!currentUserProfile || !currentUserProfile.isActive) {
      return NextResponse.json(
        { error: 'User not active' },
        { status: 403 }
      );
    }

    // Only users with USERS_MANAGE_ROLES permission can manage roles
    if (!hasPermission(currentUserProfile.role, 'USERS_MANAGE_ROLES')) {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can manage user roles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role = 'ADMIN' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if current user can assign the target role
    if (!canManageRoles(currentUserProfile.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to assign this role' },
        { status: 403 }
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

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: role as UserRole },
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
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
