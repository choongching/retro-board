# JomRetro

**Quick team retrospectives. No setup, no friction.**

Live at **[jomretro.com](https://jomretro.com)**.

JomRetro is a multiplayer retrospective board. Open a room, share a code or invite link with your team, and run a retro together in real time. No accounts to join, no software to install. Hosts who want to save and revisit their boards can sign in with a magic link.

---

## What you can do

### As a participant (no account)
- Open a teammate's invite link
- Type your name → you're in (the code is checked against the database first; bogus codes get a friendly inline error instead of dropping you into an empty room)
- Add cards, vote on cards, drag them between columns
- See teammates' cursors and avatars in real time
- Export the retro as Markdown or JSON

### As a host (free, magic-link sign-in)
- Create persistent retros that survive a refresh
- Pick from three formats: **Went Well / To Improve / Actions**, **Start / Stop / Continue**, **Sailboat**
- Rename boards inline (only you can edit yours)
- See all your past retros in **My boards**, click into any to reopen
- Copy a clean invite link (`/join/<code>`) so participants always land on the name prompt before the board loads
- Delete boards (cards cascade)
- Import a JSON export to start a new retro from a saved one
- Toggle anonymous mode and reveal cards on demand

### Live for everyone
- Real-time card sync across every connected tab
- Real-time cursor positions
- Real-time avatar presence
- Anonymous mode + reveal flow for blind voting

---

## How it works (UX flows)

### Hopping into someone else's retro
```
click invite link → /join/<code>
  → enter name → /r/<code>
  → board loads, you're in
```
No format choices, no avatar picker — just identity collection. The host already chose the format when they made the board.

### Hosting your own
```
home → "I'm hosting" tab → enter email
  → magic link in inbox → click → /auth/callback
  → /r/<new-code>, board ready
```
Your board is saved to the database the moment you create it. Close the tab, come back tomorrow, it's still there.

### Sharing
Inside the board, click the share icon next to the room code. That copies an invite link (`/join/<code>`) — recipients always see the name prompt before the board, even if they've used JomRetro before.

### When something goes wrong
- **Wrong / typo'd room code on submit** → inline error below the field: _"We couldn't find a retro with that code. Double-check it with your teammate."_ The page doesn't navigate, your name input stays put.
- **Invalid email in the host card** → inline error before any magic link gets sent.
- **Visiting `/r/<bogus-code>` directly** (bookmark from a deleted retro, broken link) → friendly _"We couldn't find that retro"_ page with the offending code and a "Back home" button. No silent drop into an empty room.
- **Successful actions** (copy invite link, copy code, reveal cards, export) → toast notification at the bottom of the screen.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React 19 + TypeScript |
| Routing | react-router-dom v7 |
| Realtime sync | Supabase Realtime (Broadcast + Presence) |
| Persistence | Supabase Postgres + Row-Level Security |
| Auth | Supabase Auth (email magic link) |
| Email delivery | Resend (custom SMTP) |
| Toast notifications | [sonner](https://sonner.emilkowal.ski/) |
| Hosting | Vercel |
| Type/build | TypeScript strict + `tsc -b && vite build` |

### How realtime works
Every room is a Supabase Realtime channel keyed `retro:<code>`. Card actions broadcast as state patches; the longest-connected tab acts as the source of truth for late joiners. Cursors ride a separate, throttled broadcast. Card mutations also fire-and-forget into the `cards` table when the board has a DB row, so refreshing or closing all tabs doesn't lose anything.

### How auth works
Sign-in is magic-link only — no passwords. Supabase issues a single-use code, the email link drops you on `/auth/callback`, the client exchanges it for a session, and a Postgres trigger auto-creates a `profiles` row keyed to the auth user. Anonymous participants get a `localStorage` profile with a UUID + display name + auto-derived color; they coexist with real auth identities without any link between them.

### How permissions work
Boards are share-link-trusted: anyone with the code can read, post, vote, edit text, and delete cards. Only the **owner** of a board can rename or delete the board itself — that's enforced by Row-Level Security on the server, not just the UI.

---

## Features at a glance

- ✓ Real-time multiplayer (cards, cursors, avatars)
- ✓ Three retro formats out of the box
- ✓ Inline-editable board titles (creator only)
- ✓ Anonymous mode + reveal
- ✓ Markdown + JSON export
- ✓ JSON import (start a fresh board from a previous one)
- ✓ Persistent boards for signed-in creators
- ✓ "My boards" history with delete
- ✓ Copy-invite-link with name-collection guarantee
- ✓ Inline form validation everywhere (empty fields, bad email format, ABC-1234 code shape)
- ✓ DB-backed code lookup before joining — no more landing in phantom rooms
- ✓ Friendly "Board not found" page for stale links
- ✓ Toast notifications via sonner for every confirmation action
- ✓ Light, design-tokenised UI consistent across signed-in and anonymous flows

### Known limitations
- In-column card reorder doesn't persist across reloads (we order by creation time on reload). Cross-column moves do persist.
- Anonymous-created boards stay ephemeral by design — sign in to host saved retros.
- Two users voting on the same card at the exact same instant can race; last write wins on the votes array. Rare in practice.

---

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Create `.env.local`:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon JWT — Legacy anon tab in Supabase API Keys>
```

The Realtime WebSocket needs the **legacy** `anon` JWT (`eyJ...`), not the newer `sb_publishable_*` keys.

For auth flows to work locally, add `http://localhost:5173` to **Authentication → URL Configuration → Additional Redirect URLs** in your Supabase dashboard.

## Building

```bash
npm run build    # outputs to dist/
```

Vercel auto-deploys on push to `main`. SPA routing fallback is in `vercel.json`.

## Database

Migrations live in `supabase/migrations/` and have already been applied to the live project. Schema:

- `profiles` — auth users, auto-populated by trigger
- `boards` — `code`, `title`, `format`, `owner_id`, `last_active_at`
- `cards` — `board_id`, `col`, `text`, `author_id`, `author_name`, `votes[]`, `created_at`

Row-Level Security: all reads are public (share-link model), inserts/updates are open on `cards`, board updates and deletes are owner-only. See `supabase/migrations/0002_rls_policies.sql` and `0004_relax_cards_delete.sql` for the exact policies.

## File map

```
src/
  main.tsx, App.tsx, styles.css, data.ts, icons.tsx
  lib/
    supabase.ts          # Supabase client
    auth.tsx             # AuthProvider + useAuth (session, signIn, signOut)
    profile.ts           # localStorage anonymous profile
    useRetroChannel.ts   # the room hook — broadcast / presence / DB write-through
    boardsApi.ts         # CRUD on boards + cards
    retroExport.ts       # JSON export/import schema
  screens/
    Home.tsx             # split-action landing for anonymous, board list for signed-in
    Join.tsx             # name + code (invite-link participants)
    SignIn.tsx           # magic-link form (fallback)
    AuthCallback.tsx     # exchanges ?code= for a session
    Board.tsx            # main retro screen
  components/
    BoardTopbar, BoardSurface, ColumnsSurface, Column,
    SailboatSurface, SailboatZone, StickyCard, Composer,
    PresenceCursors, PresenceStack, ProfilePill, UserMenu,
    AuthPill, RetroWordmark, FormatGlyph
supabase/
  migrations/            # init schema, RLS, RPC revokes, RLS relax
public/
  favicon.svg            # branded blue circle (matches the wordmark dot)
```

## Toast notifications

Notifications use [sonner](https://sonner.emilkowal.ski/) — small, themeable, no per-screen state plumbing. The single `<Toaster />` mount in `App.tsx` is themed via inline `toastOptions.style` mapped to our existing tokens (`--color-text` background, `--color-bg` text, `--shadow-lg`).

```ts
import { toast } from 'sonner';

toast('Copied room code');                  // neutral pill (default style)
toast.success('Invite link copied');        // success variant
toast.error("That didn't work");            // error variant
toast.promise(saveBoard(), {                // async with all three states
  loading: 'Saving…',
  success: 'Saved',
  error: 'Save failed',
});
```

## Operating notes

### Supabase free-tier ceilings
- 200 concurrent Realtime connections
- 2M Realtime messages / month

The cursor broadcast is the only meaningful cost vector. If monthly messages approach ~1.5M, raise the cursor throttle in `src/screens/Board.tsx` from 100ms to 200ms — halves volume, still smooth.

### Custom SMTP
Magic-link emails go via **Resend** (configured in Supabase → Authentication → Emails → SMTP Settings) to dodge the built-in 3-4/hour rate limit.

### Vercel build pinning
`vercel.json` pins `installCommand: npm install` and `buildCommand: npm run build` so builds are deterministic against `package-lock.json`.
