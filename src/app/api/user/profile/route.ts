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

    // Get user profile from database
    try {
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
              role: 'STAFF',
              isActive: true,
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
            role: 'STAFF',
            isActive: true,
          });
        }
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
        isActive: true,
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
