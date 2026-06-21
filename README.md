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
- Copy the invite link to pull in more teammates

### As a host (free, magic-link sign-in)
- Create persistent retros that survive a refresh
- Pick from three formats: **Went Well / To Improve / Actions**, **Start / Stop / Continue**, **Sailboat**
- Rename boards inline (only you can edit yours)
- See all your past retros in **My boards**, click into any to reopen
- Copy a clean invite link (`/join/<code>`) so participants always land on the name prompt before the board loads
- Delete boards (cards cascade)
- Import a JSON export to start a new retro from a saved one
- Export the retro as Markdown or JSON
- Jump back to **My boards** with the back arrow in the topbar
- **Recap a previous session** inside the new board: pull up a read-only snapshot of any past retro and review action items before kicking off the next one

### Live for everyone
- Real-time card sync across every connected tab
- Real-time cursor positions, with a **HOST** chip next to the facilitator's cursor and lobby chip so the room knows who's running things
- Real-time avatar presence
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
Inside the board, click the room-code pill (it carries a share glyph). That copies an invite link (`/join/<code>`) — recipients always see the name prompt before the board, even if they've used JomRetro before.

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
- **Successful actions** (copy invite link, export) → toast notification at the bottom of the screen.

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
| Copy the invite link | ✅ | ✅ |
| Rename the board (inline title edit) | ✅ | — |
| Set / control the session timer | ✅ | — |
| Export the retro (.md / .json) | ✅ | — |
| Back arrow → "My boards" | ✅ | — |
| Recap a previous session | ✅ | — |
| Delete the board | ✅ | — |

The board-level actions (rename, delete) are also enforced by Postgres Row-Level Security on the server, so removing the UI gate wouldn't help anyone bypass them. The other gates (timer, export, back arrow) are UI-only — they affect everyone in the room or are simply only meaningful for the owner. The timer is host-controlled but shared: participants see a read-only countdown while it's running.

---

## Features at a glance

- ✓ Real-time multiplayer (cards, cursors, avatars)
- ✓ Three retro formats out of the box
- ✓ Inline-editable board titles (creator only)
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
- ✓ **Session timer**: a host-driven timebox in the topbar (seven-segment readout) with arm-then-Start, duration presets + custom, pause/extend/restart, green-to-red urgency, and chimes. Participants see a live read-only countdown.
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
- The session timer is broadcast-only (not written to the database). It survives late joiners via the same state-sync as the rest of the live board, but resets if the room fully empties, the same ephemeral model as cards.

---

## Recently shipped

