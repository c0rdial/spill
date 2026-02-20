# Spill App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a prompt-based dating app where users answer daily prompts, see one anonymous answer, and can "dare" to match.

**Architecture:** Flat route structure with AuthGuard. Code-based TanStack Router (already set up). React Query for server state, Supabase for auth/db/realtime/storage. Framer Motion for card flip animation.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, TanStack Router 1.161, TanStack React Query 5.90, Supabase JS 2.97, Framer Motion 12.34, Tailwind CSS 4.2

---

### Task 1: Run database schema in Supabase

**Files:** None (SQL executed in Supabase dashboard or CLI)

**Step 1: Run the schema SQL**

Execute this SQL in the Supabase SQL Editor (dashboard → SQL Editor → New query):

```sql
-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text not null,
  age integer not null,
  bio text check (char_length(bio) <= 140),
  photo_url text,
  created_at timestamptz default now()
);

-- Prompts
create table prompts (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  active_date date unique,
  created_at timestamptz default now()
);

-- Answers
create table answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  prompt_id uuid references prompts(id) on delete cascade,
  text text check (char_length(text) <= 280),
  created_at timestamptz default now(),
  unique(user_id, prompt_id)
);

-- Dares
create table dares (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references users(id) on delete cascade,
  receiver_id uuid references users(id) on delete cascade,
  prompt_id uuid references prompts(id),
  created_at timestamptz default now(),
  unique(sender_id, receiver_id, prompt_id)
);

-- Matches
create table matches (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid references users(id) on delete cascade,
  user_b_id uuid references users(id) on delete cascade,
  prompt_id uuid references prompts(id),
  created_at timestamptz default now()
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references users(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- Mutual dare trigger
create or replace function check_mutual_dare()
returns trigger as $$
begin
  if exists (
    select 1 from dares
    where sender_id = NEW.receiver_id
    and receiver_id = NEW.sender_id
    and prompt_id = NEW.prompt_id
  ) then
    insert into matches (user_a_id, user_b_id, prompt_id)
    values (NEW.sender_id, NEW.receiver_id, NEW.prompt_id);
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger on_dare_insert
after insert on dares
for each row execute function check_mutual_dare();

-- Seed a prompt for today
insert into prompts (text, active_date)
values ('What''s a truth about you that would surprise most people?', current_date);
```

**Step 2: Enable Realtime on messages table**

In Supabase dashboard → Database → Replication, enable realtime for the `messages` table.

**Step 3: Create storage bucket**

In Supabase dashboard → Storage, create a public bucket called `avatars`.

**Step 4: Enable Phone Auth**

In Supabase dashboard → Authentication → Providers, enable Phone provider (use Twilio or test mode for development).

---

### Task 2: TypeScript types

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Create types file**

```typescript
// src/lib/types.ts
export type User = {
  id: string;
  phone: string;
  name: string;
  age: number;
  bio: string | null;
  photo_url: string | null;
  created_at: string;
};

export type Prompt = {
  id: string;
  text: string;
  active_date: string | null;
  created_at: string;
};

export type Answer = {
  id: string;
  user_id: string;
  prompt_id: string;
  text: string;
  created_at: string;
};

export type Dare = {
  id: string;
  sender_id: string;
  receiver_id: string;
  prompt_id: string;
  created_at: string;
};

export type Match = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  prompt_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};
```

**Step 2: Verify**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add database TypeScript types"
```

---

### Task 3: Tailwind theme + global styles

**Files:**
- Modify: `src/index.css`

**Step 1: Update index.css with Tailwind v4 theme**

```css
@import "tailwindcss";

