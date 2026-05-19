# BREADCRUMBS.md
> Research rynkowy + wybrany pomysł + architektura + strategia marketingowa
> Data: 2026-05-18 | Budżet: 300 PLN (~75 USD) | Stack: Next.js Edge Runtime + Supabase + darmowe API

---

## 1. WYNIKI RESEARCHU — TOP 5 KANDYDATÓW

### Metodologia
Przeszukano: IndieHackers, ProductHunt, Reddit (r/SaaS, r/microsaas), Flowjam, NxCode, Superframeworks, Freemius 2025 State of MicroSaaS, Supabase/Vercel pricing docs, Groq rate limit docs.

Kryteria oceny:
- Fit techniczny z Edge Runtime + Supabase (bez Node.js runtime, bez ciężkich plików)
- Koszt AI na użytkownika (Groq free tier: ~14 400 req/dzień)
- Automatyzacja (ile pracy po wdrożeniu?)
- Nisza bez dominującego gracza w przedziale $9–29/mies.
- Dostępność darmowych API

---

### #1 — AI Google Business Profile Post Scheduler dla branż tradycyjnych

**Co robi:** Automatycznie generuje i publikuje 4 posty miesięcznie na Google Business Profile (GBP) dla małych firm usługowych (hydraulicy, elektricy, HVAC). Łączy się przez GBP API, pobiera listę usług, AI pisze posty w języku branżowym, Vercel Cron publikuje wg harmonogramu.

| Parametr | Ocena |
|---|---|
| Konkurencja | Paige ($29/mo, agencje), BrightLocal ($39/mo) — brak taniego, prostego narzędzia B2C |
| Użycie AI | 4 req/user/mies → 250 userów = 1 000 req/mies → w Groq free tier |
| Automatyzacja | 9/10 — cron job, zero ingerencji |
| Fit z Edge Runtime | Idealny — stateless API routes + cron |
| Supabase bandwidth | Minimalne — tylko text, tokeny OAuth |
| Cena | $19/mies. solo, $39/mies. agencja (do 5 lokalizacji) |
| MRR @ 100 klientów | $1 900 |

**Ryzyko:** Zmiana ToS Google GBP API (monitorowalne). Vercel Hobby nie pozwala na commercial use → wymagany Pro ($20/mies.).

---

### #2 — AI Formularz Zgody + Instrukcje Pielęgnacji dla Tatuażystów

**Co robi:** Generuje customizowane formularze zgody (prawne) i instrukcje pielęgnacji po zabiegu. Klient podpisuje cyfrowo przez link SMS/email. PDF przechowywany w Supabase Storage.

| Parametr | Ocena |
|---|---|
| Konkurencja | Venue Ink ($50/mo), Porter ($250/mo) — brak standalone, taniego narzędzia |
| Użycie AI | ~40 req/user/mies (2 na klienta × 20 klientów) |
| Automatyzacja | 8/10 |
| Fit z Edge Runtime | Dobry, ale PDF storage przekracza 500MB free tier (~10GB przy 500 userach) |
| Problem | PDF w Supabase Storage kosztuje na większej skali |
| Cena | $19/mies. solo, $39/mies. studio |
| MRR @ 100 klientów | $1 900 |

**Ryzyko:** Odpowiedzialność prawna za "AI-generated consent form". Wymaga disclaimera.

---

### #3 — AI Weekly Client Report Generator dla Freelancerów SEO

**Co robi:** Łączy się z GA4/GSC API, co tydzień pobiera dane, AI pisze narracyjny raport (nie dashboard — prawdziwy tekst), wysyła emailem do klienta freelancera w jego imieniu.

| Parametr | Ocena |
|---|---|
| Konkurencja | DashThis ($49/mo), AgencyAnalytics ($12/klient/mo) — brak AI narrative reporting |
| Użycie AI | ~2 000 req/mies @ 50 userów × 10 klientów = przekracza Groq free tier |
| Automatyzacja | 10/10 — w pełni autonomiczny |
| Problem | Mistral free (1B tokenów) lub płatny Groq od startu |
| Cena | $29/mies. do 5 klientów, $59/mies. do 20 |
| MRR @ 100 klientów | $2 900 |

**Ryzyko:** Koszt AI creep. Google API quota per property.

---

### #4 — AI Caption Generator dla Branż Usługowych (Instagram/Facebook)

**Co robi:** Hydraulicy/elektricy uploadują zdjęcie "przed/po", tool generuje 3 captiony z hashtagami branżowymi + scheduler na Meta Graph API.

