# Running KAI Nuvari & The Dual Information Hubs

You can start all ecosystem components as a single unit or run individual services.

---

## ⚡ Quick Start: Run Everything as One Unit

From the project root, simply run:

```powershell
.\start.ps1
```
*(or run `npm run start:all`)*

This boots all four services simultaneously in separate windows:
1. **KAI Nuvari Main App**: `http://localhost:3000`
2. **SIHU News Hub Portal**: `http://localhost:3001`
3. **Oloolua Conservation Hub**: `http://localhost:3002`
4. **KAI AI Agent Backend (Needle + RAG)**: `http://127.0.0.1:8000`

---

## 🧭 How the Information Hubs Work Together

When you open the **KAI Main App** (`http://localhost:3000`) and tap **"Info Hub"** in the bottom navigation, an interactive modal appears allowing you to switch between the 2 hubs:

1. **SIHU News Hub**:
   - **In-App route**: [`/hub`](http://localhost:3000/hub) (Integrated journalism, articles, AI review, topics)
   - **Dedicated Portal**: [`http://localhost:3001`](http://localhost:3001)

2. **Oloolua Conservation Hub**:
   - **In-App route**: [`/conservation`](http://localhost:3000/conservation) (Community Forest Association knowledge, methodologies, seedling tracker)
   - **Dedicated Portal**: [`http://localhost:3002`](http://localhost:3002)

---

## 🛠 Running Services Individually

If you prefer to run services individually:

### 1. KAI AI Agent Backend (Port 8000)
```powershell
python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

### 2. KAI Nuvari Main Web App (Port 3000)
```powershell
npm --prefix .\avax-frontend run dev
```

### 3. SIHU News Hub Portal (Port 3001)
```powershell
npx --prefix .\SIHU.COM next dev -p 3001
```

### 4. Oloolua Conservation Hub (Port 3002)
```powershell
npx --prefix .\oloolua-youth-guardians next dev -p 3002
```