@theme {
  --color-spill-red: #C0392B;
  --color-spill-bg: #0A0A0A;
  --color-spill-card: #1A1A1A;
  --color-spill-text: #FAFAFA;
  --color-spill-muted: #6B7280;
  --color-spill-border: #2A2A2A;
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add Spill design tokens to Tailwind theme"
```

---

### Task 4: Auth hook — useAuth

**Files:**
- Create: `src/hooks/useAuth.ts`

**Step 1: Create useAuth hook**

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: add useAuth hook for session management"
```

---

### Task 5: User profile hook — useUser

**Files:**
- Create: `src/hooks/useUser.ts`

**Step 1: Create useUser hook**

```typescript
// src/hooks/useUser.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { User } from "../lib/types";

export function useUser(authUserId: string | undefined) {
  return useQuery({
    queryKey: ["user", authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", (await supabase.auth.getUser()).data.user?.phone ?? "")
        .maybeSingle();
      if (error) throw error;
      return data as User | null;
    },
    enabled: !!authUserId,
  });
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/hooks/useUser.ts
git commit -m "feat: add useUser hook for profile queries"
```

---

### Task 6: AuthGuard + BottomNav components

**Files:**
- Create: `src/components/AuthGuard.tsx`
- Create: `src/components/BottomNav.tsx`

**Step 1: Create AuthGuard**

```tsx
// src/components/AuthGuard.tsx
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { data: user, isLoading: userLoading } = useUser(session?.user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || userLoading) return;
    if (!session) {
      navigate({ to: "/login" });
    } else if (!user) {
      navigate({ to: "/onboarding" });
    }
  }, [session, user, authLoading, userLoading, navigate]);

  if (authLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-spill-bg">
        <div className="text-spill-muted text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || !user) return null;

  return <>{children}</>;
}
```

**Step 2: Create BottomNav**

```tsx
// src/components/BottomNav.tsx
import { Link, useMatchRoute } from "@tanstack/react-router";

const tabs = [
  { to: "/spill" as const, label: "Spill" },
  { to: "/matches" as const, label: "Matches" },
  { to: "/profile" as const, label: "Profile" },
];

export function BottomNav() {
  const matchRoute = useMatchRoute();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-spill-card border-t border-spill-border">
      <div className="max-w-[430px] mx-auto flex">
        {tabs.map((tab) => {
          const isActive = matchRoute({ to: tab.to, fuzzy: true });
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
                isActive
                  ? "text-spill-red"
                  : "text-spill-muted"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 3: Verify**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/AuthGuard.tsx src/components/BottomNav.tsx
git commit -m "feat: add AuthGuard and BottomNav components"
```

---

### Task 7: Login route

**Files:**
- Create: `src/routes/login.tsx`

**Step 1: Create login route**

```tsx
// src/routes/login.tsx
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { rootRoute } from "./__root";
import { supabase } from "../lib/supabase";

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function sendOtp() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      setError(error.message);
    } else {
      setStep("otp");
    }
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    if (error) {
      setError(error.message);
    } else {
      navigate({ to: "/spill" });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-spill-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[430px]">
        <h1 className="text-5xl font-bold text-spill-text mb-2">spill</h1>
        <p className="text-spill-muted mb-10">Say something real.</p>

        {step === "phone" ? (
          <>
            <label className="block text-spill-text text-sm font-medium mb-2">
              Phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text placeholder-spill-muted focus:outline-none focus:border-spill-red"
            />
            <button
              onClick={sendOtp}
              disabled={loading || !phone}
              className="w-full mt-4 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
            >
              {loading ? "Sending..." : "Send code"}
            </button>
          </>
        ) : (
          <>
            <label className="block text-spill-text text-sm font-medium mb-2">
              Enter the code sent to {phone}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text placeholder-spill-muted text-center text-2xl tracking-widest focus:outline-none focus:border-spill-red"
            />
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length < 6}
              className="w-full mt-4 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              onClick={() => setStep("phone")}
              className="w-full mt-2 text-spill-muted text-sm py-2"
            >
              Use a different number
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/routes/login.tsx
git commit -m "feat: add login route with phone OTP auth"
```

---

### Task 8: Onboarding route

**Files:**
- Create: `src/routes/onboarding.tsx`
- Create: `src/components/PhotoUpload.tsx`

**Step 1: Create PhotoUpload component**

```tsx
// src/components/PhotoUpload.tsx
import { useState } from "react";
import { supabase } from "../lib/supabase";

type Props = {
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
};

export function PhotoUpload({ onUploaded, currentUrl }: Props) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) {
      alert(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
  }

  return (
    <label className="block cursor-pointer">
      <div className="w-24 h-24 rounded-full bg-spill-card border-2 border-dashed border-spill-border flex items-center justify-center overflow-hidden">
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-spill-muted text-xs">
            {uploading ? "..." : "+ Photo"}
          </span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
      />
    </label>
  );
}
```

**Step 2: Create onboarding route**

```tsx
// src/routes/onboarding.tsx
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { rootRoute } from "./__root";
import { supabase } from "../lib/supabase";
import { PhotoUpload } from "../components/PhotoUpload";

export const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: OnboardingPage,
});

function OnboardingPage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.phone) {
      setError("No authenticated user found");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("users").insert({
      phone: user.phone,
      name,
      age: parseInt(age),
      bio: bio || null,
      photo_url: photoUrl,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      navigate({ to: "/spill" });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-spill-bg flex flex-col items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[430px] space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-spill-text">Set up your profile</h1>
          <p className="text-spill-muted mt-1">This stays hidden until you match.</p>
        </div>

        <div className="flex justify-center">
          <PhotoUpload onUploaded={setPhotoUrl} currentUrl={photoUrl} />
        </div>

        <div>
          <label className="block text-spill-text text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text focus:outline-none focus:border-spill-red"
          />
        </div>

        <div>
          <label className="block text-spill-text text-sm font-medium mb-2">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            min={18}
            max={99}
            className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text focus:outline-none focus:border-spill-red"
          />
        </div>

        <div>
          <label className="block text-spill-text text-sm font-medium mb-2">
            Bio <span className="text-spill-muted">({140 - bio.length} left)</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={140}
            rows={3}
            className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text resize-none focus:outline-none focus:border-spill-red"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name || !age}
          className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
        >
          {loading ? "Saving..." : "Start spilling"}
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </form>
    </div>
  );
}
```

**Step 3: Verify**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/PhotoUpload.tsx src/routes/onboarding.tsx
git commit -m "feat: add onboarding route with profile creation and photo upload"
```

---

### Task 9: Today's Spill route (core loop + card flip)

**Files:**
- Create: `src/hooks/useTodayPrompt.ts`
- Create: `src/hooks/useRandomAnswer.ts`
- Create: `src/components/PromptCard.tsx`
- Create: `src/components/AnswerInput.tsx`
- Create: `src/components/RevealCard.tsx`
- Create: `src/components/DareButtons.tsx`
- Create: `src/routes/spill.tsx`

**Step 1: Create useTodayPrompt hook**

```typescript
// src/hooks/useTodayPrompt.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Prompt } from "../lib/types";

export function useTodayPrompt() {
  return useQuery({
    queryKey: ["todayPrompt"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("active_date", today)
        .single();
      if (error) throw error;
      return data as Prompt;
    },
  });
}
```

**Step 2: Create useRandomAnswer hook**

```typescript
// src/hooks/useRandomAnswer.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Answer } from "../lib/types";

export function useRandomAnswer(promptId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["randomAnswer", promptId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("answers")
        .select("*")
        .eq("prompt_id", promptId!)
        .neq("user_id", userId!)
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as Answer;
    },
    enabled: !!promptId && !!userId,
  });
}
```

**Step 3: Create PromptCard component**

```tsx
// src/components/PromptCard.tsx
type Props = {
  text: string;
  onReady: () => void;
};

