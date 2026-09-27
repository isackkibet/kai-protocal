import { getDb } from '@/lib/db';
import {
  UnifiedContentItem,
  SearchFilterParams,
  ContentStatus,
  VerificationStatus,
  ContentRevision,
} from '@/types/contentHub';

export const contentRepo = {
  /**
   * Fetch content items from Neon Postgres
   */
  async getItems(params?: SearchFilterParams): Promise<UnifiedContentItem[] | null> {
    const sql = getDb();
    if (!sql) return null;

    try {
      // Dynamic query using Neon parameterized tags
      let queryStr = `
        SELECT 
          c.id, c.content_type as "contentType", c.slug, c.title, c.subtitle,
          c.excerpt, c.body, c.status, c.visibility, c.cover_image_url as "coverImageUrl",
          c.featured, c.verification_status as "verificationStatus",
          c.reading_time_minutes as "readingTimeMinutes", c.views_count as "viewsCount",
          c.likes_count as "likesCount", c.bookmarks_count as "bookmarksCount",
          c.published_at as "publishedAt", c.reviewed_at as "reviewedAt",
          c.created_at as "createdAt", c.updated_at as "updatedAt",
          cat.slug as "categorySlug", cat.name as "categoryName",
          a.name as "authorName", a.title as "authorTitle", a.avatar_url as "authorAvatarUrl",
          e.starts_at as "eventStartsAt", e.ends_at as "eventEndsAt", e.timezone as "eventTimezone",
          e.location_name as "eventLocationName", e.address as "eventAddress", e.registration_url as "eventRegistrationUrl",
          e.is_online as "eventIsOnline",
          p.audio_url as "podcastAudioUrl", p.duration_seconds as "podcastDurationSeconds",
          p.episode_number as "podcastEpisodeNumber", p.host as "podcastHost", p.transcript as "podcastTranscript",
          d.file_url as "documentFileUrl", d.file_size_bytes as "documentFileSizeBytes",
          d.file_format as "documentFileFormat", d.version as "documentVersion"
        FROM content_items c
        LEFT JOIN content_categories cat ON c.category_id = cat.id
        LEFT JOIN authors a ON c.author_id = a.id
        LEFT JOIN events e ON c.id = e.content_item_id
        LEFT JOIN podcast_episodes p ON c.id = p.content_item_id
        LEFT JOIN documents d ON c.id = d.content_item_id
        WHERE 1=1
      `;

      if (params?.contentType && params.contentType !== 'all') {
        queryStr += ` AND c.content_type = '${params.contentType.replace(/'/g, "''")}'`;
      }

      if (params?.categorySlug && params.categorySlug !== 'all') {
        queryStr += ` AND cat.slug = '${params.categorySlug.replace(/'/g, "''")}'`;
      }

      if (params?.verificationStatus && params.verificationStatus !== 'all') {
        queryStr += ` AND c.verification_status = '${params.verificationStatus.replace(/'/g, "''")}'`;
      }

      if (params?.query) {
        const cleanQ = params.query.replace(/'/g, "''");
        queryStr += ` AND (c.title ILIKE '%${cleanQ}%' OR c.excerpt ILIKE '%${cleanQ}%' OR c.body ILIKE '%${cleanQ}%')`;
      }

      if (params?.sortBy === 'newest') {
        queryStr += ` ORDER BY COALESCE(c.published_at, c.created_at) DESC`;
      } else if (params?.sortBy === 'popular') {
        queryStr += ` ORDER BY (c.views_count + c.bookmarks_count * 5) DESC`;
      } else {
        queryStr += ` ORDER BY c.created_at DESC`;
      }

      if (params?.limit) {
        queryStr += ` LIMIT ${Number(params.limit)}`;
      }

      const rows: any[] = await (sql as any)(queryStr);

      return rows.map((r) => this.mapRowToItem(r));
    } catch (e) {
      console.warn('[Neon Postgres] Falling back from database query:', e);
      return null;
    }
  },

  /**
   * Get single item by slug
   */
  async getBySlug(slug: string): Promise<UnifiedContentItem | null> {
    const sql = getDb();
    if (!sql) return null;

    try {
      const rows = await sql`
        SELECT 
          c.id, c.content_type as "contentType", c.slug, c.title, c.subtitle,
          c.excerpt, c.body, c.status, c.visibility, c.cover_image_url as "coverImageUrl",
          c.featured, c.verification_status as "verificationStatus",
          c.reading_time_minutes as "readingTimeMinutes", c.views_count as "viewsCount",
          c.likes_count as "likesCount", c.bookmarks_count as "bookmarksCount",
          c.published_at as "publishedAt", c.reviewed_at as "reviewedAt",
          c.created_at as "createdAt", c.updated_at as "updatedAt",
          cat.slug as "categorySlug", cat.name as "categoryName",
          a.name as "authorName", a.title as "authorTitle", a.avatar_url as "authorAvatarUrl",
          e.starts_at as "eventStartsAt", e.ends_at as "eventEndsAt", e.timezone as "eventTimezone",
          e.location_name as "eventLocationName", e.address as "eventAddress", e.registration_url as "eventRegistrationUrl",
          e.is_online as "eventIsOnline",
          p.audio_url as "podcastAudioUrl", p.duration_seconds as "podcastDurationSeconds",
          p.episode_number as "podcastEpisodeNumber", p.host as "podcastHost", p.transcript as "podcastTranscript",
          d.file_url as "documentFileUrl", d.file_size_bytes as "documentFileSizeBytes",
          d.file_format as "documentFileFormat", d.version as "documentVersion"
        FROM content_items c
        LEFT JOIN content_categories cat ON c.category_id = cat.id
        LEFT JOIN authors a ON c.author_id = a.id
        LEFT JOIN events e ON c.id = e.content_item_id
        LEFT JOIN podcast_episodes p ON c.id = p.content_item_id
        LEFT JOIN documents d ON c.id = d.content_item_id
        WHERE c.slug = ${slug} OR c.id::text = ${slug}
        LIMIT 1;
      `;

      if (rows.length === 0) return null;
      return this.mapRowToItem(rows[0]);
    } catch (e) {
      console.warn('[Neon Postgres] Query failed for slug:', slug, e);
      return null;
    }
  },

  /**
   * Map database row to domain UnifiedContentItem
   */
  mapRowToItem(r: any): UnifiedContentItem {
    return {
      id: String(r.id),
      contentType: r.contentType,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      excerpt: r.excerpt,
      body: r.body,
      status: r.status,
      visibility: r.visibility,
      coverImageUrl: r.coverImageUrl,
      featured: Boolean(r.featured),
      verificationStatus: r.verificationStatus,
      readingTimeMinutes: r.readingTimeMinutes || 3,
      viewsCount: r.viewsCount || 0,
      likesCount: r.likesCount || 0,
      bookmarksCount: r.bookmarksCount || 0,
      publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : undefined,
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      categorySlug: r.categorySlug,
      category: r.categorySlug ? { id: r.categorySlug, slug: r.categorySlug, name: r.categoryName || r.categorySlug } : undefined,
      author: r.authorName ? { id: 'auth-db', slug: 'author', name: r.authorName, title: r.authorTitle, avatarUrl: r.authorAvatarUrl, isVerified: true } : undefined,
      tags: [],
      topics: [],
      sources: [],
      event: r.eventStartsAt
        ? {
            startsAt: new Date(r.eventStartsAt).toISOString(),
            endsAt: r.eventEndsAt ? new Date(r.eventEndsAt).toISOString() : undefined,
            timezone: r.eventTimezone || 'Africa/Nairobi',
            locationName: r.eventLocationName || 'Kisumu',
            address: r.eventAddress,
            registrationUrl: r.eventRegistrationUrl,
            isOnline: Boolean(r.eventIsOnline),
          }
        : undefined,
      podcast: r.podcastAudioUrl
        ? {
            audioUrl: r.podcastAudioUrl,
            durationSeconds: r.podcastDurationSeconds || 0,
            episodeNumber: r.podcastEpisodeNumber,
            host: r.podcastHost,
            transcript: r.podcastTranscript,
          }
        : undefined,
      document: r.documentFileUrl
        ? {
            fileUrl: r.documentFileUrl,
            fileSizeBytes: r.documentFileSizeBytes,
            fileFormat: r.documentFileFormat || 'PDF',
            version: r.documentVersion || '1.0',
          }
        : undefined,
    };
  },
};
