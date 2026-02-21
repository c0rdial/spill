# Spill — "Say something real."

Prompt-based dating app for KL. Users answer a daily prompt, see up to 5 anonymous answers (weighted by shared interests), and can "dare" each one. Mutual dare = match. Photos/names revealed only after matching.

## Database Schema

Seven tables: `users`, `interest_tags`, `prompts`, `answers`, `reveals`, `matches`, `messages`.

- `users` — includes `gender` (man/woman/nonbinary), `show_me` (text array, multi-select), `interests` (text array). GIN indexes on `interests` and `show_me`.
- `interest_tags` — reference table of curated tags with `label` + `category` (music, events, lifestyle). Used during onboarding for the interest picker.
- `prompts` — one per day via `active_date`. 30 seed prompts starting 2026-03-01.
- `answers` — 400 char limit. One per user per prompt (`unique(user_id, prompt_id)`).
- `reveals` — tracks which anonymous answer was shown to which user. Action: `pending` → `dare` | `pass`. Replaces the old `dares` table. `unique(viewer_id, answerer_id, prompt_id)`.
- `matches` — created by `check_mutual_dare()` trigger on `reveals`. `unique(user_a_id, user_b_id, prompt_id)`.
- `messages` — text-only chat within a match.

`check_mutual_dare()` trigger fires on INSERT or UPDATE on `reveals`. When a dare is placed, it checks for a reciprocal dare on the same prompt and auto-inserts into `matches`.

`get_reveals_for_user(p_user_id, p_prompt_id, p_limit)` — Supabase RPC (`security definer`). Returns up to 5 reveals weighted by interest overlap. Filters by bidirectional gender preferences (`show_me`), excludes already-revealed users (cross-day) and existing matches. Inserts `reveals` rows atomically.

RLS enabled on all 7 tables. Answers are only accessible to the author via direct query — other users' answers are surfaced exclusively through the `get_reveals_for_user` RPC.

Schema SQL, seed data, trigger, RPC, and RLS policies are all defined in the PRD (sections 8–9).

## Auth Flow

Phone OTP via Supabase Auth. After verification, check for `users` row:
- No row → `/onboarding` (multi-step)
- Row exists → `/spill`

Auth state via `useAuth()` hook subscribing to `onAuthStateChange`.

## Route Structure (Flat + AuthGuard)

```
/login          — phone OTP
/onboarding     — multi-step profile creation
/spill          — daily prompt loop (default)
/matches        — mutual match list
/matches/$matchId — realtime chat
/profile        — view/edit profile
```

`AuthGuard` in root route: no session → `/login`, session but no profile → `/onboarding`, otherwise → children + bottom nav.

## Onboarding — Multi-Step

Four steps in a single route with local state:

1. **Basic** — name, age
2. **Preferences** — gender (single select: Man / Woman / Nonbinary via `GenderSelect`), show me (multi-select: Men / Women / Nonbinary via `ShowMeSelect`)
3. **Profile** — photo upload (Supabase Storage `avatars` bucket), bio (140 char)
4. **Interests** — pick minimum 3 from curated tags by category via `InterestPicker`

CTA: "Start Spilling" → insert `users` row → navigate to `/spill`.

## Today's Spill — Core Loop

Single route, multi-phase local state:

1. **Prompt** — full-screen prompt card
2. **Answer** — textarea (400 char limit), submit
3. **Reveals** — call `get_reveals_for_user` RPC → receive up to 5 reveal cards. Carousel of `RevealCard` components with card flip animation (Framer Motion rotateY).
4. **Action** — per card: Dare / Pass buttons. Updates `reveals.action` and `reveals.acted_at`.
5. **Done** — all reveals acted on → "You've spilled for today" state. If no reveals available → "Not enough spills yet — check back later today" with pull-to-refresh.

Match detection: Supabase Realtime subscription on `matches` table. If a new match row appears for the current user during the session, show a match alert overlay.

## Matches & Chat

- `/matches` — query where user is `user_a_id` or `user_b_id`, join `users` for name + photo
- `/matches/$matchId` — Supabase Realtime subscription on `messages` filtered by `match_id`

Realtime enabled on both `messages` and `matches` tables.

## Component Structure

```
src/
  lib/supabase.ts, types.ts
  hooks/useAuth, useUser, useTodayPrompt, useReveals, useMatches, useMessages, useInterestTags
  components/AuthGuard, BottomNav, PromptCard, AnswerInput, RevealCarousel, RevealCard,
             DareButtons, MatchCard, ChatMessage, ChatInput, PhotoUpload,
             GenderSelect, ShowMeSelect, InterestPicker
  routes/__root, index, login, onboarding, spill, matches, matches.$matchId, profile
```

## Design System

- Primary accent: `#C0392B` (deep red)
- Background: `#0A0A0A` (near-black)
- Text: `#FAFAFA` (off-white)
- Cards: `#1A1A1A` with subtle border
- Mobile-first, `max-w-[430px] mx-auto`
- Bottom nav: fixed, 3 tabs (Spill | Matches | Profile), red accent active state
- Bold typography, system font stack

## Not in MVP

Push notifications, blocking/reporting, prompt admin UI, photo moderation, read receipts, location/distance matching, multiple photos, video, paid tiers.
