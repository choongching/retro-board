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
- Copy the room code or invite link to pull in more teammates

### As a host (free, magic-link sign-in)
- Create persistent retros that survive a refresh
- Pick from three formats: **Went Well / To Improve / Actions**, **Start / Stop / Continue**, **Sailboat**
- Rename boards inline (only you can edit yours)
- See all your past retros in **My boards**, click into any to reopen
- Copy a clean invite link (`/join/<code>`) so participants always land on the name prompt before the board loads
- Delete boards (cards cascade)
- Import a JSON export to start a new retro from a saved one
- Toggle anonymous mode and reveal cards on demand
- Export the retro as Markdown or JSON
- Jump back to **My boards** with the back arrow in the topbar
- **Recap a previous session** inside the new board: pull up a read-only snapshot of any past retro and review action items before kicking off the next one

### Live for everyone
- Real-time card sync across every connected tab
- Real-time cursor positions, with a **HOST** chip next to the facilitator's cursor and lobby chip so the room knows who's running things
- Real-time avatar presence
- Anonymous mode + reveal flow for blind voting
- **Lobby** before the live board: host sees who's arrived, others see who's here and "Waiting for {host} to start" until the host clicks Start
- **Icebreaker nudge** for anyone who's been silent in a busy room. After about 3 minutes with at least 3 others present and 5 cards already on the board, a one-time, self-only modal opens with a friendly open-ended prompt. Type a sentence, pick a column, and your answer becomes your first card.

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

### Recapping a previous session (owner-only)
```
inside the new board → click the history icon in the topbar
  → wide overlay opens with your past retros listed
  → pick one → snapshot view shows that board's columns side-by-side
                with cards sorted by votes, anonymized, muted styling
  → close (or Esc) → back to the live new board
```
The recap is **owner-local**. Only you see the modal; participants stay in the live board with no interruption. Useful for the warmup beat: scan last sprint's action items and themes, then start fresh. The recap doesn't change the new board, and nothing carries over by default.

### Lobby (pre-session waiting state)
```
host creates retro → lobby card with "Who's here" list + Start retro
participants join via invite link → enter their name
  → land in the same lobby, see the host's name and a waiting pill
host clicks Start retro → everyone cross-fades into the live board
```
Restores the small "ok everyone, let's start" ritual that real-life retros have. Early arrivals stop wondering whether to post or wait, and hosts get visible confirmation of who's in the room before kickoff. Late joiners after Start drop straight into the live board with no special UI. One-way: once started, the board stays live.

### Icebreaker nudge for silent participants
```
join the board → 3 minutes pass with no card from you
  → AND there are 3+ other participants in the room
  → AND there are 5+ cards on the board already
  → icebreaker modal opens just for you, once
     "Anything from this sprint you want to add?"
  → type a sentence, pick a column, click "Drop it in"
  → your answer becomes your first card, broadcasts to everyone
```
The modal is **self-only**: other participants never know it appeared, so there's no public shaming. It fires once per tab session and is dismissible via Esc, the X, click-outside, or "Maybe later", with no nag if you don't engage. The trigger only fires when the room is clearly active (others present and posting), so a host opening a fresh board never sees it. The prompt is one of three open-ended questions, picked at random. Each tab session is a fresh chance: refresh resets the one-shot flag.

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

### Why magic links?
JomRetro is an occasional-use tool — most hosts run a retro weekly or monthly at best. That's the worst cadence for password recall, so we skipped passwords entirely:

- **No password tax on returning hosts** — no "forgot password?" flows, no password manager friction, no second-visit drop-off. No password storage also means no breach blast radius.
- **No OAuth opinion** — Google / GitHub sign-in would have been faster, but locks users into having an account with one of those providers and tells the provider which apps people use. Too much surface area for what should be the smallest auth dependency we can get away with.
- **Auth is opt-in, not required** — participants get a localStorage profile (name + UUID + auto-derived color) and never sign in. Magic-link auth is only for hosts who want boards to persist across sessions. The "go check your inbox" friction is fine for users who are explicitly opting into an account.

