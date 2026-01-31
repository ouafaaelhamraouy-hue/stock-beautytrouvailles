import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// Default settings from Excel Charges sheet
const DEFAULT_SETTINGS = {
  packagingCostPlastic: '1.50',
  packagingCostCarton: '6.00',
  packagingCostStickers: '0.50',
  packagingCostTotal: '8.00',
  adsCostMonthly: '150.00',
  exchangeRateEurToMad: '10.85',
};

async function getOrCreateSetting(key: string, defaultValue: string, organizationId: string) {
  let setting = await prisma.setting.findFirst({
    where: { key, organizationId },
  });

  if (!setting) {
    setting = await prisma.setting.create({
      data: { key, value: defaultValue, organizationId },
    });
  }

  return setting;
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

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userProfile || !userProfile.isActive) {
      return NextResponse.json({ error: 'User not active' }, { status: 403 });
    }
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    if (!hasPermission(userProfile.role, 'SETTINGS_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all settings, create defaults if they don't exist
    const settingsPromises = Object.entries(DEFAULT_SETTINGS).map(([key, defaultValue]) =>
      getOrCreateSetting(key, defaultValue, userProfile.organizationId)
    );

    const settingsArray = await Promise.all(settingsPromises);

    // Convert to key-value object
    const settings = settingsArray.reduce((acc, setting) => {
      acc[setting.key] = parseFloat(setting.value);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    // Only SUPER_ADMIN can update settings
    if (!hasPermission(userProfile.role, 'SETTINGS_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updates = body.settings as Record<string, number>;

    // Validate that only known settings are being updated
    const validKeys = Object.keys(DEFAULT_SETTINGS);
    const invalidKeys = Object.keys(updates).filter(key => !validKeys.includes(key));

    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Invalid settings keys: ${invalidKeys.join(', ')}` },
        { status: 400 }
      );
    }

    // Update each setting
    const updatePromises = Object.entries(updates).map(async ([key, value]) => {
      const existing = await prisma.setting.findFirst({
        where: { key, organizationId: userProfile.organizationId },
      });
      if (existing) {
        await prisma.setting.update({
          where: { id: existing.id },
          data: { value: value.toString() },
        });
      } else {
        await prisma.setting.create({
          data: { key, value: value.toString(), organizationId: userProfile.organizationId },
        });
      }
    });

    await Promise.all(updatePromises);

    // Fetch updated settings
    const settingsArray = await prisma.setting.findMany({
      where: { key: { in: validKeys }, organizationId: userProfile.organizationId },
    });

    const settings = settingsArray.reduce((acc, setting) => {
      acc[setting.key] = parseFloat(setting.value);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
