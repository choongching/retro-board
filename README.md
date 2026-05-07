# retro-board

Multiplayer retrospective board. Vite + React + TypeScript on the frontend, Supabase Realtime (Broadcast + Presence) for live sync. No accounts, no database in v1 — state lives only in the open browser tabs of a room.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
```

Requires `.env.local` with:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon JWT from Supabase API Keys → "Legacy anon" tab>
```

The legacy `anon` JWT (`eyJ...`) is required — Supabase's newer `sb_publishable_*` keys are not yet accepted by the Realtime WebSocket endpoint.

## Build & deploy

```bash
npm run build    # outputs to dist/
```

Deployed to Vercel (`retro-board-green.vercel.app`). Auto-deploys on push to `main`. SPA routing fallback is configured in `vercel.json`.

## Architecture summary

- **No backend code.** All sync goes through Supabase Realtime channels keyed by room code (`retro:<code>`).
- **State is ephemeral.** Cards/votes/settings live in memory on each connected client. When the last person leaves, room state evaporates. Markdown export is the persistence story.
- **Late joiners** receive current state from the longest-connected user (the "host") via a targeted broadcast.
- **Cursor positions** ride a separate broadcast event throttled to ~10fps, suppressed during text editing.

## Operations

### Monitor Supabase usage

Free tier limits: **200 concurrent Realtime connections**, **2M Realtime messages/month**.

Check usage weekly at:
- Supabase Dashboard → your project → **Reports** → **Realtime** (concurrent connections, messages over time)
- Or: Project Settings → Usage tab

The cursor broadcast is the only meaningful cost vector. If monthly messages climb above ~1.5M, drop the cursor throttle in `src/screens/Board.tsx` from 100ms to 200ms (halves volume; still smooth).

### Vercel build pinning

`vercel.json` pins `installCommand: npm install` and `buildCommand: npm run build` so the build is deterministic against `package-lock.json` regardless of dashboard auto-detection.

## File map

```
src/
  main.tsx, App.tsx, styles.css, data.ts, icons.tsx
  lib/
    supabase.ts          # Supabase client (eventsPerSecond: 100)
    profile.ts           # localStorage profile { id, name, color }
    useRetroChannel.ts   # the room hook — broadcast/presence/cursors
  screens/
    Home.tsx             # workspace decoration, navigation entry
    Join.tsx             # name + room code + format select
    Board.tsx            # main retro screen, hooks Realtime
  components/
    BoardTopbar, BoardSurface, ColumnsSurface, Column,
    SailboatSurface, SailboatZone, StickyCard, Composer,
    PresenceCursors, PresenceStack, ProfilePill, RetroRow,
    RetroWordmark, FormatGlyph
```
