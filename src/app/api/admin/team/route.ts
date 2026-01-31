import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

const ROLE_VALUES = ['SUPER_ADMIN', 'ADMIN', 'STAFF'] as const;

function getInviteEmails() {
  const raw = process.env.SUPER_ADMIN_INVITE_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        isActive: true,
        organizationId: true,
      },
    });

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: 'User not active' }, { status: 403 });
    }

    if (!hasPermission(currentUser.role, 'USERS_MANAGE_ROLES')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!currentUser.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const members = await prisma.user.findMany({
      where: { organizationId: currentUser.organizationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      members,
      inviteEmails: getInviteEmails(),
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        isActive: true,
        organizationId: true,
      },
    });

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: 'User not active' }, { status: 403 });
    }

    if (!hasPermission(currentUser.role, 'USERS_MANAGE_ROLES')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, role, isActive } = body as {
      id?: string;
      role?: (typeof ROLE_VALUES)[number];
      isActive?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    if (role === undefined && isActive === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    if (role && !ROLE_VALUES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
        role: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.organizationId !== currentUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (targetUser.id === currentUser.id) {
      if (role && role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'You cannot remove your own super admin role' },
          { status: 400 }
        );
      }
      if (isActive === false) {
        return NextResponse.json(
          { error: 'You cannot deactivate your own account' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(role ? { role } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ member: updatedUser });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
