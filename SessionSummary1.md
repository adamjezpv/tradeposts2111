# Session Summary 1 — 2026-05-20

---

## Co zrobiłem?

### 1. Nowa strona `/upgrade` (`app/(dashboard)/upgrade/page.tsx`)
Zbudowana od zera pełna strona cennikowa z:
- Dwoma planami: **Solo** ($19/mo) i **Agency** ($39/mo)
- Przełącznikiem Monthly / Annual (Annual = -20%)
- Kartami planów z listą funkcji i przyciskiem checkout
- Tłem z subtelną siatką (grid background)
- Obsługą błędów przy checkout (alert + spinner)
- Routing przez `/upgrade` dodany do middleware matchera

---

### 2. Nowy komponent `PremiumDashboard` (`app/(dashboard)/_components/PremiumDashboard.tsx`)
Oddzielny widok dashboardu dla użytkowników premium (plan `solo` lub `agency`):
- Metryki: liczba zaplanowanych postów, aktywna branża, następna publikacja
- **Calendar View** — interaktywny kalendarz z dotkami na dniach z postami, kliknięcie otwiera podgląd postów z danego dnia
- **Queue View** — lista postów zgrupowana po dacie z godziną, podglądem treści i statusem
- Baner upgrade dla solo-użytkowników mających >1 lokalizację (agency gate)
- Badge "Full Access" dla planu Agency
- Dashboard routing: `isPremium` → `PremiumDashboard`, trial → stary widok trial

---

### 3. Przebudowa widoku trial w `dashboard/page.tsx`
- Usunięto stary układ 2-kolumnowy (Account Status + Connect GBP)
- Dodano nowy **Upgrade Banner** — pełna sekcja z progress barem trialu, porównaniem funkcji (active/locked) i przyciskiem CTA
- `UpgradeButton` teraz prowadzi do `/upgrade` zamiast bezpośrednio do Stripe checkout
- Pobieranie lokalizacji rozszerzone o dane (`id, business_name, business_type, active`) zamiast tylko count
- Limit postów w query podniesiony z 8 do 120 (dla PremiumDashboard)
- W Trial View posty w siatce obcięte do 8 przez `.slice(0, 8)`

---

### 4. Refactor `UpgradeButton` (`app/(dashboard)/_components/UpgradeButton.tsx`)
- Usunięto całą logikę fetch/checkout/loading ze środka przycisku
- Przycisk teraz tylko robi `router.push('/upgrade')` — jeden krok upgrade przez dedykowaną stronę
- Zmieniono tekst: `"Upgrade to Premium — $49/mo →"` → `"View plans — from $19/mo →"`

---

### 5. Sidebar (`app/(dashboard)/_components/Sidebar.tsx`)
- Dodano prop `plan: string` do sygnatury komponentu
- Dla `plan === 'trial'`: wyświetla link **Upgrade** w navie (z ceną `from $19`)
- W sekcji user na dole: dodano wskaźnik planu (animowany dot + etykieta `Free trial` lub nazwa planu)

---

### 6. Layout (`app/(dashboard)/layout.tsx`)
- Layout teraz pobiera `plan` z tabeli `users` dla zalogowanego usera
- Przekazuje `plan` do `<Sidebar>` — plan jest dostępny w całym dashboardzie

---

### 7. Billing — `checkout/route.ts`
- Endpoint przyjmuje opcjonalne `priceId` z body requestu — umożliwia checkout dla konkretnego planu (Solo/Agency, Monthly/Annual)
- Logika wykrywania `planType` (`solo` vs `agency`) na podstawie `agencyPriceIds`
- `planType` zapisywany w `metadata` sesji Stripe i subskrypcji
- `cancel_url` zmieniony z `/settings` na `/upgrade`
- Fix baseUrl (z poprzedniej sesji) — zachowany

---

### 8. Billing — `webhook/route.ts`
- `checkout.session.completed` teraz odczytuje `plan_type` z `metadata` i zapisuje prawidłowy plan (`solo`/`agency`) do DB zamiast hardcoded `'premium'`
- Obsługa update przez `stripe_customer_id` (priorytet) lub `customer_email` (fallback)
- `invoice.paid` teraz update przez `stripe_customer_id` zamiast `customer_email`
- Lepsza obsługa błędów DB (early return z 500 przy błędzie)
- Early guard na brak `STRIPE_WEBHOOK_SECRET` (z poprzedniej sesji) — zachowany

---

### 9. `.env.example`
Nowe zmienne wymagane przez `/upgrade` page i nowy billing:
```
NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTHLY
NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL
NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY_MONTHLY
NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY_ANNUAL
STRIPE_PRICE_ID_AGENCY_MONTHLY
STRIPE_PRICE_ID_AGENCY_ANNUAL
```

---

## Co trzeba jeszcze zrobić, żeby strona była w pełni funkcjonalna?

### Pilne (blokuje działanie)

1. **Vercel — dodać nowe env vars**
   Strona `/upgrade` używa `NEXT_PUBLIC_STRIPE_PRICE_ID_*` po stronie klienta. Bez tych zmiennych checkout wybiera fallback `price_solo_monthly` (placeholder), który nie istnieje w Stripe i wywoła błąd.
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTHLY`
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL`
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY_MONTHLY`
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY_ANNUAL`
   - `STRIPE_PRICE_ID_AGENCY_MONTHLY`
   - `STRIPE_PRICE_ID_AGENCY_ANNUAL`

2. **Stripe — stworzyć brakujące produkty/ceny**
   Aktualnie istnieje tylko jeden `STRIPE_PRICE_ID` (jeden plan). Potrzeba 4 cen:
   - Solo Monthly ($19)
   - Solo Annual ($15/mo = $180/year)
   - Agency Monthly ($39)
   - Agency Annual ($31/mo = $372/year)

3. **Google Cloud Console + Supabase Google Provider**
   (bez zmian od poprzedniej sesji — wciąż blokuje logowanie Google w produkcji)

---

### Funkcjonalne braki w kodzie (wymaga napisania)

4. **GBP API — faktyczne publikowanie postów**
   Cron job (`vercel.json`) nadal tylko zmienia `status = 'published'` w DB. Nie wywołuje Google Business Profile API. To jest największa luka — core feature produktu nie działa.

5. **GBP API — pobieranie prawdziwych lokalizacji**
   Dashboard pokazuje lokalizacje z DB (`mock_123`). Brak endpointu, który pobiera prawdziwe lokalizacje z GBP API po OAuth i synchronizuje je do tabeli `locations`.

6. **Strona sukcesu po upgrade**
   `/dashboard?upgraded=1` nie ma żadnej logiki obsługi tego query param — użytkownik wraca na dashboard bez żadnego potwierdzenia/komunikatu powitalnego.

7. **Obsługa wygasłego trialu**
   `trialDaysLeft === 0` wyświetla "Your trial has ended", ale nie blokuje dostępu ani nie wymusza upgradu. Middleware nie sprawdza statusu trialu.

8. **Zarządzanie subskrypcją**
   Brak endpointu do anulowania / zarządzania subskrypcją Stripe (np. przez Stripe Customer Portal). Strona Settings ma sekcję "Subscription" ale nie pokazuje aktualnego planu ani daty odnowienia.

---

### Zewnętrzne konfiguracje (bez kodu, ale wymagane)

9. Stripe webhook endpoint na `/api/billing/webhook` zarejestrowany w Stripe Dashboard (bez zmian od poprzedniej sesji)
10. Google OAuth redirect URIs skonfigurowane w Google Cloud Console
