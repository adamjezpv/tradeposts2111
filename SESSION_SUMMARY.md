# SESSION SUMMARY — TradePosts.io
> Wygenerowano: 2026-05-19 | Następna sesja: kontynuacja buildu MVP

---

## PROJEKT W SKRÓCIE

**TradePosts.io** — AI auto-poster na Google Business Profile dla firm usługowych (hydraulicy, elektricy, HVAC, roofers). $19/mies. Solo, $39/mies. Agency. Stack: Next.js 15 Edge Runtime + Supabase + Groq AI + Stripe.

Szczegółowy research, architektura i strategia marketingowa: **BREADCRUMBS.md**

---

## CO JEST GOTOWE ✅

### UI / Frontend
- **Landing page** (`app/page.tsx`) — kompletna: hero, bento-grid benefits, pricing z togglem monthly/annual, FAQ accordion, CTA, footer, animacje
- **Login page** (`app/login/page.tsx`) — email/password + Google OAuth button, switch sign-in/sign-up
- **Dashboard** (`app/(dashboard)/dashboard/page.tsx`) — welcome, trial countdown z progress bar, account status, connect GBP card, upcoming posts grid
- **Posts page** (`app/(dashboard)/posts/page.tsx`) — lista postów z color-coded status badges (published/scheduled/failed/pending), triggeruje EditPostModal
- **Edit Post Modal** (`app/(dashboard)/posts/_components/EditPostModal.tsx`) — two-column: edytor tekstu + AI chat console (Gemini), datetime picker, save changes
- **Locations page** (`app/(dashboard)/locations/page.tsx`) — lista lokalizacji, GeneratePostsButton per location, LocationScheduleForm
- **Settings page** (`app/(dashboard)/settings/page.tsx`) — info o koncie, plan, trial ends, UpgradeButton, danger zone (disabled)
- **Sidebar** (`app/(dashboard)/_components/Sidebar.tsx`)

### Backend / API
- **Google OAuth initiation** (`app/api/auth/google/route.ts`) — inicjuje OAuth z scope `business.manage`, PKCE
- **Google OAuth callback** (`app/api/auth/google/callback/route.ts`) — wymienia code na sesję Supabase, redirect do /dashboard
- **Mock location connect** (`app/api/locations/mock-connect/route.ts`) — tworzy testową lokalizację "Tomek Plumbing Services LLC", upsertuje user row
- **AI post generation** (`app/api/posts/generate/route.ts`) — KOMPLETNY: Groq llama-3.3-70b, 4 posty per lokalizacja, system prompt dla trades, Unsplash images per trade type, custom scheduling (days-of-week lub interval), AI usage logging
- **Post PATCH/DELETE** (`app/api/posts/[id]/route.ts`) — edycja treści i scheduled_at
- **Location PATCH/DELETE** (`app/api/locations/[id]/route.ts`)
- **Cron publish** (`app/api/cron/publish/route.ts`) — sprawdza `post_queue` gdzie `status='scheduled'` i `scheduled_at <= NOW()`, **UWAGA: tylko markuje jako published w DB, nie wywołuje GBP API**
- **Stripe checkout** (`app/api/billing/checkout/route.ts`) — tworzy/pobiera Stripe customer, generuje checkout session
- **Stripe webhook** (`app/api/billing/webhook/route.ts`) — obsługuje `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
- **Gemini AI assistant** (`app/api/assistant/chat/route.ts`) — rewriting postów via Gemini 2.0 Flash

### Database
- **Supabase migration** (`supabase/migrations/001_initial_schema.sql`) — tabele: users, locations, google_tokens, post_queue, post_history, ai_usage_log, subscriptions; indeksy; RLS policies; trigger `on_auth_user_created`

---

## CO BRAKUJE / BUGS DO NAPRAWIENIA 🔴

### KRYTYCZNE (blokują działanie produktu)

**1. GBP API nigdy nie jest wywoływane**
- Plik: `app/api/cron/publish/route.ts`
- Cron publish tylko zmienia `status='published'` w DB — nigdy nie wysyła posta do Google Business Profile
- Trzeba: pobrać `google_tokens` dla danego usera → zrefreshować token jeśli wygasły → wywołać `POST https://mybusiness.googleapis.com/v4/{location}/localPosts`
- To jest **core feature produktu** — bez tego nic realnie się nie publikuje

**2. Google tokeny OAuth nie są zapisywane**
- Plik: `app/api/auth/google/callback/route.ts`
- Callback tylko tworzy Supabase session, ale NIE wyciąga access_token/refresh_token z OAuth response i NIE zapisuje ich do tabeli `google_tokens`
- Trzeba: po `exchangeCodeForSession` wyciągnąć provider tokens z sesji i zapisać do `google_tokens`

**3. Mismatch w DB schema — kolumny których nie ma w migracji**
- Kolumny używane w kodzie ale BRAK w `001_initial_schema.sql`:
  - `locations.generation_interval_days` (używane w `generate/route.ts`)
  - `locations.posting_days_of_week` (używane w `generate/route.ts`)
  - `locations.posting_hour` (używane w `generate/route.ts`)
  - `post_queue.image_url` (używane w `generate/route.ts`; migracja ma `media_url`)
  - `users.subscription_status` (używane w `billing/webhook/route.ts`)
- Trzeba: napisać migrację `002_add_scheduling_columns.sql`

**4. Stripe webhook ustawia zły plan**
- Plik: `app/api/billing/webhook/route.ts` linia 44
- Ustawia `plan: 'premium'` — ale app używa `plan: 'solo'` i `plan: 'agency'`
- Checkout session tworzy jeden `STRIPE_PRICE_ID` — brak rozróżnienia solo vs agency
- Trzeba: dwa Stripe price ID (env vars), logika w webhooks rozróżniająca plany

