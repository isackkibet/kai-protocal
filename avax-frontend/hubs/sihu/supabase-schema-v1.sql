-- ==============================================================================
-- Sango Info Hub (SIHU) — Complete Database Schema (v1.0 PRD Specification)
-- Next.js 16, React 19, Supabase / PostgreSQL (pgvector)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. USER PROFILES & ROLES
-- Roles: reader, author, editor, moderator, admin, super_admin
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('reader', 'author', 'editor', 'moderator', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONTENT CATEGORIES (Normalized)
-- News, Community, Education, Health, Culture, Business, Technology, Government, Opportunities, Events, Announcements, Guides, Research
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TOPICS
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  followers_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUTHORS & ORGANIZATIONS
CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  avatar_url TEXT,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SOURCES & CITATIONS
-- Tracks provenance, authoritativeness, and reliability
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  publisher TEXT,
  url TEXT,
  source_type TEXT NOT NULL DEFAULT 'web' CHECK (source_type IN ('web', 'academic', 'government', 'press', 'report', 'interview', 'field_record')),
  published_at TIMESTAMPTZ,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  reliability_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. UNIFIED CONTENT ITEMS
-- Lifecycle: draft -> in_review -> changes_requested -> approved -> scheduled -> published -> archived
-- Verification status: unverified -> editorially_reviewed -> source_verified -> needs_update
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'news', 'guide', 'faq', 'announcement', 'event', 'podcast', 'video', 'document', 'report', 'interview', 'profile', 'opportunity')),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'changes_requested', 'approved', 'scheduled', 'published', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'editorially_reviewed', 'source_verified', 'needs_update')),
  reading_time_minutes INT DEFAULT 3,
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  bookmarks_count INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONTENT REVISIONS (Auditable version history)
CREATE TABLE IF NOT EXISTS content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  editor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  change_summary TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CONTENT SOURCES (Many-to-Many citations)
CREATE TABLE IF NOT EXISTS content_sources (
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  citation_note TEXT,
  PRIMARY KEY (content_item_id, source_id)
);

-- 10. CONTENT TAGS & TOPIC MAPPINGS
CREATE TABLE IF NOT EXISTS content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS content_item_tags (
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS content_item_topics (
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (content_item_id, topic_id)
);

-- 11. EVENTS SPECIFIC TABLE (Real Calendar Data)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
  location_name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  registration_url TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  organizer_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PODCAST SPECIFIC TABLE
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  episode_number INT,
  host TEXT,
  guests TEXT[],
  transcript TEXT,
  show_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. DOCUMENTS SPECIFIC TABLE
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_format TEXT NOT NULL DEFAULT 'PDF',
  extracted_text TEXT,
  version TEXT DEFAULT '1.0',
  review_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. USER PERSONALIZATION: BOOKMARKS, FOLLOWS, READING HISTORY
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_item_id)
);

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (topic_id IS NOT NULL OR author_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  read_percentage INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_item_id)
);

-- 15. AI KNOWLEDGE BASE & RETRIEVAL (pgvector)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL DEFAULT 0,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW vector search index
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_vector
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- Assistant Sessions & Messages
CREATE TABLE IF NOT EXISTS assistant_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_token TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES assistant_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  cited_sources JSONB DEFAULT '[]'::JSONB,
  feedback_rating INT, -- +1 for helpful, -1 for not helpful
  feedback_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. REPORTING & ISSUE MODERATION QUEUE
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  reporter_email TEXT,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('incorrect_info', 'broken_link', 'outdated_info', 'offensive_content', 'copyright', 'accessibility', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 17. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}'::JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. INDEXES FOR PERFORMANCE & FULL-TEXT SEARCH
CREATE INDEX IF NOT EXISTS idx_content_items_status_visibility ON content_items(status, visibility);
CREATE INDEX IF NOT EXISTS idx_content_items_slug ON content_items(slug);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_content_items_published_at ON content_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_verification ON content_items(verification_status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at ASC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Trigram search indexes for fuzzy & full-text match
CREATE INDEX IF NOT EXISTS idx_content_items_title_trgm ON content_items USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_content_items_body_trgm ON content_items USING gin (body gin_trgm_ops);

-- 19. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Baseline Public Read Query:
-- Published AND public AND published_at <= now() AND not expired
CREATE POLICY "Public published content items are viewable by all"
  ON content_items FOR SELECT
  USING (
    status = 'published'
    AND visibility = 'public'
    AND published_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY "Public categories, topics, authors, sources are viewable by all"
  ON content_categories FOR SELECT USING (true);

CREATE POLICY "Public topics viewable by all"
  ON topics FOR SELECT USING (true);

CREATE POLICY "Public authors viewable by all"
  ON authors FOR SELECT USING (true);

CREATE POLICY "Public sources viewable by all"
  ON sources FOR SELECT USING (true);

CREATE POLICY "Public events viewable by all"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_items ci
      WHERE ci.id = events.content_item_id
        AND ci.status = 'published'
        AND ci.visibility = 'public'
    )
  );

CREATE POLICY "Public podcast episodes viewable by all"
  ON podcast_episodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_items ci
      WHERE ci.id = podcast_episodes.content_item_id
        AND ci.status = 'published'
        AND ci.visibility = 'public'
    )
  );

CREATE POLICY "Public documents viewable by all"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_items ci
      WHERE ci.id = documents.content_item_id
        AND ci.status = 'published'
        AND ci.visibility = 'public'
    )
  );

-- Role-based editorial permissions:
-- Author, Editor, Admin, Super Admin can view all drafts
CREATE POLICY "Staff can view non-published content"
  ON content_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('author', 'editor', 'moderator', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Staff can insert content items"
  ON content_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('author', 'editor', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Staff can update content items"
  ON content_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('author', 'editor', 'admin', 'super_admin')
    )
  );

-- User bookmarks & reading history
CREATE POLICY "Users can manage own bookmarks"
  ON bookmarks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own reading history"
  ON reading_history FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Reporting issues: any user can insert a report
CREATE POLICY "Anyone can report an issue"
  ON reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Moderators can view and manage reports"
  ON reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('moderator', 'editor', 'admin', 'super_admin')
    )
  );