export function PromptCard({ text, onReady }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <p className="text-spill-muted text-sm font-medium uppercase tracking-wider mb-6">
        Today's spill
      </p>
      <h2 className="text-2xl font-bold text-spill-text text-center leading-snug mb-10">
        {text}
      </h2>
      <button
        onClick={onReady}
        className="bg-spill-red text-white font-semibold px-8 py-3 rounded-lg"
      >
        Answer this
      </button>
    </div>
  );
}
```

**Step 4: Create AnswerInput component**

```tsx
// src/components/AnswerInput.tsx
import { useState } from "react";

type Props = {
  onSubmit: (text: string) => void;
  loading: boolean;
};

export function AnswerInput({ onSubmit, loading }: Props) {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <p className="text-spill-muted text-sm font-medium uppercase tracking-wider mb-6">
        Your answer
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={280}
        rows={4}
        placeholder="Say something real..."
        className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text placeholder-spill-muted resize-none focus:outline-none focus:border-spill-red text-lg"
      />
      <p className="text-spill-muted text-xs mt-2 self-end">{280 - text.length}</p>
      <button
        onClick={() => onSubmit(text)}
        disabled={loading || !text.trim()}
        className="w-full mt-6 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
      >
        {loading ? "Submitting..." : "Spill it"}
      </button>
    </div>
  );
}
```

**Step 5: Create RevealCard with flip animation**

```tsx
// src/components/RevealCard.tsx
import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  answerText: string;
  onFlipped: () => void;
};

