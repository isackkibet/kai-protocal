import { ContentCategory, Topic, UnifiedContentItem } from '@/types/contentHub';

export const SEED_CATEGORIES: ContentCategory[] = [
  { id: 'cat-news', slug: 'news', name: 'News', description: 'Real-time journalistic dispatches and updates across the basin', icon: 'Newspaper' },
  { id: 'cat-community', slug: 'community', name: 'Community', description: 'Grassroots assembly reports, youth initiatives, and social programs', icon: 'Users' },
  { id: 'cat-education', slug: 'education', name: 'Education', description: 'Educational curriculum, vocational resources, and workshops', icon: 'GraduationCap' },
  { id: 'cat-health', slug: 'health', name: 'Health', description: 'Public health advisories, water sanitation, and clinic networks', icon: 'HeartPulse' },
  { id: 'cat-culture', slug: 'culture', name: 'Culture', description: 'Heritage preservation, indigenous traditions, and storytelling', icon: 'Sparkles' },
  { id: 'cat-business', slug: 'business', name: 'Business', description: 'MSME trade, agricultural markets, and financial cooperatives', icon: 'Briefcase' },
  { id: 'cat-technology', slug: 'technology', name: 'Technology', description: 'Civic tech, digital ledger verification, and solar infrastructure', icon: 'Cpu' },
  { id: 'cat-government', slug: 'government', name: 'Government', description: 'Gazette notices, county legislation, and environmental charters', icon: 'Landmark' },
  { id: 'cat-opportunities', slug: 'opportunities', name: 'Opportunities', description: 'Grants, fellowships, tenders, and youth employment calls', icon: 'Award' },
  { id: 'cat-events', slug: 'events', name: 'Events', description: 'Townhalls, symposiums, tree-planting days, and cultural fairs', icon: 'Calendar' },
  { id: 'cat-announcements', slug: 'announcements', name: 'Announcements', description: 'Official bulletins and urgent stakeholder notifications', icon: 'Bell' },
  { id: 'cat-guides', slug: 'guides', name: 'Guides', description: 'Practical handbook walkthroughs, compliance checklists, and guides', icon: 'BookOpen' },
  { id: 'cat-research', slug: 'research', name: 'Research', description: 'Peer-reviewed studies, limnological data, and biodiversity indices', icon: 'FileText' },
];

export const SEED_TOPICS: Topic[] = [
  { id: 'top-riparian', slug: 'riparian-conservation', name: 'Riparian Conservation', description: 'Wetland buffers, indigenous bamboo planting, and shoreline defense', icon: 'TreePine', followersCount: 420 },
  { id: 'top-chama', slug: 'chama-finances', name: 'Chama & Savings Groups', description: 'Table banking, micro-credit protocols, and savings cooperatives', icon: 'Coins', followersCount: 310 },
  { id: 'top-water', slug: 'water-security', name: 'Water Security', description: 'Lake Victoria water quality monitoring and filtration systems', icon: 'Droplets', followersCount: 560 },
  { id: 'top-msme', slug: 'msme-growth', name: 'MSME Growth', description: 'Cross-border commerce, value addition, and trade logistics', icon: 'TrendingUp', followersCount: 290 },
  { id: 'top-digital-trust', slug: 'digital-trust', name: 'Digital Trust & Proof', description: 'Cryptographic attestation, verified records, and open data', icon: 'ShieldCheck', followersCount: 180 },
];

