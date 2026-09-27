# 📁 SANGO Code Structure - Best Practices

## Overview
Clean, organized, scalable Next.js 16 folder structure following industry best practices.

---

## 🏗️ Complete Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── (landing)/               # Landing page group
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── admin/                   # 🔐 ADMIN PORTAL
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── portal/                  # 👥 USER PORTAL
│       ├── layout.tsx
│       ├── page.tsx
│       └── article/
│           └── [id]/
│               └── page.tsx
│
├── components/                  # React Components (organized by scope)
│   ├── admin/                   # Admin-specific components
│   │   ├── LoginForm.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── portal/                  # Portal-specific components
│   │   ├── NewsHeader.tsx
│   │   ├── NewsHero.tsx
│   │   ├── NewsCategories.tsx
│   │   ├── NewsPortal.tsx
│   │   └── ...
│   ├── home/                    # Landing page components
│   │   ├── HeroSection.tsx
│   │   ├── IntroSection.tsx
│   │   ├── CtaSection.tsx
│   │   ├── ContactSection.tsx
│   │   └── ...
│   ├── shared/                  # Shared across portals
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   └── ui/                      # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── RevealOnScroll.tsx
│       └── ...
│
├── services/                    # Business Logic & Data Operations
│   ├── auth/                    # Authentication services
│   │   └── authService.ts       # Login, OAuth, sessions, waitlist
│   ├── content/                 # Content management
│   │   └── contentService.ts    # Articles, podcasts, events (all CRUD ops)
│   ├── shared/                  # Shared services (if needed)
│   │   └── analyticsService.ts
│   ├── articleService.ts        # 🗑️ DEPRECATED (use contentService instead)
│   ├── eventService.ts          # 🗑️ DEPRECATED
│   ├── podcastService.ts        # 🗑️ DEPRECATED
│   └── supabaseArticleService.ts # 🗑️ DEPRECATED
│
├── utils/                       # Utility Functions & Helpers
│   ├── api/                     # API call utilities
│   │   └── apiClient.ts         # Centralized fetch/axios wrapper
│   ├── validators/              # Input validation
│   │   ├── emailValidator.ts
│   │   ├── passwordValidator.ts
│   │   └── ...
│   ├── supabase/               # Supabase client & helpers
│   │   └── client.ts            # Supabase initialization
│   └── helpers.ts              # General utility functions
│
├── hooks/                       # Custom React Hooks
│   ├── useAuth.ts              # Authentication hook
│   ├── useContent.ts           # Content fetching hook (if needed)
│   └── ...
│
├── types/                       # TypeScript Types & Interfaces
│   └── index.ts                # Centralized type definitions
│       ├── User, AuthSession
│       ├── Article, Podcast, Event
│       ├── WaitlistEntry
│       ├── ApiResponse
│       └── ...
│
├── constants/                   # Constants & Configuration
│   └── articles.ts             # Article constants, config
│
├── public/                      # Static Assets
│   └── images/
│
└── .env.local                  # Environment Variables
```

---

## 🎯 Organization Principles

### 1. **By Function, Not By Type**
✅ **Good**: Grouped by domain (auth, content, portal, admin)
❌ **Bad**: All components together, all services together

### 2. **One Responsibility Per File**
Each file does ONE thing:
- `authService.ts` → Only authentication-related operations
- `contentService.ts` → Only content CRUD operations
- `emailValidator.ts` → Only email validation

### 3. **Shared vs. Domain-Specific**
- **Shared**: Used by multiple features (`ui/`, `shared/`, `utils/`)
- **Domain-Specific**: Used by one feature (`admin/`, `portal/`, `home/`)

### 4. **Index Files for Exports**
```typescript
// types/index.ts - Export all types from one place
export * from './user';
export * from './content';
export * from './api';
```

---

## 📝 Usage Examples

### Import Authentication
```typescript
// ✅ GOOD - Clean, centralized
import { authService } from '@/services/auth/authService';
import { useAuth } from '@/hooks/useAuth';

// Use it
const isValid = authService.verifyAdminPassword(password);
const { login, logout } = useAuth();
```

### Import Types
```typescript
// ✅ GOOD - All types in one place
import { User, Article, ApiResponse } from '@/types';
```

### Import UI Components
```typescript
// ✅ GOOD - Clear what's shared
import { Button, Card } from '@/components/ui';
```

### Import Content Services
```typescript
// ✅ GOOD - One place for all content operations
import { contentService } from '@/services/content/contentService';

const articles = await contentService.getArticles();
const article = await contentService.getArticleById('id');
```

---

## 🔄 Migration Guide (from old structure)

### OLD → NEW
```
OLD:
- components/home/ → ✅ Stays same
- components/portal/ → ✅ Stays same
- components/ui/ → ✅ Stays same
- articleService.ts → ❌ Move to services/content/contentService.ts
- eventService.ts → ❌ Move to services/content/contentService.ts
- podcastService.ts → ❌ Move to services/content/contentService.ts
- No auth service → ✨ NEW: services/auth/authService.ts
- No types file → ✨ NEW: types/index.ts
- No hooks → ✨ NEW: hooks/useAuth.ts
- No validators → ✨ NEW: utils/validators/
```

---

## ✨ Benefits

✅ **Scalability**: Easy to add new features without confusion
✅ **Maintainability**: Each file has a clear purpose
✅ **Testability**: Services are isolated and testable
✅ **Reusability**: Types, hooks, and utils shared across app
✅ **Team Collaboration**: Everyone knows where to find/add code
✅ **Type Safety**: Centralized types prevent duplication

---

## 🚀 When Adding a New Feature

1. **Create service**: `src/services/[feature]/[feature]Service.ts`
2. **Create types**: Add to `src/types/index.ts`
3. **Create hook** (if needed): `src/hooks/use[Feature].ts`
4. **Create components**: In `src/components/[scope]/[Feature].tsx`
5. **Create validators** (if needed): `src/utils/validators/[feature]Validator.ts`

✨ **Everything stays organized!**

---

## Next Steps

1. ✅ Use this structure for all new code
2. ✅ Gradually migrate old services to centralized locations
3. ✅ Delete old service files once migrated
4. ✅ Keep types updated in `types/index.ts`

**You now have a production-ready, scalable architecture!** 🎉