export function RevealCard({ answerText, onFlipped }: Props) {
  const [flipped, setFlipped] = useState(false);

  function handleFlip() {
    if (flipped) return;
    setFlipped(true);
    onFlipped();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <p className="text-spill-muted text-sm font-medium uppercase tracking-wider mb-6">
        Someone answered...
      </p>
      <div
        className="relative w-full h-64 cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <motion.div
          className="w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-spill-card border border-spill-border rounded-2xl flex items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-spill-muted text-lg font-medium">Tap to reveal</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 bg-spill-card border border-spill-red rounded-2xl flex items-center justify-center px-6"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-spill-text text-lg text-center leading-relaxed">
              {answerText}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

**Step 6: Create DareButtons component**

```tsx
// src/components/DareButtons.tsx
type Props = {
  onDare: () => void;
  onPass: () => void;
  loading: boolean;
};

export function DareButtons({ onDare, onPass, loading }: Props) {
  return (
    <div className="flex gap-4 px-6 mt-8">
      <button
        onClick={onPass}
        disabled={loading}
        className="flex-1 border border-spill-border text-spill-muted font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
      >
        Pass
      </button>
      <button
        onClick={onDare}
        disabled={loading}
        className="flex-1 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
      >
        Dare
      </button>
    </div>
  );
}
```

**Step 7: Create spill route (ties it all together)**

```tsx
// src/routes/spill.tsx
import { createRoute } from "@tanstack/react-router";
import { useState } from "react";
import { rootRoute } from "./__root";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useTodayPrompt } from "../hooks/useTodayPrompt";
import { useRandomAnswer } from "../hooks/useRandomAnswer";
import { PromptCard } from "../components/PromptCard";
import { AnswerInput } from "../components/AnswerInput";
import { RevealCard } from "../components/RevealCard";
import { DareButtons } from "../components/DareButtons";

export const spillRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/spill",
  component: SpillPage,
});

type Phase = "prompt" | "answer" | "reveal" | "action" | "done";

function SpillPage() {
  const { session } = useAuth();
  const { data: user } = useUser(session?.user?.id);
  const { data: prompt, isLoading: promptLoading } = useTodayPrompt();
  const [phase, setPhase] = useState<Phase>("prompt");
  const [loading, setLoading] = useState(false);
  const {
    data: randomAnswer,
    isLoading: answerLoading,
    refetch: fetchAnswer,
  } = useRandomAnswer(
    prompt?.id,
    user?.id,
  );

  async function submitAnswer(text: string) {
    if (!prompt || !user) return;
    setLoading(true);
    const { error } = await supabase.from("answers").insert({
      user_id: user.id,
      prompt_id: prompt.id,
      text,
    });
    if (error) {
      alert(error.message);
    } else {
      await fetchAnswer();
      setPhase("reveal");
    }
    setLoading(false);
  }

  async function handleDare() {
    if (!randomAnswer || !user || !prompt) return;
    setLoading(true);
    const { error } = await supabase.from("dares").insert({
      sender_id: user.id,
      receiver_id: randomAnswer.user_id,
      prompt_id: prompt.id,
    });
    if (error) alert(error.message);
    setPhase("done");
    setLoading(false);
  }

  function handlePass() {
    setPhase("done");
  }

  if (promptLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-spill-muted">Loading today's spill...</p>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-spill-muted">No prompt today. Check back tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-spill-bg pb-20">
      {phase === "prompt" && (
        <PromptCard text={prompt.text} onReady={() => setPhase("answer")} />
      )}
      {phase === "answer" && (
        <AnswerInput onSubmit={submitAnswer} loading={loading} />
      )}
      {phase === "reveal" && (
        answerLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-spill-muted">Finding someone...</p>
          </div>
        ) : randomAnswer ? (
          <RevealCard
            answerText={randomAnswer.text}
            onFlipped={() => setPhase("action")}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
            <p className="text-spill-text text-xl font-bold mb-2">You're early</p>
            <p className="text-spill-muted text-center">
              No one else has answered yet. Check back later.
            </p>
          </div>
        )
      )}
      {phase === "action" && randomAnswer && (
        <div>
          <RevealCard answerText={randomAnswer.text} onFlipped={() => {}} />
          <DareButtons onDare={handleDare} onPass={handlePass} loading={loading} />
        </div>
      )}
      {phase === "done" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <p className="text-spill-text text-2xl font-bold mb-2">Done for today</p>
          <p className="text-spill-muted text-center">
            Come back tomorrow for a new spill.
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 8: Verify**

Run: `npm run build`
Expected: PASS

**Step 9: Commit**

```bash
git add src/hooks/useTodayPrompt.ts src/hooks/useRandomAnswer.ts src/components/PromptCard.tsx src/components/AnswerInput.tsx src/components/RevealCard.tsx src/components/DareButtons.tsx src/routes/spill.tsx
git commit -m "feat: add Today's Spill route with prompt, answer, reveal flip, and dare flow"
```

---

### Task 10: Matches route

**Files:**
- Create: `src/hooks/useMatches.ts`
- Create: `src/components/MatchCard.tsx`
- Create: `src/routes/matches.tsx`

**Step 1: Create useMatches hook**

```typescript
// src/hooks/useMatches.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Match, User } from "../lib/types";

export type MatchWithUser = Match & { other_user: User };

export function useMatches(userId: string | undefined) {
  return useQuery({
    queryKey: ["matches", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, user_a:users!user_a_id(*), user_b:users!user_b_id(*)")
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((m) => {
        const otherUser = m.user_a.id === userId ? m.user_b : m.user_a;
        return { ...m, other_user: otherUser } as MatchWithUser;
      });
    },
    enabled: !!userId,
  });
}
```

**Step 2: Create MatchCard component**

```tsx
// src/components/MatchCard.tsx
import { Link } from "@tanstack/react-router";
import type { MatchWithUser } from "../hooks/useMatches";

type Props = {
  match: MatchWithUser;
};

export function MatchCard({ match }: Props) {
  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: match.id }}
      className="flex items-center gap-4 p-4 bg-spill-card rounded-xl border border-spill-border"
    >
      <div className="w-12 h-12 rounded-full bg-spill-border overflow-hidden flex-shrink-0">
        {match.other_user.photo_url && (
          <img
            src={match.other_user.photo_url}
            alt={match.other_user.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-spill-text font-semibold truncate">
          {match.other_user.name}
        </p>
        <p className="text-spill-muted text-sm">Matched</p>
      </div>
    </Link>
  );
}
```

**Step 3: Create matches route**

```tsx
// src/routes/matches.tsx
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useMatches } from "../hooks/useMatches";
import { MatchCard } from "../components/MatchCard";

export const matchesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/matches",
  component: MatchesPage,
});

