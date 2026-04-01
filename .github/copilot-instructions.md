# 24.7 Barbearia – Copilot Instructions

## 1. Purpose & Deployment

- **Goal**: High-touch barbershop site with immersive 3D hero/about/staff cards, Instagram-style gallery, dynamic services, and a 3-step booking modal tied to an Express+Mongo backend.
- **Frontend**: Static assets hosted in the repo root ([index.html](index.html), [css/mobile-responsive.css](css/mobile-responsive.css), [js/main.js](js/main.js)).
- **Backend**: Render-hosted Express API located in [backend/](backend/). Base URL is `https://two4-7-barbearia.onrender.com/api` and must stay in sync with production unless user states otherwise.
- **Data sources**: MongoDB Atlas (`SiteSettings`, `Service`, `Barber`, `Reservation`, `Review`, etc.). Email delivery via Resend; SMS/push via Twilio + Web Push (VAPID keys).

## 2. Directory Map & Key Files

| Path                                                                                                                                                                                                   | Purpose                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [index.html](index.html)                                                                                                                                                                               | Complete SPA markup, inline design tokens, loader, sections, booking modal DOM, SEO metadata.                                |
| [css/mobile-responsive.css](css/mobile-responsive.css)                                                                                                                                                 | Breakpoint overrides (900px, 768px, 480px, tablet safe-area fixes, booking modal tweaks).                                    |
| [js/main.js](js/main.js)                                                                                                                                                                               | Carousel, observers, site settings fetch, dynamic services/staff/gallery, booking flow, validation, API POST, success modal. |
| [backend/server.js](backend/server.js)                                                                                                                                                                 | Express bootstrap (env, Mongo connection, middleware, routes).                                                               |
| [backend/src/routes/api.js](backend/src/routes/api.js)                                                                                                                                                 | All HTTP endpoints (auth, reservations, admin, cron, push).                                                                  |
| [backend/src/controllers](backend/src/controllers)                                                                                                                                                     | Business logic split across `auth`, `reservation`, `admin`, `cron`.                                                          |
| [backend/src/models](backend/src/models)                                                                                                                                                               | Mongoose schemas (Barber, Service, Reservation, SiteSettings, Review, MonthlyStats, PushSubscription).                       |
| [backend/src/services/emailService.js](backend/src/services/emailService.js)                                                                                                                           | Resend templates for client/admin/barber notifications.                                                                      |
| [backend/src/middleware/uploadMiddleware.js](backend/src/middleware/uploadMiddleware.js)                                                                                                               | Multer + Sharp processing with strict file-type/size limits and base64 conversion.                                           |
| Docs: [claude.md](claude.md), [CONTEXTO_PROJETO.md](CONTEXTO_PROJETO.md), [BOOKINGS_SYSTEM_STRUCTURE.md](BOOKINGS_SYSTEM_STRUCTURE.md), [PROMPT_MARCACOES_LOGICA_DB.md](PROMPT_MARCACOES_LOGICA_DB.md) | Living documentation; review before large changes.                                                                           |

## 3. Frontend Structure & Patterns

### 3.1 HTML Skeleton

