import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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

    const pendingApproval = Boolean(user.user_metadata?.pending_approval);
    const inviteListRaw = process.env.SUPER_ADMIN_INVITE_EMAILS || '';
    const inviteEmails = inviteListRaw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const normalizedEmail = user.email?.trim().toLowerCase() || '';
    const isInvitedSuperAdmin = normalizedEmail.length > 0 && inviteEmails.includes(normalizedEmail);
    const defaultOrg = { name: 'BeautyTrouvailles', slug: 'beautytrouvailles' };

    // Get user profile from database
    try {
      const organization = await prisma.organization.upsert({
        where: { slug: defaultOrg.slug },
        update: {},
        create: { name: defaultOrg.name, slug: defaultOrg.slug },
      });

      const profile = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!profile) {
        // Create user profile if it doesn't exist
        try {
          const newProfile = await prisma.user.create({
            data: {
              id: user.id,
              email: user.email!,
              fullName: user.user_metadata?.full_name || null,
              role: isInvitedSuperAdmin ? 'SUPER_ADMIN' : 'STAFF',
              isActive: isInvitedSuperAdmin ? true : !pendingApproval,
              organizationId: organization.id,
            },
          });
          return NextResponse.json(newProfile);
        } catch (createError) {
          console.error('Error creating user profile:', createError);
          // Return a basic profile structure if database is unavailable
          return NextResponse.json({
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || null,
            role: isInvitedSuperAdmin ? 'SUPER_ADMIN' : 'STAFF',
            isActive: isInvitedSuperAdmin ? true : !pendingApproval,
            organizationId: organization.id,
          });
        }
      }

      const needsOrg = !profile.organizationId;
      const shouldPromoteToSuperAdmin = isInvitedSuperAdmin && profile.role !== 'SUPER_ADMIN';
      const shouldActivate = isInvitedSuperAdmin && !profile.isActive;

      if (needsOrg || shouldPromoteToSuperAdmin || shouldActivate) {
        const updatedProfile = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(needsOrg ? { organizationId: organization.id } : {}),
            ...(shouldPromoteToSuperAdmin ? { role: 'SUPER_ADMIN' } : {}),
            ...(shouldActivate ? { isActive: true } : {}),
          },
        });
        return NextResponse.json(updatedProfile);
      }

      return NextResponse.json(profile);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Return a basic profile structure if database is unavailable
      // This allows the app to work even if the database is temporarily unavailable
      return NextResponse.json({
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || null,
        role: 'STAFF',
        isActive: !pendingApproval,
      });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
