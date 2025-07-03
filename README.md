# TOKI Take Home Challenge
This a collection of take-home tasks. For now we start with the [Data](./tasks/data.md) and [Full Stack](./tasks/full-stack.md) tasks.

## Quick Start Guide

**1. Get Running**
```bash
pnpm install
pnpm dev
```

**2. Want to Add New Data?**
- Drop your logic in `data/` folder (like `data/electricity-data.ts`)
- Create a service in `src/services/` to handle business logic
- Make an API endpoint in `app/api/` that calls your service

**3. Need an API Endpoint?**
- Create `app/api/your-feature/route.ts`
- Export `GET`, `POST`, etc. functions
- Call your service functions from here

**4. Want to Show Data on Screen?**
- Build components in `src/components/` using shadcn/ui
- Use React Query hooks in `src/hooks/` to fetch data
- Connect everything in your page components

**5. The Flow**
```
User clicks button → Component calls hook → Hook fetches from API → API calls service → Service gets data → Back to user
```

**Example**: Want to show electricity usage?
1. `data/electricity-data.ts` - raw data access
2. `src/services/electricity-service.ts` - business logic  
3. `app/api/electricity/route.ts` - API endpoint
4. `src/hooks/use-electricity-query.ts` - React Query hook
5. `src/components/electricity-dashboard.tsx` - UI component

The project uses TypeScript everywhere, Tailwind for styling, and follows Next.js 13+ patterns. Everything is organized so you can find stuff easily and add new features without breaking existing ones.
