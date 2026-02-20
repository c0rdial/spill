# Spill — "Say something real."

Prompt-based dating app. Users answer a daily prompt, see one anonymous answer from another user, and can "dare" them. Mutual dare = match. Photos/names revealed only after matching.

## Database Schema

Six tables: `users`, `prompts`, `answers`, `dares`, `matches`, `messages`. Schema defined in SQL (run directly in hosted Supabase). `check_mutual_dare()` trigger auto-creates matches on mutual dares.

## Auth Flow

Phone OTP via Supabase Auth. After verification, check for `users` row:
- No row → `/onboarding` (name, age, bio 140 char, photo upload to Supabase Storage `avatars` bucket)
- Row exists → `/spill`

Auth state via `useAuth()` hook subscribing to `onAuthStateChange`.

## Route Structure (Flat + AuthGuard)

```
/login          — phone OTP
/onboarding     — profile creation
/spill          — daily prompt loop (default)
/matches        — mutual match list
/matches/$matchId — realtime chat
/profile        — view/edit profile
```

`AuthGuard` in root route: no session → `/login`, session but no profile → `/onboarding`, otherwise → children + bottom nav.

## Today's Spill — Core Loop

Single route, multi-phase local state:

1. **Prompt** — full-screen prompt card
2. **Answer** — textarea (280 char), submit
3. **Reveal** — card flip animation (Framer Motion rotateY), one random anonymous answer
4. **Action** — Dare / Pass buttons
5. **Done** — confirmation, wait for tomorrow

Random answer: query `answers` for today's prompt, exclude current user, one random row. No answers yet → "you're early" state.

## Matches & Chat

- `/matches` — query where user is `user_a_id` or `user_b_id`, join `users` for name + photo
- `/matches/$matchId` — Supabase Realtime subscription on `messages` filtered by `match_id`

## Component Structure

```
src/
  lib/supabase.ts, types.ts
  hooks/useAuth, useUser, useTodayPrompt, useRandomAnswer, useMatches, useMessages
  components/AuthGuard, BottomNav, PromptCard, AnswerInput, RevealCard,
             DareButtons, MatchCard, ChatMessage, ChatInput, PhotoUpload
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

Push notifications, blocking/reporting, prompt admin UI, photo moderation, read receipts, location matching.
