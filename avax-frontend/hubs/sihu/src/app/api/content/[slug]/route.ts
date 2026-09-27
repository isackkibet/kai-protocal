import { NextResponse } from 'next/server';
import { contentRepo } from '@/lib/db/contentRepo';
import { unifiedContentService } from '@/services/unifiedContentService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Try Neon Postgres first
    const dbItem = await contentRepo.getBySlug(slug);
    if (dbItem) {
      return NextResponse.json({
        success: true,
        source: 'neon-postgres',
        data: dbItem,
      });
    }

    // Fallback to local storage / seed
    const item = await unifiedContentService.getItemBySlug(slug);
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Content item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'seed-fallback',
      data: item,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