export const SEED_CONTENT_ITEMS: UnifiedContentItem[] = [
  {
    id: 'sihu-art-01',
    contentType: 'article',
    slug: 'lake-victoria-water-hyacinth-biogas-breakthrough',
    title: 'Biogas Innovation Turns Lake Victoria Hyacinth Bloom into Household Energy in Kisumu',
    subtitle: 'Community bio-digesters in Dunga Beach transform invasive weed into clean cooking fuel for 600 households',
    excerpt: 'A collaborative project between lakeside youth cooperatives and environmental scientists is turning water hyacinth into compressed biogas, cutting charcoal reliance and restoring fish breeding coves.',
    body: `### The Weed Problem Turned Green Asset

For over three decades, the seasonal spread of water hyacinth (*Pontederia crassipes*) across the Winam Gulf has choked fishing channels, crippled local boat transport, and diminished dissolved oxygen levels in tilapia breeding grounds.

However, a newly commissioned biogas collective at Dunga Beach is reversing this narrative. The pilot facility harvests up to 8 tonnes of fresh biomass weekly, converting it in dual anaerobic digesters into pressurized methane suitable for domestic cylinders and village micro-grids.

#### Key Economic and Ecological Impacts
1. **Household Savings**: Local households purchasing hyacinth-derived gas canisters report a 42% decrease in monthly cooking energy expenses compared to kerosene or charcoal.
2. **Fish Habitat Recovery**: The cleared shoreline has seen a recorded 18% resurgence in localized juvenile cichlid and tilapia populations over six months.
3. **Bio-fertilizer Byproduct**: Digestate effluent rich in nitrogen and potassium is dried and distributed to riparian agro-forestry farmers as organic soil conditioner.

According to Dr. Grace Otieno, lead environmental hydrologist on the project:
> "We are not just removing an ecological nuisance; we are creating a circular economic loop where restoration generates direct monetary savings and dignified jobs for youth boat crews."

#### Scalability and Future Expansion
Phase two of the program targets Homa Bay and Siaya County landing beaches, aiming to connect 2,400 additional homes before the end of the year.`,
    status: 'published',
    visibility: 'public',
    category: SEED_CATEGORIES[0],
    categorySlug: 'news',
    author: {
      id: 'auth-1',
      slug: 'grace-otieno',
      name: 'Dr. Grace Otieno',
      title: 'Senior Limnologist & Environmental Policy Fellow',
      bio: 'Leading freshwater ecological research and community-managed conservation initiatives across Western Kenya.',
      avatarUrl: '/images/authors/grace.jpg',
      isVerified: true,
    },
    organization: {
      id: 'org-1',
      slug: 'lake-basin-clean-energy-initiative',
      name: 'Lake Basin Clean Energy Initiative',
      description: 'Regional consortium driving low-carbon community transitions.',
    },
    coverImageUrl: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    verificationStatus: 'source_verified',
    readingTimeMinutes: 5,
    viewsCount: 3840,
    likesCount: 245,
    bookmarksCount: 89,
    publishedAt: '2026-09-20T08:00:00Z',
    reviewedAt: '2026-09-20T07:15:00Z',
    updatedAt: '2026-09-20T08:00:00Z',
    createdAt: '2026-09-18T14:20:00Z',
    tags: ['Biogas', 'Lake Victoria', 'Water Hyacinth', 'Circular Economy', 'Renewables'],
    topics: [SEED_TOPICS[0], SEED_TOPICS[2]],
    sources: [
      {
        id: 'src-1',
        title: 'Lake Victoria Basin Water Quality and Aquatic Ecology Review',
        publisher: 'Kenya Marine and Fisheries Research Institute (KMFRI)',
        url: 'https://kmfri.go.ke',
        sourceType: 'government',
        publishedAt: '2026-08-15',
        reliabilityNotes: 'Official peer-reviewed survey and water sample analysis data.',
      },
      {
        id: 'src-2',
        title: 'Anaerobic Digestion of Invasive Aquatic Weeds: Technical Feasibility',
        publisher: 'Journal of Sustainable African Bioenergy',
        url: 'https://example.org/bioenergy-hyacinth',
        sourceType: 'academic',
        publishedAt: '2026-04-10',
        reliabilityNotes: 'Academic laboratory evaluation of chemical methane potential.',
      }
    ],
  },
  {
    id: 'sihu-guide-01',
    contentType: 'guide',
    slug: 'riparian-buffer-zone-restoration-handbook',
    title: 'Riparian Buffer Zone Restoration: Step-by-Step Guide for Shoreline Farmers',
    subtitle: 'Practical instructions for demarcating the 30-meter boundary, stabilizing banks with giant bamboo, and maintaining agroforestry tree cover',
    excerpt: 'Comprehensive guide for landowners and community self-help groups on establishing resilient riparian vegetation barriers to prevent siltation, maintain clean water, and access carbon incentives.',
    body: `### Why Riparian Buffer Zones Matter

Riparian buffer zones are strips of vegetated land adjacent to streams, rivers, and lake shorelines. When properly planted with deep-rooting species, they filter agricultural runoff, trap sediment before it enters the water table, prevent disastrous bank erosion, and provide shade that lowers water temperatures for aquatic species.

---

### Step 1: Legal Demarcation and Soil Survey
- Under the National Water Act and regional bylaws, measure a continuous **30-meter buffer strip** starting from the highest recorded high-water mark of the lake or riverbed.
- Avoid all tilling, synthetic pesticide application, or permanent building construction inside this 30-meter strip.
- Test the soil pH and drainage: sandy-loam shoreline soils benefit from initial legume cover cropping (*Desmodium* or *Mucuna*) to build organic matter.

---

### Step 2: Selecting Native and High-Value Permitted Species
To create multi-tier protection, plant three distinct vegetation strata:
1. **Waterline Tier (0 - 5m)**: Vetiver grass (*Chrysopogon zizanioides*) and sedges to anchor immediate mud banks.
2. **Intermediate Tier (5 - 18m)**: Non-invasive Clumping Bamboo (*Dendrocalamus asper* or *Bambusa balcooa*). Space clumps 5m x 5m.
3. **Upper Agroforestry Tier (18 - 30m)**: Indigenous hardwoods and nitrogen-fixing trees such as *Markhamia lutea*, *Sesbania sesban*, and *Prunus africana*.

---

### Step 3: Planting and Irrigation Management
- Dig planting pits of 60cm x 60cm x 60cm.
- Mix excavated topsoil with 10kg of cured compost or farmyard manure.
- Plant early during the onset of the long rains (March-April or October-November) to ensure root establishment before the dry spell.
- Implement mulching using dry grass to conserve soil moisture.

---

### Step 4: Verification and Carbon Incentive Tracking
- Record seedling GPS coordinates and take photo verification milestones at 3, 6, and 12 months.
- Submit survival metrics to the local Community Forest Association (CFA) or Sango Info Hub field desk to register for community incentive payouts.`,
    status: 'published',
    visibility: 'public',
    category: SEED_CATEGORIES[11],
    categorySlug: 'guides',
    author: {
      id: 'auth-2',
      slug: 'dennis-mwangi',
      name: 'Dennis Mwangi',
      title: 'Agroforestry Field Coordinator',
      bio: 'Over 12 years of hands-on experience guiding community conservation groups across East African wetlands.',
      avatarUrl: '/images/authors/dennis.jpg',
      isVerified: true,
    },
    coverImageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    verificationStatus: 'source_verified',
    readingTimeMinutes: 7,
    viewsCount: 2190,
    likesCount: 180,
    bookmarksCount: 142,
    publishedAt: '2026-09-15T09:00:00Z',
    reviewedAt: '2026-09-14T16:00:00Z',
    updatedAt: '2026-09-15T09:00:00Z',
    createdAt: '2026-09-12T11:00:00Z',
    tags: ['Guides', 'Agroforestry', 'Riparian Buffer', 'Bamboo Planting', 'Soil Conservation'],
    topics: [SEED_TOPICS[0]],
    sources: [
      {
        id: 'src-guide-1',
        title: 'National Guidelines for Riparian Zone Management',
        publisher: 'National Environment Management Authority (NEMA)',
        url: 'https://nema.go.ke',
        sourceType: 'government',
        publishedAt: '2025-06-20',
        reliabilityNotes: 'Official regulatory guidelines for riparian conservation.',
      }
    ],
  },
  {
    id: 'sihu-event-01',
    contentType: 'event',
    slug: 'lake-victoria-basin-youth-climate-summit-2026',
    title: 'Lake Victoria Basin Youth Climate Action & Ecological Summit 2026',
    subtitle: 'Annual gathering of over 350 community conservationists, digital hub operators, and sustainable innovators in Kisumu',
    excerpt: 'Join frontline climate leaders, innovators, and community custodians for two days of keynotes, tech workshops, tree-planting fieldwork, and networking.',
    body: `The 2026 Lake Victoria Basin Youth Climate Action Summit brings together grassroots organizers, environmental researchers, civic tech builders, and local government leaders to coordinate practical conservation efforts across the riparian corridor.

### Program Highlights:
- **Day 1 (Morning)**: Keynote address on decentralized environmental data and community-led river monitoring.
- **Day 1 (Afternoon)**: Technical workshops on solar micro-grids, water sanitation testing, and Chama table-banking integration.
- **Day 2 (Full Day)**: Hands-on restoration field excursion at Winam Gulf with a target of planting 5,000 indigenous bamboo and fruit tree seedlings.

Registration is free for accredited youth community delegates, with transport stipends available upon application.`,
    status: 'published',
    visibility: 'public',
    category: SEED_CATEGORIES[9],
    categorySlug: 'events',
    author: {
      id: 'auth-1',
      slug: 'grace-otieno',
      name: 'Dr. Grace Otieno',
      title: 'Senior Limnologist',
      isVerified: true,
    },
    coverImageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    verificationStatus: 'editorially_reviewed',
    readingTimeMinutes: 3,
    viewsCount: 1540,
    likesCount: 98,
    bookmarksCount: 76,
    publishedAt: '2026-09-18T10:00:00Z',
    reviewedAt: '2026-09-18T09:30:00Z',
    updatedAt: '2026-09-18T10:00:00Z',
    createdAt: '2026-09-17T08:00:00Z',
    tags: ['Events', 'Climate Action', 'Youth Empowerment', 'Kisumu', 'Workshops'],
    topics: [SEED_TOPICS[0], SEED_TOPICS[3]],
    sources: [
      {
        id: 'src-evt-1',
        title: 'Kisumu County Department of Green Energy & Environment Event Calender',
        publisher: 'County Government of Kisumu',
        url: 'https://kisumu.go.ke/environment',
        sourceType: 'government',
      }
    ],
    event: {
      startsAt: '2026-10-14T09:00:00+03:00',
      endsAt: '2026-10-15T17:00:00+03:00',
      timezone: 'Africa/Nairobi',
      locationName: 'Kisumu Social Hall & Convention Centre',
      address: 'Jomo Kenyatta Highway, Kisumu City, Kenya',
      latitude: -0.0917,
      longitude: 34.7680,
      registrationUrl: 'https://sihu.com/events/register/climate-summit-2026',
      isOnline: false,
      organizerName: 'Sango Info Hub Organizing Committee',
    },
  },
  {
    id: 'sihu-event-02',
    contentType: 'event',
    slug: 'virtual-masterclass-chama-bookkeeping-microfinance',
    title: 'Virtual Masterclass: Modern Bookkeeping and Financial Transparency for Chamas',
    subtitle: 'A practical 90-minute digital workshop for group treasurers, secretaries, and village savings officers',
    excerpt: 'Learn how to streamline monthly record-keeping, automate member contribution receipts, and eliminate bookkeeping reconciliation disputes using modern digital tools.',
    body: `Designed specifically for treasurers and chairpersons of village savings and loan associations (VSLAs), self-help groups, and agricultural chamas across the basin.

Topics covered include:
- Digital loan tracking and interest calculation formulas.
- Maintaining auditable meeting ledgers that any member can review.
- Preventing fraud and cash-handling discrepancies.
- Live Q&A with certified financial cooperative auditors.`,
    status: 'published',
    visibility: 'public',
    category: SEED_CATEGORIES[9],
    categorySlug: 'events',
    author: {
      id: 'auth-2',
      slug: 'dennis-mwangi',
      name: 'Dennis Mwangi',
      isVerified: true,
    },
    coverImageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    verificationStatus: 'source_verified',
    readingTimeMinutes: 2,
    viewsCount: 890,
    likesCount: 64,
    bookmarksCount: 45,
    publishedAt: '2026-09-22T12:00:00Z',
    reviewedAt: '2026-09-22T11:00:00Z',
    updatedAt: '2026-09-22T12:00:00Z',
    createdAt: '2026-09-21T09:00:00Z',
    tags: ['Webinar', 'Chama', 'Finance', 'Bookkeeping', 'Capacity Building'],
    topics: [SEED_TOPICS[1]],
    sources: [],
    event: {
      startsAt: '2026-10-02T18:00:00+03:00',
      endsAt: '2026-10-02T19:30:00+03:00',
      timezone: 'Africa/Nairobi',
      locationName: 'Online Zoom Stream & YouTube Live',
      registrationUrl: 'https://zoom.us/webinar/register/sihu-chama-masterclass',
      isOnline: true,
      organizerName: 'Sango MSME Capacity Academy',
    },
  },
  {
    id: 'sihu-pod-01',
    contentType: 'podcast',
    slug: 'voices-of-the-lake-episode-14-fisherfolk-cooperatives',
    title: 'Voices of the Lake #14: How Digital Landing Stations Are Fair-Pricing the Night Catch',
    subtitle: 'Interview with Beach Management Unit leaders on breaking the exploitative middlemen cartel with transparent weighing scales',
    excerpt: 'Listen to BMU representatives from Usenge and Rusinga Island discuss how solar-powered cold hubs and digital weight scale receipts have boosted fishermen take-home pay by 35%.',
    body: `In this episode of *Voices of the Lake*, host Jane Achieng sits down with Peter Onyango, chairman of the Central Usenge Beach Management Unit, and solar engineer Kevin Kihara.

Together, they walk through the deployment of solar chill storage units right at the lakefront, which allows evening boat crews to store fresh Nile perch safely until morning auctions without being forced into predatory low-ball pricing.`,
    status: 'published',
    visibility: 'public',
    category: SEED_CATEGORIES[4],
    categorySlug: 'culture',
    author: {
      id: 'auth-3',
      slug: 'jane-achieng',
      name: 'Jane Achieng',
      title: 'Host & Cultural Journalist',
      bio: 'Telling frontline human stories from the shores and islands of Lake Victoria.',
      avatarUrl: '/images/authors/jane.jpg',
      isVerified: true,
    },
    coverImageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    verificationStatus: 'source_verified',
    readingTimeMinutes: 28,
    viewsCount: 2980,
    likesCount: 210,
    bookmarksCount: 65,
    publishedAt: '2026-09-17T06:00:00Z',
    reviewedAt: '2026-09-16T18:00:00Z',
    updatedAt: '2026-09-17T06:00:00Z',
    createdAt: '2026-09-15T15:00:00Z',
    tags: ['Podcasts', 'Fisherfolk', 'Solar Cold Storage', 'Fair Trade', 'Lake Victoria'],
    topics: [SEED_TOPICS[3]],
    sources: [
      {
        id: 'src-pod-1',
        title: 'Artisanal Fisheries Value Chain Assessment Report',
        publisher: 'State Department for Blue Economy and Fisheries',
        url: 'https://blueeconomy.go.ke',
        sourceType: 'government',
      }
    ],
    podcast: {
      audioUrl: 'https://traffic.libsyn.com/secure/forcedexposure/sample-audio.mp3',
      durationSeconds: 1680, // 28 minutes
      episodeNumber: 14,
      host: 'Jane Achieng',
      guests: ['Peter Onyango (BMU Chair)', 'Kevin Kihara (Solar Engineer)'],
      transcript: `[00:00] Jane: Welcome to Voices of the Lake, coming to you from Sango Information Hub. Today we are on location at Usenge Beach...
[04:15] Peter Onyango: Before the solar cold hub was installed, a fisherman arriving at 2:00 AM had only two choices: sell to brokers at whatever price they dictated, or watch the catch spoil in the morning heat.
[12:30] Kevin Kihara: The solar system is battery-buffered and maintains a steady 2 degrees Celsius, even during overcast monsoon days...`,
      showNotes: 'Links to Beach Management Unit contact rosters, equipment specifications, and solar grant application guides.',
    },
  },
  {
    id: 'sihu-doc-01',
    contentType: 'document',
    slug: 'lake-victoria-water-quality-baseline-report-2026',
    title: 'Lake Victoria Basin Water Quality & Limnological Baseline Survey 2026',
    subtitle: 'Comprehensive multi-county assessment of nitrogen, dissolved oxygen, and heavy metal concentrations across 24 monitored littoral zones',
    excerpt: 'Official analytical baseline document summarizing biological oxygen demand, microbial turbidity, and industrial runoff indicators along the Kenyan shoreline of Lake Victoria.',
    body: `### Executive Summary

This annual technical baseline provides water resource managers, civil society, and academic researchers with authoritative laboratory data on water quality parameters across 24 littoral testing stations in Kisumu, Homa Bay, Migori, Busia, and Siaya counties.

Key metrics tracked include:
- Total Nitrogen (TN) and Total Phosphorus (TP) concentrations.
- Dissolved Oxygen (DO) levels across wet and dry seasonal transitions.
- Heavy metal sediment trace analysis (Lead, Cadmium, Mercury).
- Phytoplankton bloom indices and Chlorophyll-a density.`,
    status: 'published',
    visibility: 'public',
    category: SEED_CATEGORIES[12],
    categorySlug: 'research',
    author: {
      id: 'auth-1',
      slug: 'grace-otieno',
      name: 'Dr. Grace Otieno',
      isVerified: true,
    },
    organization: {
      id: 'org-2',
      slug: 'lake-victoria-environmental-taskforce',
      name: 'Lake Victoria Environmental Scientific Taskforce',
    },
    coverImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    verificationStatus: 'source_verified',
    readingTimeMinutes: 15,
    viewsCount: 1820,
    likesCount: 112,
    bookmarksCount: 94,
    publishedAt: '2026-09-10T08:00:00Z',
    reviewedAt: '2026-09-09T14:00:00Z',
    updatedAt: '2026-09-10T08:00:00Z',
    createdAt: '2026-09-08T10:00:00Z',
    tags: ['Research', 'Water Quality', 'Hydrology', 'Limnology', 'PDF Report'],
    topics: [SEED_TOPICS[2]],
    sources: [
      {
        id: 'src-doc-1',
        title: 'East African Community Lake Victoria Basin Water Quality Protocol',
        publisher: 'LVBC Secretariat',
        url: 'https://lvbcom.org',
        sourceType: 'government',
      }
    ],
    document: {
      fileUrl: '/documents/lake-victoria-water-quality-survey-2026.pdf',
      fileSizeBytes: 4820000,
      fileFormat: 'PDF',
      extractedText: 'Lake Victoria Basin Water Quality Survey 2026. Sample analysis conducted across 24 littoral zones. Findings indicate critical need for riparian buffer rehabilitation along the Nyando and Sondu Miriu river mouths...',
      version: '1.2',
      reviewDate: '2026-09-09',
    },
  }
];