| Parametr | Ocena |
|---|---|
| Konkurencja | Buffer, Hootsuite — nie niszowe, brak AI dla trades |
| Użycie AI | ~2 400 req/mies @ 200 userów × 3 posty/tydz — granica Groq free tier |
| Problem | Meta Graph API wymaga Business App Review (1–4 tyg.) |
| Automatyzacja | 6/10 — user musi uploadować zdjęcie |
| Cena | $12/mies., $24/mies. z schedulerem |
| MRR @ 100 klientów | $1 200 |

**Ryzyko:** Niższy przychód na usera, Meta API approval, user nadal musi robić coś ręcznie.

---

### #5 — Niszowy Job Board dla Ról AI-Adjacent (AI Ops, No-Code Builders)

**Co robi:** Kuratowany board ofert pracy dla specjalistów AI Automation / No-Code. Płatne posting per-job ($49–99) lub subskrypcja pracodawcy ($149/mies.).

| Parametr | Ocena |
|---|---|
| Konkurencja | RemoteOK, AIJobs.net (dormant), WeWorkRemotely |
| Użycie AI | Zerowe — czysty CRUD |
| Automatyzacja | 4/10 — wymaga ręcznej kuracji |
| Problem | Chicken-and-egg: bez kandydatów brak pracodawców |
| Czas do pierwszego przychodu | 60–90 dni minimum |
| MRR @ 50 postów | $2 450 |

**Ryzyko:** Wysoki nakład pracy manualnej, długa droga do revenue.

---

## 2. WYBRANY POMYSŁ

### TradePosts.io — AI Google Business Profile Auto-Poster dla Branż Usługowych

**Uzasadnienie wyboru:**

1. **Ból jest realny i udokumentowany.** Firmy usługowe, które regularnie postują na GBP, rankują wyżej w "near me" searches. 98% hydraulików/elektryków/HVAC-ów nie robi tego regularnie, bo jest to dla nich nużące i niezrozumiałe. Nie brakuje narzędzi — brakuje *prostego, taniego, zautomatyzowanego* narzędzia dedykowanego dla nie-technicznego właściciela małej firmy.

2. **Idealny fit z Edge Runtime + Supabase.** Zero ciężkich plików, zero wysokiej częstotliwości AI (4 req/user/mies.), zero bandwidth-heavy operations. Vercel Cron (free) + stateless Edge API routes = architektura, która nie wymaga upgrade'u do drogiej infrastruktury przez setki userów.

3. **Ekonomia jednostkowa jest atrakcyjna:**
   - Koszt infrastruktury @ 200 userów: ~$24/mies. (Vercel Pro $20 + Groq ~$3–5 + domena $1)
   - Przychód @ 200 userów: $4 800 MRR
   - Marża: ~99,5%

4. **Czas do pierwszego przychodu: 30–45 dni** przy aktywnym marketingu w niszowych grupach Facebook.

5. **Brak dominującego gracza w segmencie B2C $19/mies.** Paige (Merchynt) to narzędzie agencyjne. BrightLocal to suite dla profesjonalistów SEO. Nikt nie sprzedaje bezpośrednio hydraulikowi.

---

### Persona klienta

**Typ A: "Tomek Hydraulik"**
- Wiek: 35–55 lat
- Firma: 1–3 osobowa firma hydrauliczna/elektryczna/HVAC/dacharska
- Rynek: USA, UK, Australia, Kanada (anglojęzyczny, wysoka konkurencja w local search)
- Tech comfort: iPhone + Facebook + Square. Nie używa narzędzi SEO.
- Ból: Wie, że "powinien postować na Google", bo konkurent się wyżej pokazuje. Próbował — napisał 2 posty w styczniu, rzucił w lutym.
- Budget mentality: $19/mies. to mniej niż jeden dojazd do klienta. Płaci bez wahania za wszystko, co mu oszczędza czas i przynosi telefony.
- Ścieżka odkrycia: Grupy Facebook dla branżystów, Reddit, Google Search "how to get more Google calls"

**Typ B: "Maria - Freelance Marketing"**
- Zarządza GBP dla 5–15 lokalnych klientów
- Ręcznie pisze posty w Canva + Google Posts dashboard
- Zapłaci $39/mies. za automatyzację 15 klientów i oszczędność 3+ h/tydz.
- Odkrycie: r/SEO, LinkedIn, Twitter/X

---

### Analiza konkurencji