function MatchesPage() {
  const { session } = useAuth();
  const { data: user } = useUser(session?.user?.id);
  const { data: matches, isLoading } = useMatches(user?.id);

  return (
    <div className="min-h-screen bg-spill-bg pb-20">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-spill-text">Matches</h1>
      </div>
      <div className="px-6 space-y-3">
        {isLoading ? (
          <p className="text-spill-muted">Loading...</p>
        ) : matches && matches.length > 0 ? (
          matches.map((m) => <MatchCard key={m.id} match={m} />)
        ) : (
          <div className="text-center py-20">
            <p className="text-spill-text text-xl font-bold mb-2">No matches yet</p>
            <p className="text-spill-muted">
              Answer today's spill and dare someone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Verify**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useMatches.ts src/components/MatchCard.tsx src/routes/matches.tsx
git commit -m "feat: add Matches route with match list"
```

---

### Task 11: Chat route with Supabase Realtime

**Files:**
- Create: `src/hooks/useMessages.ts`
- Create: `src/components/ChatMessage.tsx`
- Create: `src/components/ChatInput.tsx`
- Create: `src/routes/matches.$matchId.tsx`

**Step 1: Create useMessages hook with realtime**

```typescript
// src/hooks/useMessages.ts
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Message } from "../lib/types";

export function useMessages(matchId: string) {
  const queryClient = useQueryClient();
  const [realtimeReady, setRealtimeReady] = useState(false);

  const query = useQuery({
    queryKey: ["messages", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          queryClient.setQueryData<Message[]>(
            ["messages", matchId],
            (old) => [...(old ?? []), payload.new as Message],
          );
        },
      )
      .subscribe(() => setRealtimeReady(true));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, queryClient]);

  return { ...query, realtimeReady };
}
```

**Step 2: Create ChatMessage component**

```tsx
// src/components/ChatMessage.tsx
import type { Message } from "../lib/types";

type Props = {
  message: Message;
  isOwn: boolean;
};

export function ChatMessage({ message, isOwn }: Props) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isOwn
            ? "bg-spill-red text-white rounded-br-sm"
            : "bg-spill-card text-spill-text border border-spill-border rounded-bl-sm"
        }`}
      >
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
}
```

**Step 3: Create ChatInput component**

```tsx
// src/components/ChatInput.tsx
import { useState } from "react";

type Props = {
  onSend: (text: string) => void;
  disabled: boolean;
};

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-spill-bg border-t border-spill-border p-4">
      <div className="max-w-[430px] mx-auto flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Say something..."
          disabled={disabled}
          className="flex-1 bg-spill-card border border-spill-border rounded-full px-4 py-2 text-spill-text placeholder-spill-muted text-sm focus:outline-none focus:border-spill-red"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="bg-spill-red text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Create chat route**

```tsx
// src/routes/matches.$matchId.tsx
import { createRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { rootRoute } from "./__root";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useMessages } from "../hooks/useMessages";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";

export const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/matches/$matchId",
  component: ChatPage,
});

