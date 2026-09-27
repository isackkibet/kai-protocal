import { NextResponse } from 'next/server';
import { contentRepo } from '@/lib/db/contentRepo';
import { unifiedContentService } from '@/services/unifiedContentService';
import { SearchFilterParams } from '@/types/contentHub';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const params: SearchFilterParams = {
      query: searchParams.get('q') || undefined,
      contentType: (searchParams.get('type') as any) || 'all',
      categorySlug: searchParams.get('category') || undefined,
      topicSlug: searchParams.get('topic') || undefined,
      verificationStatus: (searchParams.get('verification') as any) || undefined,
      location: searchParams.get('location') || undefined,
      sortBy: (searchParams.get('sort') as any) || 'newest',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    };

    // Try Neon Postgres first
    const dbItems = await contentRepo.getItems(params);
    if (dbItems && dbItems.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'neon-postgres',
        count: dbItems.length,
        data: dbItems,
      });
    }

    // Fallback to unified content service (seed / memory)
    const fallbackItems = await unifiedContentService.getContentItems(params);
    return NextResponse.json({
      success: true,
      source: 'seed-fallback',
      count: fallbackItems.length,
      data: fallbackItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