| Narzędzie | Cena | Target | Luka |
|---|---|---|---|
| Paige (Merchynt) | $29/mo | Agencje | UX zbyt skomplikowany dla solo-tradesman |
| BrightLocal | $39/mo | SEO pros | Brak AI post generation, wymaga wiedzy SEO |
| Semrush | $139/mo | Zespoły SEO | 10x za drogi, wymaga literacy SEO |
| Buffer/Hootsuite | $15–99/mo | Social media | Nie GBP-specyficzny, brak AI |
| **TradePosts** | **$19/mo** | **Tradesperson bezpośrednio** | **Prosty, niszowy, AI-powered, set-it-and-forget-it** |

---

### Prognoza przychodów

| Scenariusz | Klientów | Blend price | MRR | ARR |
|---|---|---|---|---|
| Walidacja | 10 | $19 | $190 | $2 280 |
| Break-even | 2 | $19 | $38 | — |
| Niski | 50 | $23 (mix) | $1 150 | $13 800 |
| Średni | 100 | $24 | $2 400 | $28 800 |
| Wysoki | 200 | $24 | $4 800 | $57 600 |

**Koszty infrastruktury @ 200 userów: ~$24/mies. → marża ~99,5%**

---

## 3. ARCHITEKTURA DANYCH (Supabase)

### Tabele