- Sections flow: header → hero → about (3D card) → services grid → gallery carousel → staff (two 3D cards) → reviews → showcase cards → contact/map → CTA → footer.
- Booking modal (#bookingModal) and success modal (#successModal) are pre-rendered in DOM; JS toggles `.active`.
- Loader overlay (#loaderOverlay) must remain for brand reveal; JS enforces minimum 2.5s display.
- Use `.scroll-observer` on new sections to piggyback on IntersectionObserver reveal.

### 3.2 CSS Guidelines

- Design tokens (`--primary`, `--accent`, `--spacing-*`, `--font-headline/body`, transition vars) live inside the inline `<style>` within [index.html](index.html). Only update tokens there and mirror overrides in mobile CSS if needed.
- `css/mobile-responsive.css` enforces mobile-first overrides: single-column grids below 900px, safe-area padding via `env(safe-area-inset-*)`, staff/stage adjustments, booking modal stack. Respect existing `!important` overrides—they fix inline-style precedence.
- 3D cards rely on `.about-card.is-3d` perspective transforms plus `.about-character-image` parallax. When duplicating, include the `is-3d` toggle classes and IntersectionObserver hooks.
- Use `clamp()` for typography when adding new headings, matching the hero/staff patterns.

### 3.3 JavaScript Modules (main.js)

- Organized as IIFEs + helper functions. Keep new logic encapsulated; avoid leaking globals unless intentionally exposed on `window` (pattern used for booking helper hooks like `updateBarberLunchBreak`).
- Feature blocks:
  - Carousel controller (class toggles `pos-center/left/right`, autoplay every 3.5s, click navigation on `.carousel__wrapper`).
  - Scroll observer + parallax hero background.
  - Loader timing guard (min 2.5s) and service accordion.
  - `FILMING_MODE_*` overrides inject placeholder imagery/names when `FILMING_MODE_ACTIVE` toggles true for video shoots—keep flag false in production.
  - `applySiteSettings()` populates DOM, builds hours table, updates `siteSchedule`, sets payment icons, rehydrates staff cards, showcase card rotators, and notifies booking helpers via `window.updateBookingBarbers` & `window.refreshBookingSchedule`.
  - `loadServices()` fetches `/admin/services`, enforces active/order sorting, renders `.service-card-new`, fires `services:rendered` event so booking handlers can rebind.
  - `loadBarberData()` hits `/barbers/:id` for each known barber to refresh lunch breaks, working hours, and absence arrays (stored on `window.absences_<slug>`).
  - Booking system module manages modal state, calendar rendering, slot filtering (30-min increments), validations, POST `/reservations`, success modal.
- Always reuse `API_BASE_URL` constant defined near the relevant block; do not inline base URLs in new functions.

## 4. Design System & Animations

- **Colors**: `--primary #1a1a1a`, `--accent #8b7355`, `--accent-light #c9a961`, `--bg-light #f5f5f5`, `--text-dark #1f2933`, `--text-light #4b5563`, `--border-light #ede9e3`.
- **Typography**: Headlines use Noto Serif, body uses Manrope. Keep new text Portuguese unless project owners request otherwise.
- **Spacing tokens**: `--spacing-sm 0.75rem`, `--spacing-md 1.25rem`, `--spacing-lg 2.5rem`, `--spacing-xl 4rem`.
- **Transitions**: `--transition-fast` (180ms), `--transition-smooth` (280ms), `--transition-slow` (400ms). Use them to maintain consistent easing.
- **Motion**: Use existing keyframes (`slide-down`, loader animations). For new motion, prefer GPU-friendly transforms/opacity.

## 5. Dynamic Content & Data Flow

1. On DOMContentLoaded, `loadSiteSettings()` fetches `/site-settings` → populates hero/about/gallery/staff/contact/hours/CTA/footer + updates `siteSchedule`.
2. `loadServices()` fetches `/admin/services` → renders grid → dispatches `services:rendered` so booking buttons gain listeners.
3. `loadBarberData()` fetches `/barbers/:id` to hydrate lunch breaks, working hours, absences used by booking slot filtering.
4. Reviews carousel uses `/reviews/random` (triggered via HTML script tag or future enhancements) and relative-time badges auto-update hourly.
5. Booking POST to `/reservations` replicates backend validations; backend remains source of truth.

## 6. Booking Modal Rules (JS + API cohesion)

- **Steps**: 1) Barber selection `.barber-card` (updates `bookingState.barber`). 2) Calendar/time (month nav, `renderTimeSlots()`), ensuring service duration fits remaining day and excluding barber lunch break & absences. 3) Client form (name, Portuguese phone regex, email + domain sanity checks, optional notes) before POST.
- **Time slots**: Generated every 30 min, but slot list trimmed so `slotStart + serviceDuration <= closing time`. Service durations must come from the service card `data-duration` (populated from DB). Never hardcode durations in JS.
- **Lunch breaks**: `window.updateBarberLunchBreak()` stores `lunchBreak.enabled/startTime/endTime` per barber; slot generator skips overlapping ranges. Keep logging for debugging.
- **Absences**: Populated per barber from `/barbers/:id`. Types `full`, `morning`, `afternoon`, `specific` (with `startTime/endTime`). Booking UI removes slots that overlap absence windows.
- **Validation order** mirrors backend `reservationController.createReservation()` (IDs, phone/email format, working hours, lunch, absences, overlap). If changing order, update both frontend and backend to match copy.
- **Submission**: POST JSON to `/reservations` with `barberId`, `serviceId`, `clientName`, etc. On 201, UI shows success modal summarizing booking; loader or CTA states must reset.

## 7. Backend Overview & Endpoints

- Router: [backend/src/routes/api.js](backend/src/routes/api.js).
  - **Auth**: `POST /auth/login`, `GET /auth/me`, `PUT /auth/change-password`, `GET/PUT /auth/profile` – require JWT except login.
  - **Reservations**: `POST /reservations` (public); `GET /reservations/barber/:barberId`; `PATCH /reservations/:id/status`; `DELETE /reservations/:id`; `POST /reservations/cancel/:token` (tokenized public cancel).
  - **Barber Self-service**: `GET/POST/DELETE /barber/absences`, `GET /barber/reservations` (dashboard), `POST /subscriptions` (push registration).
  - **Admin** (JWT + adminMiddleware): CRUD for barbers, services (`/admin/services` with upload middleware), site settings (`/admin/site-settings`), reviews, stats, push broadcast `/admin/send-notification`.
  - **Public content**: `/site-settings`, `/reviews/random`, `/barbers/:id` (limited fields).
  - **Cron**: `/cron/aggregate`, `/cron/clean-duplicates`, `/cron/clear-old` return lightweight JSON for cron-job.org.
  - **Push (public PWA)**: `POST /subscriptions-public` for client devices.

## 8. Data Models & Business Rules

