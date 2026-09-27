import { z } from 'zod';

export const ContentTypeEnum = z.enum([
  'article',
  'news',
  'guide',
  'faq',
  'announcement',
  'event',
  'podcast',
  'video',
  'document',
  'report',
  'interview',
  'profile',
  'opportunity',
]);

export const ContentStatusEnum = z.enum([
  'draft',
  'in_review',
  'changes_requested',
  'approved',
  'scheduled',
  'published',
  'archived',
]);

export const VerificationStatusEnum = z.enum([
  'unverified',
  'editorially_reviewed',
  'source_verified',
  'needs_update',
]);

export const SourceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'Source title is required'),
  publisher: z.string().optional(),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sourceType: z.enum(['web', 'academic', 'government', 'press', 'report', 'interview', 'field_record']).default('web'),
  publishedAt: z.string().optional(),
  reliabilityNotes: z.string().optional(),
  citationNote: z.string().optional(),
});

export const EventMetadataSchema = z.object({
  startsAt: z.string().datetime({ message: 'Valid ISO datetime required for startsAt' }),
  endsAt: z.string().datetime({ message: 'Valid ISO datetime required for endsAt' }).optional(),
  timezone: z.string().default('Africa/Nairobi'),
  locationName: z.string().min(2, 'Location name is required'),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  registrationUrl: z.string().url().optional().or(z.literal('')),
  isOnline: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  organizerName: z.string().optional(),
});

export const PodcastMetadataSchema = z.object({
  audioUrl: z.string().url('Valid audio URL required'),
  durationSeconds: z.number().int().nonnegative().default(0),
  episodeNumber: z.number().int().optional(),
  host: z.string().optional(),
  guests: z.array(z.string()).optional(),
  transcript: z.string().optional(),
  showNotes: z.string().optional(),
});

export const DocumentMetadataSchema = z.object({
  fileUrl: z.string().url('Valid document file URL required'),
  fileSizeBytes: z.number().int().optional(),
  fileFormat: z.string().default('PDF'),
  extractedText: z.string().optional(),
  version: z.string().default('1.0'),
  reviewDate: z.string().optional(),
});

export const CreateContentItemSchema = z.object({
  contentType: ContentTypeEnum,
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  subtitle: z.string().optional(),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters'),
  body: z.string().min(20, 'Body content must be at least 20 characters'),
  categorySlug: z.string().min(2),
  tags: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).default([]),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  featured: z.boolean().default(false),
  event: EventMetadataSchema.optional(),
  podcast: PodcastMetadataSchema.optional(),
  document: DocumentMetadataSchema.optional(),
});

export const UpdateContentItemSchema = CreateContentItemSchema.partial().extend({
  status: ContentStatusEnum.optional(),
  verificationStatus: VerificationStatusEnum.optional(),
  changeSummary: z.string().optional(),
});

export const ReportIssueSchema = z.object({
  contentItemId: z.string().min(1, 'Content item ID required'),
  reporterEmail: z.string().email().optional().or(z.literal('')),
  issueType: z.enum([
    'incorrect_info',
    'broken_link',
    'outdated_info',
    'offensive_content',
    'copyright',
    'accessibility',
    'other',
  ]),
  description: z.string().min(10, 'Please describe the issue in at least 10 characters'),
});

export const AssistantChatSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(2, 'Message cannot be empty'),
});

export const AssistantFeedbackSchema = z.object({
  messageId: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(-1)]),
  notes: z.string().optional(),
});