function ChatPage() {
  const { matchId } = useParams({ from: "/matches/$matchId" });
  const { session } = useAuth();
  const { data: user } = useUser(session?.user?.id);
  const { data: messages, isLoading } = useMessages(matchId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!user) return;
    await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      text,
    });
  }

  return (
    <div className="min-h-screen bg-spill-bg flex flex-col">
      <div className="px-6 pt-12 pb-4 border-b border-spill-border flex items-center gap-4">
        <Link to="/matches" className="text-spill-muted text-sm">&larr; Back</Link>
        <h1 className="text-lg font-bold text-spill-text">Chat</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 pb-20">
        {isLoading ? (
          <p className="text-spill-muted text-center">Loading...</p>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id}
            />
          ))
        ) : (
          <p className="text-spill-muted text-center py-10">
            Say something real.
          </p>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMessage} disabled={!user} />
    </div>
  );
}
```

**Step 5: Verify**

Run: `npm run build`
Expected: PASS

**Step 6: Commit**

```bash
git add src/hooks/useMessages.ts src/components/ChatMessage.tsx src/components/ChatInput.tsx src/routes/matches.\$matchId.tsx
git commit -m "feat: add Chat route with Supabase Realtime messaging"
```

---

### Task 12: Profile route

**Files:**
- Create: `src/routes/profile.tsx`

**Step 1: Create profile route**

```tsx
// src/routes/profile.tsx
import { createRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { rootRoute } from "./__root";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { PhotoUpload } from "../components/PhotoUpload";

export const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = useAuth();
  const { data: user } = useUser(session?.user?.id);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio ?? "");
      setPhotoUrl(user.photo_url);
    }
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ name, bio: bio || null, photo_url: photoUrl })
      .eq("id", user.id);
    if (error) {
      alert(error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-spill-bg pb-20">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-spill-text">Profile</h1>
      </div>
      <div className="px-6 space-y-6">
        <div className="flex justify-center">
          <PhotoUpload onUploaded={setPhotoUrl} currentUrl={photoUrl} />
        </div>

        <div>
          <label className="block text-spill-text text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text focus:outline-none focus:border-spill-red"
          />
        </div>

        <div>
          <label className="block text-spill-text text-sm font-medium mb-2">
            Bio <span className="text-spill-muted">({140 - bio.length} left)</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={140}
            rows={3}
            className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text resize-none focus:outline-none focus:border-spill-red"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !name}
          className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
        </button>

        <button
          onClick={handleSignOut}
          className="w-full border border-spill-border text-spill-muted font-semibold py-3 rounded-lg"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/routes/profile.tsx
git commit -m "feat: add Profile route with edit and sign out"
```

---

### Task 13: Wire all routes + update root layout

**Files:**
- Modify: `src/router.ts`
- Modify: `src/routes/__root.tsx`
- Modify: `src/routes/index.tsx`

**Step 1: Update root route with AuthGuard and BottomNav**

Replace `src/routes/__root.tsx`:

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet, useMatchRoute } from "@tanstack/react-router";
import { AuthGuard } from "../components/AuthGuard";
import { BottomNav } from "../components/BottomNav";

export const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const matchRoute = useMatchRoute();
  const isPublicRoute =
    matchRoute({ to: "/login" }) || matchRoute({ to: "/onboarding" });

  if (isPublicRoute) {
    return (
      <div className="max-w-[430px] mx-auto">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto">
      <AuthGuard>
        <Outlet />
        <BottomNav />
      </AuthGuard>
    </div>
  );
}
```

**Step 2: Update index route to redirect to /spill**

Replace `src/routes/index.tsx`:

```tsx
// src/routes/index.tsx
import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/spill" });
  },
});
```

**Step 3: Update router.ts with all routes**

Replace `src/router.ts`:

```typescript
// src/router.ts
import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./routes/__root";
import { indexRoute } from "./routes/index";
import { loginRoute } from "./routes/login";
import { onboardingRoute } from "./routes/onboarding";
import { spillRoute } from "./routes/spill";
import { matchesRoute } from "./routes/matches";
import { chatRoute } from "./routes/matches.$matchId";
import { profileRoute } from "./routes/profile";

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  onboardingRoute,
  spillRoute,
  matchesRoute,
  chatRoute,
  profileRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

**Step 4: Verify**

Run: `npm run build`
Expected: PASS

Run: `npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add src/router.ts src/routes/__root.tsx src/routes/index.tsx
git commit -m "feat: wire all routes with AuthGuard, BottomNav, and redirect"
```

---

### Task 14: Final verification

**Step 1: Full build**

Run: `npm run build`
Expected: PASS — clean TypeScript compilation and Vite build

**Step 2: Lint**

Run: `npm run lint`
Expected: PASS — zero errors

**Step 3: Dev server**

Run: `npm run dev`
Expected: Vite starts, visit `http://localhost:5173` — should redirect to `/login`

**Step 4: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: final scaffold verification"
```