- **Barber** ([backend/src/models/Barber.js](backend/src/models/Barber.js)): name/email/phone, `notificationEmail`, `lunchBreak`, `workingHours`, `absences`, `role`, `isActive`, bcrypt hashed password. Absence types control booking slot filtering.
- **Service** ([backend/src/models/Service.js](backend/src/models/Service.js)): name, description, price (string or number), `duration` (minutes), `order`, `image`, `isActive`.
- **Reservation** ([backend/src/models/Reservation.js](backend/src/models/Reservation.js)): references barber/service, client info, `reservationDate`, `timeSlot` string, `status`, `notes`, `cancelToken`.
- **SiteSettings** ([backend/src/models/SiteSettings.js](backend/src/models/SiteSettings.js)): all hero/about/gallery/contact/staff/showcase values plus hours rows; default seed values defined in `adminController`.
- **Review** ([backend/src/models/Review.js](backend/src/models/Review.js)): author, rating, text, date, `isActive` (random selection uses `$sample`).
- **MonthlyStats** & **PushSubscription**: used by admin dashboards and web push; keep fields intact when extending analytics.

## 9. Media & Upload Rules

- Image uploads go through `uploadMiddleware` (multer memory storage + Sharp). Supported formats: JPG/PNG/WebP/GIF/AVIF/HEIC up to 10MB each. Middleware outputs base64 strings stored on `req.*Base64`; controllers must pick those up when persisting.
- Gallery uploads limited to 10 images, max ~8MB total; about carousel limited to ~6MB; errors must propagate to client with helpful copy.
- When adding new image fields to `SiteSettings`, update both the middleware file list and `adminController.updateSiteContent()` to read `req.<field>Base64`.

## 10. Notifications, SMS, and Scheduled Jobs

- Resend templates in [backend/src/services/emailService.js](backend/src/services/emailService.js) send three emails per booking (client confirmation with cancel link, admin alert, optional barber alert). Keep HTML inline CSS email-safe; update only via this file.
- Twilio client in `reservationController` is lazily instanced; guard with env `TWILIO_ACCOUNT_SID`. SMS failures must never block bookings.
- Web Push uses `web-push` and `PushSubscription` collection; inactive subscriptions flagged when send returns 410.
- Cron endpoints call helper functions that aggregate monthly stats, deduplicate barbers, and purge >12-month reservations after aggregating.

## 11. Do / Don't (Critical Rules)

- **Do** reuse `API_BASE_URL` constants; **don't** hardcode host strings anywhere else.
- **Do** keep Portuguese copy and emoji accenting; **don't** translate CTAs unless requested.
- **Do** pull service durations/prices from backend; **don't** guess durations in UI or backend logic.
- **Do** respect booking validation order; **don't** bypass working-hour or lunch-break checks.
- **Do** treat `SiteSettings` as single-document config; **don't** create multiple documents unless designing multi-tenant support.
- **Do** keep `FILMING_MODE_ACTIVE` false in commits; **don't** ship placeholder assets.
- **Do** update docs (`claude.md`, `BOOKINGS_SYSTEM_STRUCTURE.md`) when workflows change; **don't** leave behaviour undocumented.
- **Do** keep CSS ASCII-only and aligned with tokens; **don't** introduce new fonts/anim curves without sign-off.

## 12. Testing & QA Checklist

1. **Frontend smoke**: load homepage, ensure loader fades, header stays sticky, carousel autop-lays, `.scroll-observer` sections animate.
2. **Dynamic content**: confirm site text/images match the latest SiteSettings data (manually adjust via admin panel or DB).
3. **Services grid → booking**: ensure each rendered service button opens modal with correct name/price/duration (inspect `data-duration`).
4. **Booking flow**: attempt booking at opening, lunch, closing boundaries, and conflicting slots to verify validation messages both frontend and backend.
5. **Absences**: create a `morning` and `specific` absence via admin, reload site, verify slots disappear.
6. **Emails/SMS**: when env vars set, check Resend logs and Twilio console for successful deliveries; ensure cancel link works and delete reservation by token.
7. **Push**: register subscription via authenticated endpoint and ensure `admin/send-notification` reaches device (requires VAPID keys locally).
8. **Cron**: run `/cron/aggregate` and `/cron/clear-old` locally or via task runner to confirm JSON responses stay <64KB.

## 13. Reference Docs & Staying in Sync

- Project narrative & design cues: [claude.md](claude.md), [CONTEXTO_PROJETO.md](CONTEXTO_PROJETO.md).
- Booking domain rationale & edge cases: [BOOKINGS_SYSTEM_STRUCTURE.md](BOOKINGS_SYSTEM_STRUCTURE.md), [PROMPT_MARCACOES_LOGICA_DB.md](PROMPT_MARCACOES_LOGICA_DB.md), [MUDANCAS_RESERVATIONS_d067207.md](MUDANCAS_RESERVATIONS_d067207.md).
- Backend ops scripts and email setup: [backend/RESEND_SETUP.md](backend/RESEND_SETUP.md), [backend/VAPID_SETUP.md](backend/VAPID_SETUP.md), [backend/README.md](backend/README.md).
- When adding new capabilities, update these instructions plus relevant docs so future agents inherit accurate constraints.