### WAŻNE (brakujące funkcje)

**5. Brak `/api/cron/generate` route**
- BREADCRUMBS przewiduje weekly cron który generuje posty dla wszystkich aktywnych lokalizacji
- Istnieje tylko `/api/cron/publish` — brak `/api/cron/generate`
- Trzeba: stworzyć route który iteruje po wszystkich `locations WHERE active=true` i wywołuje generate dla każdej

**6. Brak `vercel.json` z cron jobs**
- BREADCRUMBS przewiduje dwa cron jobs:
  ```json
  { "path": "/api/cron/publish", "schedule": "0 * * * *" }
  { "path": "/api/cron/generate", "schedule": "0 9 * * 1" }
  ```
- Plik `vercel.json` nie istnieje

**7. Brak enforced plan limits**
- trial: max 1 lokalizacja, 4 posty tylko preview (bez auto-publish)
- solo: max 1 lokalizacja, auto-publish
- agency: max 5 lokalizacji
- Nigdzie w kodzie nie ma sprawdzania tych limitów

**8. Settings page — błędna cena**
- Plik: `app/(dashboard)/settings/page.tsx` linia 60
- Pokazuje "Premium Plan — $49/month" — ale landing page ma Solo $19 i Agency $39
- Trzeba: poprawić cenę i opis

**9. Brak email onboardingu (Resend)**
- BREADCRUMBS przewiduje 6-emailową sekwencję onboardingową
- Żadnej integracji z Resend nie ma

**10. Account delete — permanently disabled**
- `app/(dashboard)/settings/page.tsx` — przycisk delete jest `disabled` i mówi "coming soon"

---

## MISMATCH: BREADCRUMBS vs RZECZYWISTOŚĆ

| Feature z BREADCRUMBS | Status |
|---|---|
| Landing page | ✅ Gotowe |
| Login (email + Google OAuth) | ✅ Gotowe |
| Dashboard | ✅ Gotowe |
| DB schema (wszystkie tabele) | ⚠️ Częściowo — brak kolumn scheduling |
| Google OAuth + token storage | ⚠️ OAuth flow działa, tokeny NIE są zapisywane |
| GBP API publish | ❌ Brak — tylko mock DB update |
| AI generation (Groq) | ✅ Gotowe |
| Edit post + Gemini assistant | ✅ Gotowe (bonus, nie było w BREADCRUMBS) |
| Cron publish | ⚠️ Istnieje, ale nie wywołuje GBP API |
| Cron generate | ❌ Brak |
| vercel.json | ❌ Brak |
| Stripe checkout | ✅ Gotowe |
| Stripe webhooks | ⚠️ Gotowe, ale ustawia zły plan name |
| Plan enforcement | ❌ Brak |
| Email onboarding (Resend) | ❌ Brak |
| Scheduling config per location | ✅ UI gotowe, logika w generate route |

---

## PRIORYTETY NA NASTĘPNĄ SESJĘ

### Kolejność napraw (impact vs effort):

1. **[EASY FIX]** Migracja DB — dodać brakujące kolumny (`002_add_scheduling_columns.sql`)
2. **[EASY FIX]** Stripe webhook — naprawić `plan: 'premium'` → `plan: 'solo'`
3. **[EASY FIX]** Settings page — naprawić cenę $49 → $19 / $39
4. **[EASY FIX]** `vercel.json` — dodać cron jobs configuration
5. **[MEDIUM]** Zapisywanie Google OAuth tokens w callback route
6. **[MEDIUM]** `/api/cron/generate` — weekly batch generation route
7. **[MEDIUM]** Plan limits enforcement (middleware lub per-route checks)
8. **[HARD]** Prawdziwe wywołanie GBP API w cron publish (wymaga: google_tokens, token refresh, GBP API call)

---

## ŚRODOWISKO / ENV VARS (potrzebne)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=           # Solo plan price ID
STRIPE_PRICE_ID_AGENCY=    # Agency plan price ID (do dodania)
STRIPE_WEBHOOK_SECRET=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## STACK

```
Frontend:   Next.js 15.3 App Router, React 19, Tailwind CSS 3.4
Backend:    Next.js API Routes (Edge Runtime)
Auth:       Supabase Auth + Google OAuth 2.0
Database:   Supabase PostgreSQL (Free tier)
AI gen:     Groq API — llama-3.3-70b-versatile
AI edit:    Google Gemini 2.0 Flash (@google/genai)
Payments:   Stripe ^22.1.1
Hosting:    Vercel (Pro wymagany dla cron + commercial use)
```

---

## PLIKI KLUCZOWE

```
app/page.tsx                           Landing page (kompletna)
app/login/page.tsx                     Login (kompletna)
app/(dashboard)/dashboard/page.tsx     Dashboard
app/(dashboard)/posts/page.tsx         Posts list
app/(dashboard)/posts/_components/EditPostModal.tsx  Edit + AI chat
app/(dashboard)/locations/page.tsx     Locations
app/(dashboard)/settings/page.tsx      Settings (BUG: cena $49)
app/api/auth/google/route.ts           OAuth init
app/api/auth/google/callback/route.ts  OAuth callback (BUG: nie zapisuje tokenów)
app/api/posts/generate/route.ts        AI generation (kompletna)
app/api/cron/publish/route.ts          Cron (BUG: nie wywołuje GBP API)
app/api/billing/checkout/route.ts      Stripe checkout
app/api/billing/webhook/route.ts       Stripe webhook (BUG: zły plan name)
app/api/assistant/chat/route.ts        Gemini AI assistant
app/api/locations/mock-connect/route.ts  Dev mock (do usunięcia w prod)
supabase/migrations/001_initial_schema.sql  DB schema (NIEKOMPLETNA)
```
