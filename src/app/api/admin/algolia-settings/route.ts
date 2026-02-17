export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/algolia-settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const settings = await prisma.algoliaSettings.findFirst();

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching Algolia settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Algolia settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/algolia-settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    const settings = await prisma.algoliaSettings.upsert({
      where: { id: data.id || 'default' },
      update: {
        applicationId: data.applicationId,
        adminApiKey: data.adminApiKey,
        searchApiKey: data.searchApiKey,
        productIndexName: data.productIndexName || 'products',
        categoryIndexName: data.categoryIndexName || 'categories',
        enableTypoTolerance: data.enableTypoTolerance ?? true,
        enableSynonyms: data.enableSynonyms ?? true,
        enableRules: data.enableRules ?? true,
        customRanking: data.customRanking || [],
        searchableAttributes: data.searchableAttributes || [],
        facetAttributes: data.facetAttributes || [],
        enablePersonalization: data.enablePersonalization ?? false,
        enableABTesting: data.enableABTesting ?? false,
        autoSync: data.autoSync ?? true,
        syncFrequency: data.syncFrequency || 3600,
        isActive: data.isActive ?? true,
        updatedBy: session.user.id,
      },
      create: {
        id: 'default',
        applicationId: data.applicationId,
        adminApiKey: data.adminApiKey,
        searchApiKey: data.searchApiKey,
        productIndexName: data.productIndexName || 'products',
        categoryIndexName: data.categoryIndexName || 'categories',
        enableTypoTolerance: data.enableTypoTolerance ?? true,
        enableSynonyms: data.enableSynonyms ?? true,
        enableRules: data.enableRules ?? true,
        customRanking: data.customRanking || [],
        searchableAttributes: data.searchableAttributes || [],
        facetAttributes: data.facetAttributes || [],
        enablePersonalization: data.enablePersonalization ?? false,
        enableABTesting: data.enableABTesting ?? false,
        autoSync: data.autoSync ?? true,
        syncFrequency: data.syncFrequency || 3600,
        isActive: data.isActive ?? true,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error saving Algolia settings:', error);
    return NextResponse.json(
      { error: 'Failed to save Algolia settings', details: error.message },
      { status: 500 }
    );
  }
}