A light changelog of notable changes. For everything else, see the [commit history](https://github.com/choongching/retro-board/commits/main).

### June 2026
- **Delightful upvotes.** Upvoting a card now has a personal, only-you-see-it celebration: the chip springs with a pop, the count rolls up, a "+1" floats off it, and a small burst fires from the chip, picked at random each click from a rotating set (hearts, warm confetti, gold sparkle-stars, column-aware emoji, an upward fountain, and an emoji pop), never repeating the one just shown. Crossing 10 / 25 / 50 votes on a card upgrades to a bigger two-stage celebration. Everything is client-side only (nothing is broadcast, the room still just sees the count), fires on vote-on only, and fully respects `prefers-reduced-motion`.
  - _Why:_ Voting was the most-repeated action in a session but felt flat, and a retro should feel a little joyful, not just functional.
  - _UX value:_ A small hit of delight on every vote that stays fresh through randomized variety, with the bigger moments reserved for cards that are clearly resonating with the room.
- **Removed anonymous mode.** Retired the host-only "anonymous mode" toggle and its companion "Reveal" flow that hid everyone else's cards until the host revealed them. Cards now always show their text and author to everyone in the room. The eye toggle is gone from the topbar, and the icebreaker nudge no longer has to wait for a reveal.
  - _Why:_ In practice it added a layer of hide-and-reveal ceremony without improving the retros, just an extra control to find, toggle, and remember to undo. Anon state was never persisted, so nothing of value is lost.
  - _UX value:_ One less control to reason about, and authorship is always visible so it is easy to follow up on a note or give credit.
- **See the full participant list from the avatar stack.** The topbar presence stack now shows up to 5 avatars, then a "+N" chip, and the whole stack is a button: click it (or the "+N") to open a popover listing everyone in the room. Each row shows the avatar and name, marks yourself with "(you)", and tags the host. The list is sorted you, then host, then everyone else alphabetically, and scrolls for large rooms. Hovering an individual avatar still shows their name.
  - _Why:_ Once 5 or 6 people joined, the stack collapsed to a bare "+6" that did nothing on hover or click, so you couldn't tell who else was in the session.
  - _UX value:_ A glanceable, keyboard-accessible roster of who's here, with the facilitator and yourself called out, no matter how many people join.
- **Host notes now sync to everyone.** Fixed a bug where notes a host posted during a live session were visible only to the host, participants never saw them. The host's realtime channel was being torn down and rebuilt a beat after load (host status only resolves once auth settles), which left it on a churned connection whose broadcasts stopped reaching the room. The host kept seeing its own notes via the optimistic local update, so nothing looked wrong on their end. The channel now subscribes once and stays put for the whole session.
  - _Why:_ The facilitator is often the most active note-taker, so their thoughts silently vanishing for everyone else broke the core promise of a shared board.
  - _UX value:_ Every note shows up for the whole room the moment it's posted, no matter who posts it.
- **Notes keep their author after someone leaves.** Fixed a bug where a card's avatar and name flipped to "Anonymous" the instant its author closed their tab. Authorship was resolved from whoever was currently present, so it broke the moment that person dropped off. The author's name is now snapshotted onto the note when it's posted (the column already existed in the database), and read back on load.
  - _Why:_ People come and go during a retro, and a note losing its author made it impossible to follow up or give credit.
  - _UX value:_ A note keeps its author for the entire session and in the exported recap, even after that person has left.
- **Neutral draft state for new cards.** The in-focus card composer no longer borrows the author's warm paper tint while you're typing. A draft stays muted (neutral surface + dashed border) and only takes its author color once it's dropped in.
  - _Why:_ A tinted draft looked identical to a posted note, so it wasn't obvious the thought hadn't been committed yet.
  - _UX value:_ The unconfirmed card reads as clearly "not posted," distinct from the confirmed notes around it.
- **Even, legible sticky author avatar.** Added a proper `.avatar.xs` (18px) design-system size for the tiny author chip on sticky notes, replacing a one-off inline-shrunk `.sm`. Two initials now sit even and centered, with a neutral inset ring instead of a bg-colored border that clashed with the paper tint.
  - _Why:_ At 16px the two-letter initials were cramped and off-center, and the cool border ring clashed on warm stickies.
  - _UX value:_ Author initials read cleanly on every tint, and the size is now a reusable primitive (documented in the styleguide) rather than a hand-tuned override.
- **One share action in the board topbar.** Merged the two adjacent controls (a room-code pill that copied the code, and a separate share icon that copied the invite link) into a single pill. The room code stays visible as the room's identity, with the share glyph inside it, and clicking anywhere on it now copies the invite link.
  - _Why:_ Two side-by-side copy actions made people stop and decide which to use, and the bare room code is rarely what you want to share, the join link is.
  - _UX value:_ One control, one outcome. Less to parse, and the action that matters (invite a teammate) is the default.
- **Design system styleguide page** — browse it live at **[jomretro.com/styleguide.html](https://jomretro.com/styleguide.html)**. A single-page, self-contained reference documenting the whole visual language: color tokens (surfaces, text, brand, danger, the 8 sticky tints), the Inter Tight / Chivo Mono type scale, spacing, radius, and elevation, plus live specimens of every component (buttons, inputs, menu items, avatars, surfaces, sticky notes, keys). It's a second Vite entry that links the real `src/styles.css`, so Vite bundles the production stylesheet into it and every swatch and specimen renders from production tokens, never drifting.
  - _Why:_ The system had grown a full primitive vocabulary with nowhere to see it whole. New work needs one canonical place to check what already exists before hand-rolling a one-off.
  - _UX value:_ Browse the system the way other teams browse Polaris or Primer, with a sticky section nav and a titled foundations-then-components layout.
- **Design-system consistency pass.** Pulled the whole UI onto shared, reusable primitives so components stop drifting: one icon set (`icons.tsx`), one tokenised radius scale (`--radius-sm/--radius/--radius-lg` = 6/8/12), one button system (`.btn` with `primary/accent/danger/ghost` variants, `sm/lg` sizes, `icon`/`block` shapes, and built-in `hover/active/focus-visible/disabled` states), one dropdown-row system (`.menu-item`), and one card surface (`.surface`). Added a `--color-danger` token shared by destructive buttons and inline errors.
  - _Why:_ Buttons and actions had quietly diverged in radius, height, and styling (stacked lobby CTAs at different heights, rounded-rect confirm buttons amongst pill buttons, stray inline SVGs and a duplicated cursor shape). Each new feature was reinventing the same primitives slightly differently.
  - _UX value:_ Every button, menu, icon, and card now reads as one family, and new work composes existing primitives instead of hand-rolling one-offs.
- **Account menu redesign.** A compact, professional popover: uppercase labels, a tidy display-name input, a log-out icon, an entrance animation, and a two-step **sign-out confirmation** so it can't happen by accident.
- **Host lobby editing.** Hosts can rename the retro inline from the lobby (hover-reveal pencil, Enter/Esc) and get a **Copy room link** action right under Start retro, no need to reach for the topbar.
- **Session timer (timebox).** A host-driven countdown lives in the board topbar as a compact seven-segment LCD module: a tinted readout beside its controls, set apart from the other topbar actions. The host picks a duration (5/10/15/20 min or custom); controls cover pause/resume, add time (+1/5/10/15 via a menu), restart, and end. Participants see a read-only countdown.
  - _Why:_ Retros run long without a shared clock. Facilitators timebox each phase (brainwriting, grouping, discussion) and the whole room needs to feel the same time pressure off one source of truth.
  - _UX value:_ One glanceable clock for everyone. The readout runs green, shifts to amber at a quarter left, then red under a minute with a soft breathing pulse, paired with a two-tone chime at 30 seconds and at zero. Expiry is soft (time's up, but input stays open) rather than a hard cutoff, so a good discussion isn't guillotined. Sound is per-person and mutable.
- **Two-step start (arm, then Start).** Choosing a duration never auto-starts the clock. It shows a neutral "armed" state and waits for the host to press Start.
  - _Why:_ Hosts set the timer up while still talking; an auto-start would burn the box before the room is ready.
  - _UX value:_ The facilitator owns the exact moment the room begins, like a referee's whistle. Green is reserved strictly for a live countdown, so the colour itself signals "we have started."
- **Timer design options gallery** — browse it live at **[jomretro.com/timer-preview](https://jomretro.com/timer-preview)**. An interactive, unlinked reference showing every treatment explored (inline band, clock-style pie dial, LCD agenda card, expiration ring pill) and the shipped slim topbar LCD, across all states (idle, armed, running, ending, paused, expired) for both host and participant.
  - _Why:_ The timer went through several visual directions; one living page documents the decision and the alternatives instead of losing them to chat history.

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

## Design system

The UI composes from a small set of reusable primitives. Prefer these over one-off styles; don't hand-inline an SVG or hand-roll a button.

A live, browsable reference of the whole system (tokens, type scale, and every component) is published at **[jomretro.com/styleguide.html](https://jomretro.com/styleguide.html)** (source: `styleguide.html`, a second Vite entry). It links `src/styles.css` directly, so it always reflects the current production styles.

**Icons** — `src/icons.tsx` is the single source. Every glyph is a 24×24, `currentColor`, stroke-1.6, round-cap outline so the set reads as one family. Render with `<Icon name="..." size={…} />`. Multi-colour brand illustrations (`FormatGlyph`, the sailboat scene) and the `CursorArrow` shape are deliberately separate — they are not icons.

**Radius** — a tokenised scale: `--radius-sm` (6px, chips and menu rows), `--radius` (8px, inputs and small surfaces), `--radius-lg` (12px, cards, popovers, modals), `--radius-pill` (999px, buttons). Don't hardcode radii.

**Buttons** — one system, `.btn`:

```
Variants:  (default surface) · .primary · .accent · .danger · .ghost
Sizes:     .sm (26px) · default (30px) · .lg (42px)
Shapes:    pill · .icon (square → circle)
Layout:    .block (full width)
States:    :hover · :active · :focus-visible · :disabled   (built in)
```

Buttons are pill-shaped; never give a button a rectangular radius. Destructive actions use `.danger` (the `--color-danger` token, shared with inline error text).

**Menu items** — dropdown/popover rows use `.menu-item` (full-width, left-aligned, `radius-sm`), optionally `.danger`. These are list rows, not buttons.

**Cards / popovers** — use `.surface` (border + `radius-lg` + `--shadow-sm`). Layout-only classes (e.g. `.lobby-card`) sit on top of it; they never re-declare the surface treatment.

**Text links** — inline link-style actions use `.quiet-link`.

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
