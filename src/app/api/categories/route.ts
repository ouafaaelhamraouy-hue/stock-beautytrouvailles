import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userProfile || !userProfile.isActive) {
      return NextResponse.json({ error: 'User not active' }, { status: 403 });
    }

    if (!hasPermission(userProfile.role, 'PRODUCTS_CREATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Check if category with this name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    // Get user profile to check role (but don't block if it doesn't exist)
    let userProfile;
    try {
      userProfile = await prisma.user.findUnique({
        where: { id: user.id },
      });
    } catch (dbError) {
      console.error('Database error fetching user:', dbError);
      // Continue - we'll fetch categories anyway
    }

    // Only check permissions if user profile exists and is active
    // This allows the page to function even if user profile hasn't been created yet
    if (userProfile) {
      if (!userProfile.isActive) {
        return NextResponse.json({ error: 'User not active' }, { status: 403 });
      }

      if (!hasPermission(userProfile.role, 'PRODUCTS_READ')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch categories - allow even if user profile doesn't exist yet
    let categories;
    try {
      categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
      });
    } catch (dbError) {
      console.error('Database error fetching categories:', dbError);
      // Return empty array instead of error to allow page to function
      return NextResponse.json([]);
    }

    return NextResponse.json(categories || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return empty array instead of error to allow page to function
    return NextResponse.json([]);
  }
}