**Tradeoffs we accepted:** slower than OAuth (context-switching to email), reliant on email deliverability (we route through Resend custom SMTP to dodge Supabase's 3–4 emails/hour built-in cap), and no social-graph features like Google avatars (we auto-derive avatar colors from display names instead).

### How auth works
Sign-in is magic-link only — no passwords. Supabase issues a single-use code, the email link drops you on `/auth/callback`, the client exchanges it for a session, and a Postgres trigger auto-creates a `profiles` row keyed to the auth user. Anonymous participants get a `localStorage` profile with a UUID + display name + auto-derived color; they coexist with real auth identities without any link between them.

### How permissions work
Boards are share-link-trusted: anyone with the code can read, post, vote, edit text, and delete cards. The **owner** of a board (the signed-in creator) gets a few extra controls that other participants don't see in the UI:

| Action | Owner | Participant |
|---|---|---|
| Read all cards | ✅ | ✅ |
| Add / vote / edit / delete cards | ✅ | ✅ |
| Drag cards between columns | ✅ | ✅ |
| See teammates' cursors and presence | ✅ | ✅ |
| Copy the room code / invite link | ✅ | ✅ |
| Rename the board (inline title edit) | ✅ | — |
| Toggle anonymous mode | ✅ | — |
| Reveal cards (when anon mode is on) | ✅ | — |
| Export the retro (.md / .json) | ✅ | — |
| Back arrow → "My boards" | ✅ | — |
| Recap a previous session | ✅ | — |
| Delete the board | ✅ | — |

The board-level actions (rename, delete) are also enforced by Postgres Row-Level Security on the server, so removing the UI gate wouldn't help anyone bypass them. The other gates (anon toggle, reveal, export, back arrow) are UI-only — they affect everyone in the room or are simply only meaningful for the owner.

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
- ✓ **Lobby**: host-controlled pre-session waiting state with a participant list and Start button
- ✓ **HOST badge** on cursors and lobby chips so the facilitator is visually identifiable
- ✓ **Expandable note editor**: auto-grows up to 12 lines inline, then promotes to a full modal editor for long-form notes. Cmd+Enter to submit.
- ✓ **Per-column scroll** with sticky headers and Add CTA, so context and the action stay visible no matter how long the column gets
- ✓ **Warm empty states** on every column with an inviting "Drop the first note" CTA
- ✓ **Recap modal**: owners can pull up a read-only snapshot of any past retro inside the new board to review action items before kicking off
- ✓ **Icebreaker nudge**: a one-shot, self-only modal that invites silent participants to drop their first card with an open-ended prompt, never visible to others
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

## Recently shipped

A light changelog of notable changes. For everything else, see the [commit history](https://github.com/choongching/retro-board/commits/main).

### May 2026
- **Lobby v1.** Pre-session waiting state gated by `boards.started_at`. Host sees who's arrived + a Start retro button, others see a waiting pill with the host's name. Cross-fades into the live board on Start.
  - _Why:_ Wen Bin (early user) asked for a multiplayer-game-style lobby. Without it, early arrivals didn't know whether to post or wait, and hosts had no "we're starting" moment.
  - _UX value:_ Restores the small ritual real-life retros have. Reduces awkward early-arrival ambiguity. Gives the host visible confirmation of the room before kickoff.
- **HOST badge** on cursors and lobby chips. The host marks themselves in their own presence broadcast so every client renders the badge correctly.
  - _Why:_ Participants couldn't tell who the facilitator was at a glance, especially in larger rooms.
  - _UX value:_ Quick visual identification for direction-asking and "@host" mentions.
- **NoteEditor + expandable composer.** Shared component for create and inline edit. Auto-grows 3 → 12 lines then scrolls; an expand icon promotes the editor into a portal-backed modal (60vh) with content preserved. Cmd/Ctrl+Enter submits, Esc cancels.
  - _Why:_ Users said they write long-form notes. The old fixed-height composer clipped content behind the footer, and Enter-to-submit accidentally posted half-thoughts.
  - _UX value:_ Long notes feel comfortable to write and review. Short notes stay fast. Big writing surface available on demand without disrupting flow.
- **Per-column scroll with sticky header + top-right Add CTA.** Each column is its own scroll context. The composer is a compact "+ Note" button next to the column count, opening an inline editor below the header only when active.
  - _Why:_ When columns grew long, the title and Add button scrolled out of view, costing context and one extra scroll for every new note.
  - _UX value:_ Always know which column you're in. Always one click from adding. Composer chrome only present when actively writing.
- **Inviting empty states.** Every empty column gets a sticky-note glyph, a muted facilitator-voice prompt, and a "Drop the first note" CTA.
  - _Why:_ Empty columns at the start of a session felt cold and unanchored.
  - _UX value:_ Encourages first participation, sets the tone, and gives the column a sense of identity even before any notes land.
- **Vote-based auto-sort removed.** Upvoting no longer reorders cards.
  - _Why:_ Cards used to jump positions on every vote, which lost reading context and made it hard to track what someone just said.
  - _UX value:_ Cards stay where they were posted. Vote counts are visible but don't cause reflow.
- **Modal portal fix.** Modals now render via `createPortal` to `document.body`, escaping the rotated sticky-card transform that was trapping `position: fixed`.
  - _Why:_ Expanding to edit a sticky's text rendered the modal clipped inside the card's rotation containing block.
  - _UX value:_ Editors and dialogs always cover the full viewport, regardless of where they were triggered from.
- **Facilitator-voice copy pass.** Rewrote column hints, format descriptions, icebreaker prompts, empty-state copy, toasts, and tooltips. Em-dash sweep across UI strings and code comments.
  - _Why:_ "What worked" / "What didn't" / "What we'll do" was functional but bland. Real facilitators ask about energy ("What energized us") and commitment ("What we'll commit to").
  - _UX value:_ Prompts feel like a thoughtful facilitator is in the room, encouraging deeper reflection instead of checkbox answers.
- **Icebreaker nudge** for silent participants. A one-shot, self-only modal that asks an open-ended question after 3 minutes of inactivity in a buzzing room (3+ others present, 5+ cards posted), then turns the answer into their first card.
- **Top-level error boundary.** Any rendering crash now shows a branded fallback page with "Try again" and "Back home" actions instead of a white screen.
- **Route-level code splitting.** Board, Join, SignIn, and AuthCallback load on demand. Landing visitors get a smaller initial bundle, and the chunk-size warning is gone.
- **Modal primitive.** Extracted shared modal scaffolding (backdrop, scale-in animation, Esc, click-outside, z-index) so Recap, Icebreaker, and any future modals share one source of truth.
- **Dead CSS cleanup.** Removed 338 lines of unused styles from the old long-form landing design. CSS bundle dropped 35 percent.

### April 2026
- **Landing redesign.** Full-viewport stage with the JomRetro wordmark centered and five named cursors drifting around it. Click the wordmark to scale it up, slide it to the top, and reveal the Join / Host sign-in card. Cursors enter from a random screen edge on load and exit to the nearest edge when the card opens.
- **Recap modal.** Owners can pull up a read-only snapshot of any past retro inside the new board to review action items before kicking off the next session. Owner-local, no broadcast.
- **Branded magic-link email.** Custom HTML template matching the brand, source-of-truth in `email-templates/`, delivered through Resend custom SMTP.
- **Share previews.** OG image and Twitter Card meta tags so a JomRetro link in Slack, WhatsApp, or LinkedIn shows the branded preview.
- **Owner-only board controls.** Rename, delete, anon toggle, reveal, export, and the back arrow are gated to the board's signed-in creator. Participants get the collaborative actions; owners get the management ones.

### Earlier
- **Anonymous mode + reveal** for blind voting.
- **JSON import / export** so retros can move into and out of the app.
- **Real-time multiplayer** for cards, cursors, and presence.
- **Three retro formats**: Classic, Start / Stop / Continue, Sailboat.

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
    time.ts              # relativeTime helper (shared by Home + RecapModal)
    icebreakerQuestions.ts # universal open-ended prompts + randomizer
    useIcebreakerTrigger.ts # hook that watches dwell time / room state / own posts
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
    AuthPill, RetroWordmark, FormatGlyph,
    RecapModal, IcebreakerModal
supabase/
  migrations/            # init schema, RLS, RPC revokes, RLS relax
public/
  favicon.svg            # branded blue circle (matches the wordmark dot)
  og-image.png           # 1200x630 share preview (used by OG / Twitter Card meta)
email-templates/
  magic-link.html        # Supabase magic-link template, source of truth
  magic-link-preview.html # local preview with a sample URL filled in
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

### Email templates
The branded HTML for the magic-link email lives in `email-templates/magic-link.html`. Supabase doesn't read templates from the repo, so this file is the **source of truth**: edit it here, then paste the contents into Supabase → **Authentication → Emails → Magic Link → Message body**. Subject line: `Sign in to JomRetro`. Open `email-templates/magic-link-preview.html` in a browser to eyeball changes locally before deploying.

The template uses the same brand tokens as the app (`#2563eb` brand blue, `#f4f6fa` cool background, Inter Tight type stack) and the same casual voice as the home page copy. Variables used: `{{ .ConfirmationURL }}`. The 1-hour expiry mentioned in the body matches the Supabase default; if you ever raise it in the dashboard (Authentication → Sessions → Email OTP Expiration), update the copy too.

### Vercel build pinning
`vercel.json` pins `installCommand: npm install` and `buildCommand: npm run build` so builds are deterministic against `package-lock.json`.

---

## Lessons learned

The hardest part of building JomRetro wasn't anything you can point at on the screen. It was the **realtime multiplayer sync layer**: the invisible plumbing that makes everyone's screen show the same board at the same time.

A useful metaphor: running a retro in a real conference room is easy because there's one wall and twelve pairs of eyes on it. JomRetro is the same retro, but with twelve teammates in twelve different cities, each looking at their own copy of the wall. Every sticky any of them moves has to instantly appear in the same place on the other eleven walls, and every action has to be filed in a permanent archive so you can pull it back up next year.

What makes that hard isn't any one piece. It's that several fragile pieces have to thread together perfectly. If any one of them is slightly off, the bug it creates is brutal to track down: cards duplicating because two systems both try to save the same one, vote counts drifting because two people clicked at the same instant, a refresh wiping someone's work, a late joiner seeing a phantom version of the board that nobody else has.

Three judgment calls that made it actually work:

1. **The longest-connected tab is silently elected as the source of truth for late joiners.** If you join 10 minutes into a retro, you don't get an empty board. You get the current state from whoever has been there longest. The room itself doesn't have one canonical copy on a server. The longest-connected human is the canonical copy.

2. **Card actions show up instantly and save in the background, separately.** When you click "add card," the card pops up on everyone's screen immediately, and a fire-and-forget write hits the database. The visible part never waits on the save, so the experience always feels instant even if the network is slow.

3. **Cursors update 10 times a second, not 60.** Letting cursors run at full smoothness would burn through Supabase's free-tier message budget in about a week. The throttle is invisible to the eye but it's the difference between a free app and a paid one.

The validation moment was a 12-person live retro with no visible issues. There is no test suite that can prove a multiplayer system is stable. You have to put humans in it and watch.

For contrast, the other thing that was fiddly (different from hard) was the chain of small steps to ship the public domain: GoDaddy DNS records, Vercel domain verification, Supabase redirect URLs, OG image and meta tags, custom SMTP through Resend so magic-link emails actually deliver. None of those steps are difficult on their own, but each one has to be done in the right order with the right values, or some part of the app silently breaks for users you'll never hear from.

The takeaway: things that look simple in a product (a sticky note appearing on someone else's screen) are often what took the longest to make reliable. Things that look impressive (the recap modal, the bouncing dot animation) are often the easy parts.
