# SANGO Portal Structure

## Overview
One unified Next.js app with **two separate portals** to avoid confusion.

---

## 📁 Portal Routes

### 🔐 **Admin Portal** → `/admin`
- **Location**: `src/app/admin/`
- **File**: `src/app/admin/layout.tsx` + `src/app/admin/page.tsx`
- **Purpose**: Dashboard for admins only
- **Auth**: Email + Password (`sihuhub`)
- **Access**: 
  - Via password (`sihuhub`)
  - Via Google OAuth sign-in
  - Email waitlist for early access
- **Features**: 
  - Email verification / Waitlist mode
  - Admin dashboard & management tools

### 👥 **User Portal** → `/portal`
- **Location**: `src/app/portal/`
- **File**: `src/app/portal/layout.tsx` + `src/app/portal/page.tsx`
- **Purpose**: Main user-facing content & articles
- **Access**: Public (no auth required initially)
- **Features**: 
  - News articles & content
  - Article categories
  - Article detail pages (`/portal/article/[id]/`)

---

## 🚀 Running the App

```bash
# Change to the project root
cd c:\Users\Austin NAMUYE\OneDrive\Desktop\SANGO

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

The app will be available at:
- **Homepage**: `http://localhost:3000/` (landing page)
- **Admin**: `http://localhost:3000/admin` (admin portal)
- **User Portal**: `http://localhost:3000/portal` (articles & content)

---

## 📂 Folder Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx (root layout)
│   ├── (landing)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── admin/          👈 ADMIN PORTAL
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── portal/         👈 USER PORTAL  
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── article/
│   │       └── [id]/
│   │           └── page.tsx
│   ├── components/
│   ├── constants/
│   ├── services/
│   └── utils/
```

---

## 🔑 Key Points

✅ **ONE unified app** - no duplicate folders  
✅ **Clear separation** - `/admin` for admins, `/portal` for users  
✅ **Easy to manage** - shared utilities, services, and components  
✅ **Simple dev workflow** - `npm run dev` runs everything  

---

## 🛠️ To Add Features

- **Edit Admin**: `src/app/admin/layout.tsx` & `src/app/admin/page.tsx`
- **Edit User Portal**: `src/app/portal/layout.tsx` & `src/app/portal/page.tsx`
- **Shared Components**: `src/components/`
- **Shared Services**: `src/services/`

---

No more confusion! 🎉