```sql
-- Konta użytkowników (auth przez Supabase Auth + Google OAuth)
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  email       TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'trial',   -- 'trial' | 'solo' | 'agency'
  trial_ends  TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Lokalizacje GBP (jedna firma może mieć wiele)
CREATE TABLE locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gbp_account_id  TEXT NOT NULL,   -- Google account ID
  gbp_location_id TEXT NOT NULL,   -- GBP location resource name
  business_name   TEXT NOT NULL,
  business_type   TEXT,            -- 'plumber' | 'electrician' | 'hvac' | 'roofer' | etc.
  services        TEXT[],          -- ['boiler repair', 'pipe relining', ...]
  tone            TEXT DEFAULT 'professional',  -- 'professional' | 'friendly' | 'local'
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tokeny OAuth Google (zaszyfrowane)
CREATE TABLE google_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token    TEXT NOT NULL,   -- szyfrowane przez Supabase Vault lub pgcrypto
  refresh_token   TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  scope           TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Kolejka postów (generowane z wyprzedzeniem, publikowane przez cron)
CREATE TABLE post_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,        -- wygenerowany tekst posta
  call_to_action  JSONB,               -- {type: 'CALL', url: null} itd.
  media_url       TEXT,                 -- opcjonalne zdjęcie (URL zewnętrzny lub Supabase Storage)
  scheduled_at    TIMESTAMPTZ NOT NULL, -- kiedy ma być opublikowany
  published_at    TIMESTAMPTZ,          -- NULL jeśli jeszcze nie opublikowany
  status          TEXT DEFAULT 'pending', -- 'pending' | 'published' | 'failed' | 'skipped'
  gbp_post_name   TEXT,                 -- resource name z GBP API po publikacji
  ai_prompt_hash  TEXT,                 -- hash promptu (dedup, debug)
  retry_count     INT DEFAULT 0,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Historia opublikowanych postów (archiwum)
CREATE TABLE post_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  published_at    TIMESTAMPTZ NOT NULL,
  gbp_post_name   TEXT,
  engagement      JSONB,  -- {views: 123, clicks: 12} — pobierane z GBP Insights
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Logi użycia AI (do monitorowania kosztów i rate limitów)
CREATE TABLE ai_usage_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id     UUID REFERENCES locations(id),
  model           TEXT NOT NULL,        -- 'groq/llama-3.1-8b-instant'
  input_tokens    INT,
  output_tokens   INT,
  cost_usd        NUMERIC(10, 6),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Subskrypcje (Stripe webhooks)
CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan                TEXT NOT NULL,    -- 'solo' | 'agency'
  status              TEXT NOT NULL,    -- 'active' | 'canceled' | 'past_due'
  current_period_end  TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### Indeksy

```sql
CREATE INDEX idx_post_queue_scheduled ON post_queue (scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_post_queue_location ON post_queue (location_id);
CREATE INDEX idx_locations_user ON locations (user_id);
CREATE INDEX idx_ai_usage_user_date ON ai_usage_log (user_id, created_at);
```

### Row Level Security (RLS)

```sql
-- Każdy user widzi tylko swoje dane
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own locations"
  ON locations FOR ALL USING (user_id = auth.uid());

CREATE POLICY "users see own posts"
  ON post_queue FOR ALL USING (
    location_id IN (SELECT id FROM locations WHERE user_id = auth.uid())
  );

CREATE POLICY "users see own tokens"
  ON google_tokens FOR ALL USING (user_id = auth.uid());
```

### Limity planów (enforced w Edge middleware)

```
trial:   max 1 lokalizacja, 14 dni, 4 posty preview (bez publikacji)
solo:    max 1 lokalizacja, 4 posty/mies., auto-publish
agency:  max 5 lokalizacji, 4 posty/mies./lokalizację, auto-publish
```

### Szacowane zużycie Supabase Free Tier

| Zasób | Limit free | Szacowane zużycie @ 200 userów |
|---|---|---|
| Database | 500 MB | ~15 MB (text, no blobs) |
| Bandwidth | 2 GB/mies. | ~200 MB (lean JSON responses) |
| MAU | 50 000 | ~200–500 aktywnych |
| Edge Functions | 500k invocations | ~25k (cron + API calls) |

**Wniosek: Free tier Supabase wystarczy do ~500 paying users. Upgrade ($25/mies.) dopiero przy skalowaniu.**

---

## 4. ARCHITEKTURA APLIKACJI (Next.js Edge Runtime)

### Struktura tras

```
app/
├── api/
│   ├── auth/
│   │   ├── google/route.ts          # OAuth initiation (Edge)
│   │   └── google/callback/route.ts # OAuth callback, token storage (Edge)
│   ├── locations/
│   │   ├── route.ts                 # GET list, POST create (Edge)
│   │   └── [id]/route.ts           # GET, PATCH, DELETE (Edge)
│   ├── posts/
│   │   ├── generate/route.ts       # POST: trigger AI generation (Edge)
│   │   ├── queue/route.ts          # GET: scheduled posts (Edge)
│   │   └── [id]/route.ts          # PATCH approve/skip, DELETE (Edge)
│   ├── cron/
│   │   ├── publish/route.ts        # Vercel Cron: publish due posts (Edge)
│   │   └── generate/route.ts      # Vercel Cron: weekly AI generation (Edge)
│   └── webhooks/
│       └── stripe/route.ts         # Stripe webhooks (Edge)
├── (dashboard)/                    # Authenticated routes
│   ├── dashboard/page.tsx
│   ├── locations/page.tsx
│   ├── posts/page.tsx
│   └── settings/page.tsx
└── (marketing)/                    # Public pages
    ├── page.tsx                    # Landing page
    ├── pricing/page.tsx
    └── login/page.tsx
```

### Vercel Cron Jobs (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/generate",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

- **Publish cron**: co godzinę, sprawdza `post_queue` gdzie `scheduled_at <= NOW()` i `status = 'pending'`, wywołuje GBP API
- **Generate cron**: w każdy poniedziałek o 9:00 UTC, generuje posty na kolejny tydzień dla wszystkich aktywnych lokalizacji

### Zewnętrzne API (darmowe)

| API | Cel | Limit free |
|---|---|---|
| Google Business Profile API | Publikowanie postów, pobieranie lokalizacji | 150k req/dzień |
| Groq API (llama-3.1-8b-instant) | Generowanie treści postów | 14 400 req/dzień, 30 RPM |
| Stripe | Płatności, subskrypcje | Brak opłat do pierwszej transakcji |
| Resend (email) | Powiadomienia, onboarding | 3 000 emails/mies. free |

---

## 5. STRATEGIA MARKETINGOWA — BUDŻET 300 ZŁ (~75 USD)

### Alokacja budżetu

| Pozycja | Kwota | Priorytet |
|---|---|---|
| Vercel Pro (1 mies.) | ~80 PLN ($20) | MUST — wymagane do commercial use |
| Domena (1 rok, Namecheap) | ~50 PLN ($12) | MUST |
| Google Ads (test intent) | ~120 PLN ($30) | HIGH — wysokointencyjne słowa kluczowe |
| Grafika/thumbnail na ProductHunt | 0 PLN (Canva free) | — |
| Email marketing (EmailOctopus) | 0 PLN (free do 2 500 sub) | — |
| **RAZEM** | **~250 PLN** | Zostaje 50 PLN rezerwy |

### Kanały organiczne (zero kosztów)

**Tydzień 1–2: Beta recruitment**

1. **Reddit** (angielski, docelowy rynek)
   - r/Plumbing, r/HVAC, r/electricians, r/Roofers
   - Post: *"I built a free tool that auto-writes your Google Business posts every week — looking for 5 beta testers"*
   - Nie linkuj od razu — poproś o DM. Zbuduj zaufanie.

2. **Facebook Groups** (najważniejszy kanał)
   - "Plumbers of America" (~200k members)
   - "HVAC Professionals" (~150k members)
   - "Electricians United" (~100k members)
   - UK: "UK Plumbers Group", "Electricians UK"
   - Post: *"Who here struggles to post regularly on Google? I built something that does it automatically..."*

3. **Indie Hackers**
   - Post "I built this for tradespeople" z journey story — silne SEO długoterminowo

4. **Twitter/X (niszowe hashtagi)**
   - #HVAC, #PlumbingLife, #LocalSEO, #SmallBusiness

**Tydzień 3–4: Produktowy launch**

5. **ProductHunt launch**
   - Kategoria: "Marketing" lub "SEO"
   - Potencjał: 200–1 000 upvotes, zero kosztu
   - Klucz: zaplanuj na wtorek-środę, miej 20 gotowych do głosowania od razu

6. **Cold email do lokalnych agencji SEO**
   - Lista: 50 agencji z Google Maps "local SEO agency [city]"
   - Pitch: "white-label lub affiliate 30%" — agencja poleca narzędzie swoim klientom
   - Resend free tier = 3 000 emaili/mies.

**Tydzień 5–6: Płatny ruch (Google Ads, $30)**

7. **Google Search Ads**
   - Słowa kluczowe: "google business posts for plumbers", "auto post google my business", "gbp posts automation"
   - Bardzo niski wolumen → niskie CPC (~$0.50–2.00)
   - Cel: 5 kliknięć/dzień × 14 dni = 70 kliknięć × 10% konwersja na trial = 7 trialsów
   - Przy 40% trial-to-paid: 2–3 paying customers za $30

### Sekwencja email onboarding (Resend + EmailOctopus)

```
Dzień 0:  Welcome + Google OAuth setup guide (video 2 min)
Dzień 1:  "Your first post is ready — click to preview"
Dzień 3:  Case study: "How [real user] got 3 more calls/week"
Dzień 7:  "Your posts go live tomorrow — here's what to expect"
Dzień 12: "You're getting results — upgrade before trial ends"
Dzień 13: "24h left on your trial"
```

### KPI i progi decyzyjne

| Metryka | Próg "pivot" | Próg "scale" |
|---|---|---|
| Trial signups (tydzień 1) | < 5 → zmień kanał | > 20 → zwiększ Google Ads |
| Trial → Paid conversion | < 10% → issue z produktem | > 25% → agresywny rynek |
| MRR po 30 dniach | < $100 → re-evaluate | > $500 → zatrudnij pisanie treści |
| Churn mies. 2 | > 20% → fix onboarding | < 5% → sign of PMF |

### Roadmapa (po walidacji, bez dodatkowego budżetu)

```
Mies. 1: MVP + manual publish (walidacja bólu)
Mies. 2: Auto-publish + trial → paid flow (Stripe)
Mies. 3: Agency tier + multi-location
Mies. 4: GBP Insights dashboard (data retention feature)
Mies. 5: White-label dla agencji SEO (nowy segment przychodów)
```

---

## 6. RYZYKA I MITIGACJE

| Ryzyko | Prawdop. | Impact | Mitigacja |
|---|---|---|---|
| Google GBP API deprecation/ToS change | Średnia | Wysoki | Thin wrapper, własna baza emaili klientów, monitor changelogi |
| Vercel Hobby ToS (commercial use) | Pewne | Średni | Budget $20/mies. na Pro od początku |
| Groq free tier niewystarczający | Niskie (<250 userów) | Średni | Env var swap na Mistral/OpenAI, design na low-frequency |
| Niska konwersja trial→paid | Wysoka na starcie | Wysoki | Usuń CC z triala, onboarding <3 min, testimonials przed launch |
| Rynek trades nieufny wobec SaaS | Średnia | Średni | Cena w "impulse buy zone" $19, outcome-focused copy, 3 real testimonials |

---

## 7. STACK TECHNOLOGICZNY (podsumowanie)

```
Frontend:     Next.js 15 App Router (Edge Runtime)
Backend:      Next.js API Routes (Edge Runtime, bez Node.js)
Auth:         Supabase Auth + Google OAuth 2.0
Database:     Supabase PostgreSQL (free tier)
AI:           Groq API — llama-3.1-8b-instant (free tier, ~4 req/user/mies.)
Cron:         Vercel Cron Jobs (free w Pro)
Payments:     Stripe Checkout + webhooks
Email:        Resend (free 3k/mies.)
Hosting:      Vercel Pro ($20/mies.)
Domain:       Namecheap (~$12/rok)
Monitoring:   Vercel Analytics (free) + Supabase Studio
```

**Łączny koszt miesięczny przy <250 paying users: ~$21/mies.**
**Break-even: 2 klientów @ $19/mies.**

---

*Plik wygenerowany: 2026-05-18 | Następny krok: budowa MVP (nie generuj kodu dopóki nie zaakceptujesz tego planu)*
