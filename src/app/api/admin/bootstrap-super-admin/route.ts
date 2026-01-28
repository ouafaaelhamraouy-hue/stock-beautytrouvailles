import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * Bootstrap SUPER_ADMIN - One-time setup when no SUPER_ADMIN exists
 * 
 * POST /api/admin/bootstrap-super-admin
 * Body: { email: string } (optional - uses env var if not provided)
 * 
 * This endpoint:
 * 1. Checks if any SUPER_ADMIN exists
 * 2. If none exists, allows creating the first one
 * 3. Uses email from body or NEXT_PUBLIC_SUPER_ADMIN_EMAIL env var
 * 4. Only works if no SUPER_ADMIN exists (one-time bootstrap)
 */
export async function POST(request: Request) {
  try {
    // SECURITY: Require authentication
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. You must be logged in to bootstrap SUPER_ADMIN.' },
        { status: 401 }
      );
    }

    // SECURITY: Check if any SUPER_ADMIN already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { 
          error: 'SUPER_ADMIN already exists. Use /api/admin/create-admin to manage users.',
          existingSuperAdmin: existingSuperAdmin.email 
        },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    
    // SECURITY: Additional protection - require bootstrap secret in production
    // In development, allow any authenticated user
    // In production, require a secret token
    const bootstrapSecret = body.secret || request.headers.get('x-bootstrap-secret');
    const requiredSecret = process.env.BOOTSTRAP_SECRET;

    if (process.env.NODE_ENV === 'production' && requiredSecret) {
      if (!bootstrapSecret || bootstrapSecret !== requiredSecret) {
        return NextResponse.json(
          { error: 'Invalid bootstrap secret. Bootstrap is disabled in production without proper secret.' },
          { status: 403 }
        );
      }
    }

    // SECURITY: Only allow bootstrap if the requesting user is the target user OR if no users exist yet
    const email = body.email || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || authUser.email;
    
    // Check if email is in allowlist (if configured)
    const allowedEmails = process.env.BOOTSTRAP_ALLOWED_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];
    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
      return NextResponse.json(
        { error: 'Email not in bootstrap allowlist.' },
        { status: 403 }
      );
    }

    // Additional check: Only allow if requesting user is the target user OR if no users exist yet
    const totalUsers = await prisma.user.count();
    if (totalUsers > 0 && email !== authUser.email) {
      return NextResponse.json(
        { error: 'You can only bootstrap yourself as SUPER_ADMIN, or bootstrap must happen before any users exist.' },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { 
          error: 'Email is required. Provide it in the request body or set NEXT_PUBLIC_SUPER_ADMIN_EMAIL env var.' 
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: `User with email ${email} not found. Please create the user in Supabase Auth first, then log in once to create the profile.` 
        },
        { status: 404 }
      );
    }

    // Update user role to SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: UserRole.SUPER_ADMIN },
    });

    return NextResponse.json({
      success: true,
      message: `User ${email} is now SUPER_ADMIN`,
      user: {
        email: updatedUser.email,
        role: updatedUser.role,
        id: updatedUser.id,
      },
    });
  } catch (error: unknown) {
    console.error('Error bootstrapping SUPER_ADMIN:', error);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
