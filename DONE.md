# RailConnect Railway Reservation System — Project Progress & Verification Tracker (DONE.md)

This document tracks all verified engineering milestones, build and test outcomes, resolved defects, known limitations, and prioritized next tasks for the **RailConnect** project.

---

## 1. Verified Completed Tasks

### A. Next.js Core Architecture & Turbopack
- **Turbopack Multi-Root Fix**: Resolved Next.js workspace root inference warning by setting `turbopack.root = path.resolve(__dirname)` in `web/next.config.ts`.
- **Lockfile Hygiene**: Removed empty, orphaned root `package-lock.json`. Kept active `web/package-lock.json`.
- **Zero-Warning Lint Pipeline**: ESLint 9 + TypeScript 5 pass with 0 errors and 0 warnings (`npm run lint`).
- **Production Compilation**: `npm run build` compiles all 21 static pages and 13 dynamic API routes cleanly in ~3.5s.
- **Development Server Startup**: `npm run dev` starts in ~1.0s on `http://localhost:3000` with clean Turbopack logs.

### B. Authentication & User Management
- **Registration**: Server-side validation for name length (2–80 chars), email RFC regex, password length (8–72 chars), and duplicate email conflict check (`HTTP 409`).
- **Secure Password Storage**: Bcrypt cost factor 12 used for all password hashes; plaintext passwords never stored.
- **Session Architecture**: JWT signed via `jose` with HS256 and `AUTH_SECRET` (minimum 32 characters). Stored in `httpOnly`, `sameSite: "lax"`, `secure` (production) cookie named `railconnect_session`.
- **Session Verification**: `GET /api/auth/me` validates session and returns sanitized user details (`id`, `name`, `email`, `role`) with `Cache-Control: no-store`.
- **Logout Flow**: `POST /api/auth/logout` clears the session cookie (`maxAge: 0`, epoch expiry).
- **Post-Login Redirect Fix**: Fixed `web/app/login/page.tsx` destination logic to honor any safe internal relative path (`/bookings`, `/profile`, `/settings`, `/dashboard`, `/pnr-status`, `/notifications`, or `/booking/...`), preventing open redirect attacks while ensuring users return to their requested page.
- **Change Password API Route**: Implemented `PATCH /api/auth/change-password` with authentication verification, current password verification via bcrypt compare, length validation (8–72 chars), database update, and automatic security notification dispatch.
- **Profile Management**: `PATCH /api/profile` updates user name with length validation. Updated profile banner in `web/app/profile/page.tsx` directing users to Account Settings.

### C. Train Search, Booking & Journey Flow
- **Input Validation**: Rejects empty inputs, identical source and destination, invalid dates, and journey dates in the past relative to IST (`Asia/Kolkata`).
- **Passenger Validation**: Enforces 1 to 6 passengers, names (2–80 chars), valid integer ages (1–120), and gender enum (`Male`, `Female`, `Other`).
- **Seat Allocation & Verification**: Verifies coach code, enforces seat count matching passenger count, and checks unique seat strings.
- **Booking Reference Generation**: Collision-resistant references (`RC` + timestamp + 8-character cryptographic random hex).
- **Database Persistence**: Saved directly into MongoDB using Mongoose `Booking` schema with indexed references and user references.

### D. My Bookings & Custom Cancellation Modal
- **Scoping & Authorization**: `GET /api/bookings` restricts results to `session.userId`.
- **Atomic Cancellation**: `PATCH /api/bookings/:id/cancel` performs atomic `findOneAndUpdate` requiring `{ _id: id, userId: session.userId, status: "confirmed" }`.
- **Duplicate Prevention**: Rejects already-cancelled bookings with `HTTP 409`.
- **Custom Accessible Modal**: Polished modal in `web/app/bookings/page.tsx` with dialog role, ticket summary, backdrop dismiss, "Keep ticket" abort, and "Yes, cancel ticket" action with active loading state.
- **State Persistence**: Cancelled status persists across page refreshes; action button is hidden for cancelled bookings.
- **Track Status Direct Link**: Added a direct "Track PNR Status" link on each booking card in My Bookings, pre-filling the PNR tracker.

### E. Dashboard, Stations & PNR Status Tracking (Feature 01)
- **Dynamic Dashboard**: `web/app/dashboard/page.tsx` loads real database records from `/api/bookings`, computing Total Bookings and Upcoming Journeys based on IST date comparisons. Added PNR Status and Notifications quick action cards.
- **Homepage Trip Planner Anchor**: "Find a train" button accurately scrolls/navigates to `/#plan-your-trip`.
- **Stations Directory**: Implemented `web/app/stations/page.tsx` displaying major junction stations (NDLS, PNBE, CDG, ASR, BPL, HWH, MMCT, KLK) with direct journey planning shortcuts.
- **PNR Status Tracking Feature**:
  - **API Route (`GET /api/pnr-status?pnr=...`)**: Authenticates user session, validates reference format, performs case-insensitive database lookup, strictly enforces account ownership (HTTP 403 if booking belongs to another user), and returns sanitized booking details.
  - **Page (`web/app/pnr-status/page.tsx`)**: Polished search interface with live query-param prefilling (`?pnr=RC...`), loading spinner, error banners, confirmed/cancelled badges, route diagram, journey date, coach and seat numbers, passenger breakdown, print action, and demonstration disclaimer.
  - **Navigation Integration**: Integrated PNR Status link in Navbar (desktop & mobile drawer), Footer explore links, Dashboard quick actions, and My Bookings ticket cards.

### F. E-Ticket PDF Generation & Download (Feature 02)
- **High-Performance Vector PDF Engine**: Implemented `web/lib/pdf-ticket.ts` utilizing `pdf-lib` (pure TypeScript/JS, zero filesystem AFM font dependencies, fully compatible with Next.js Turbopack & Vercel Node runtime).
- **Professional Standard A4 Railway Layout**:
  - RailConnect navy/blue header banner (`#101e55`) with Electronic Reservation Slip (ERS) title and prominent PNR reference.
  - Status indicator banner (Green for `CONFIRMED`, Red for `CANCELLED`) with journey date and booking date.
  - Journey & Train Information card: Train Name & Number, Class & Coach, From & To stations, and allocated seat numbers.
  - Full Passenger Manifest table with zebra striping, headers (`#`, `Passenger Name`, `Age`, `Gender`, `Seat No.`, `Status`), and dynamic rows.
  - Fare Summary breakdown box: Base Fare, Reservation Charges, GST (5%), and Total Fare.
  - Passenger Travel Instructions: Official-style guidelines (valid government photo ID requirement, departure advisories, non-transferability).
  - Prominent Demonstration Disclaimer banner on the ticket footer.
  - Diagonal semi-transparent watermark (`CANCELLED - NOT VALID FOR TRAVEL`) rendered across page center if ticket status is cancelled.
- **Secure Server-Side API (`GET /api/bookings/[id]/ticket`)**:
  - Enforces active session via `getAuthSession()`. Rejects unauthenticated requests with `HTTP 401 Unauthorized`.
  - Supports dual identifier lookup: MongoDB `_id` or alphanumeric `bookingReference` (PNR).
  - Strict Data Isolation & Ownership Guard: Verifies `booking.userId === session.userId`. Rejects cross-account access attempts with `HTTP 403 Forbidden`.
  - Returns `application/pdf` binary stream with `Content-Disposition: attachment; filename="RailConnect_Ticket_<PNR>.pdf"` and `Cache-Control: no-store`.
- **UI Action Integration**:
  - **My Bookings (`web/app/bookings/page.tsx`)**: Added "Download E-Ticket (PDF)" button with download icon to every booking card alongside "Track PNR Status" and "Cancel booking".
  - **PNR Status Tracker (`web/app/pnr-status/page.tsx`)**: Added "Download E-Ticket (PDF)" and "Print Ticket" action buttons to the booking result card.

### G. Notification Center & Alerts System (Feature 03)
- **Persistent Mongoose Notification Model (`web/models/Notification.ts`)**:
  - Schema fields: `userId` (ref: User, indexed), `title` (max 140 chars), `message` (max 500 chars), `type` (`booking_confirmed`, `booking_cancelled`, `journey_reminder`, `password_changed`, `system_announcement`), `isRead` (boolean, default false), `actionUrl` (trimmed URL), `dedupKey` (sparse unique string for idempotency), `metadata` (typed document), timestamps (`createdAt`, `updatedAt`).
  - Compound indexes: `{ userId: 1, createdAt: -1 }` (fast chronological feed), `{ userId: 1, isRead: 1 }` (fast unread count & filter), `{ userId: 1, dedupKey: 1 }` (unique sparse index preventing duplicates on retried operations).
- **Notification Engine Library (`web/lib/notifications.ts`)**:
  - `createNotification`: Idempotent creation helper that checks `dedupKey`, catches MongoDB duplicate key errors (11000) gracefully, and never throws or interrupts the parent caller.
  - `createJourneyReminder`: Architecture-ready helper designed for 24h and 2h pre-departure reminder dispatches with deterministic dedup keys (`reminder_24h_<PNR>`).
  - `createSystemAnnouncement`: Admin-ready broadcast helper targeting user accounts with action URLs.
- **RESTful Notification APIs**:
  - `GET /api/notifications`: Authenticated, paginated (`page`, `limit`), supports `filter=all|unread|read`, returns list, unread count, total records, and pagination metadata with `Cache-Control: no-store`.
  - `PATCH /api/notifications/[id]`: Atomically updates `isRead` flag strictly verifying `userId: session.userId` ownership.
  - `PATCH /api/notifications/read-all`: Atomically marks all unread notifications for `session.userId` as read.
  - `DELETE /api/notifications/[id]`: Deletes a single notification with strict ownership verification.
  - `DELETE /api/notifications`: Bulk clears notifications for `session.userId` with `scope=read` (default) or `scope=all`.
- **Automatic Event Integration**:
  - **Booking Confirmed**: Dispatched in `web/app/api/bookings/route.ts` upon successful reservation persistence with `dedupKey: booking_confirmed_<PNR>` and `/bookings` action link.
  - **Booking Cancelled**: Dispatched in `web/app/api/bookings/[id]/cancel/route.ts` upon successful cancellation with `dedupKey: booking_cancelled_<PNR>` and `/bookings` action link.
  - **Password Changed**: Dispatched in `web/app/api/auth/change-password/route.ts` upon successful password update with `/settings` action link.
- **Navbar Notification Bell & Live Preview (`web/components/Navbar.tsx`)**:
  - High-visibility bell button with unread count badge (shows exact count or `9+` when exceeding 9).
  - Dropdown preview card showing latest 5 alerts, relative timestamps (`Just now`, `5m ago`, `2h ago`, `Yesterday`), unread indicator dots, and type-specific icon badges.
  - Quick action to "Mark all read" directly within the dropdown.
  - Direct click navigation: marks clicked notification as read and routes to its destination page.
  - Responsive mobile drawer and top-bar integration with dedicated notification bell link.
  - Session-aware: never polls or fetches notifications when user is logged out.
- **Notification Center Page (`web/app/notifications/page.tsx`)**:
  - Full-featured, responsive management page matching RailConnect navy/blue design system.
  - Filter tabs for All, Unread, and Read notifications with dynamic counts.
  - Interactive actions: Mark as Read / Unread toggle per card, Single Delete, Mark All as Read, and Clear Read Notifications.
  - Animated loading skeletons, friendly empty states for all filter tabs, and responsive pagination controls.
  - Friendly authentication banner with login redirect button for logged-out visitors.
- **Navigation Shortcuts**:
  - Added Notifications to Dashboard quick links (`web/app/dashboard/page.tsx`).
  - Added Notifications to Footer explore directory (`web/components/Footer.tsx`).

### H. Standalone C++ DSA Project
- **Compilation**: Compiles cleanly with `g++ -std=c++17 -Wall -Wextra -pedantic` using MinGW GCC 6.3.0.
- **Algorithms Verified**:
  - Linear Search: $\mathcal{O}(n)$
  - Binary Search: $\mathcal{O}(\log n)$
  - Bubble Sort: $\mathcal{O}(n^2)$
  - Insertion Sort: $\mathcal{O}(n^2)$
  - Singly Linked List (`BookingHistory`): all 6 memory cleanup unit tests passed (`test_booking_history.cpp`).
  - LIFO Stack: undo cancellation mechanism in `main.cpp`.
  - FIFO Queue: waiting-list promotion upon cancellation.
  - File Persistence: flat-file serialization in `data/trains.txt`, `data/stations.txt`, and `data/bookings.txt`.

---

## 2. Test Execution Results

| Test Category | Target | Method | Status | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Lint Check** | `web` | `npm run lint` | **PASSED** | Exited Code 0 (0 errors, 0 warnings across all `.ts`/`.tsx`). |
| **Production Build** | `web` | `npm run build` | **PASSED** | Exited Code 0. Pre-rendered 21 static pages and 13 dynamic API routes in ~3.5s. |
| **Notification Page HTTP** | `web` | `GET /notifications` | **PASSED** | Returned HTTP 200 with notification hero, filters, and controls. |
| **GET Notifications Auth Guard** | `web` | `GET /api/notifications` | **PASSED** | Returned HTTP 401 Unauthorized (`"Please log in to view your notifications."`). |
| **PATCH Read-All Auth Guard** | `web` | `PATCH /api/notifications/read-all` | **PASSED** | Returned HTTP 401 Unauthorized (`"Please log in to update notifications."`). |
| **PATCH One Auth Guard** | `web` | `PATCH /api/notifications/:id` | **PASSED** | Returned HTTP 401 Unauthorized (`"Please log in to update notifications."`). |
| **DELETE One Auth Guard** | `web` | `DELETE /api/notifications/:id` | **PASSED** | Returned HTTP 401 Unauthorized (`"Please log in to delete notifications."`). |
| **DELETE Bulk Auth Guard** | `web` | `DELETE /api/notifications` | **PASSED** | Returned HTTP 401 Unauthorized (`"Please log in to clear your notifications."`). |
| **Ticket API Auth Guard** | `web` | `GET /api/bookings/:id/ticket` | **PASSED** | Returned HTTP 401 Unauthorized (`"Please log in to download your e-ticket."`). |
| **Ticket API Cross-User Guard** | `web` | `GET /api/bookings/:id/ticket` | **PASSED** | Returns HTTP 403 Forbidden when ticket belongs to another user account. |
| **PNR Page HTTP Health** | `web` | `GET /pnr-status` | **PASSED** | Returned HTTP 200 with PNR input field and disclaimer. |
| **PNR API Auth Guard** | `web` | `GET /api/pnr-status?pnr=RC...` | **PASSED** | Returned HTTP 401 Unauthorized (`"Please log in to track your booking status."`). |
| **Git Diff Check** | Root | `git diff --check` | **PASSED** | Exited Code 0. No whitespace errors or conflict markers. |
| **C++ Unit Tests** | `dsa` | `.\test_booking_history.exe` | **PASSED** | 6/6 tests passed (memory cleanup, list operations, destructor). |
| **C++ Core Build** | `dsa` | `g++ -std=c++17 ...` | **PASSED** | Compiled with zero warnings; CLI menu ran cleanly. |
| **Live Browser UI Testing** | `web` | Interactive Browser | **NOT TESTED** | Headless browser automation unavailable; requires manual browser interaction per checklist. |
| **OS Dark Mode Toggle** | `web` | Browser Viewport | **NOT TESTED** | Requires visual inspection across device display settings. |

---

## 3. Verified Features Implemented in This Cycle

1. **Feature 03: Mongoose Notification Model (`web/models/Notification.ts`)**: Schema with 5 notification types, read status, action URLs, metadata, and compound + sparse unique indexes.
2. **Feature 03: Notification Library (`web/lib/notifications.ts`)**: Idempotent creation, deduplication against retried operations, and integration-ready journey reminder / system announcement helpers.
3. **Feature 03: Complete REST API Endpoints (`web/app/api/notifications/`)**: Secure routes for paginated feed, unread count, individual read toggle, bulk read-all, single delete, and bulk clear.
4. **Feature 03: Automatic Event Wiring**: Automatic dispatches for booking confirmation, cancellation, and password change.
5. **Feature 03: Navbar Notification Bell**: Live dropdown preview with unread count badge, quick mark-all-read action, and responsive mobile menu integration.
6. **Feature 03: Notification Center Page (`web/app/notifications/page.tsx`)**: Premium page with All / Unread / Read filters, relative timestamps, single card actions, and pagination.

---

## 4. Known Project Limitations

1. **Background Journey Reminders**: The architecture for 24h and 2h pre-journey reminders is prepared via `createJourneyReminder` in `web/lib/notifications.ts`. However, on a serverless deployment like Vercel, a background cron job (e.g., Vercel Cron or GitHub Actions scheduled workflow) must be configured to trigger the checks periodically; client-side intervals are intentionally not used to avoid unreliable notifications.
2. **System Announcements Admin UI**: The `createSystemAnnouncement` helper is ready, but a full-fledged admin dashboard for broadcasting announcements across users is pending future admin console expansion.
3. **Simulated Rail Inventory**: Train schedules and seat matrices are demonstration data; external railway APIs (IRCTC/CRIS) and payment gateways are not connected.
4. **Cancellation Scope**: Cancelling a booking updates the local MongoDB record only; no bank refunds or official Indian Railways PNR cancellations occur.
5. **Session Undo in C++**: The C++ cancellation undo stack is session-bound in memory and does not persist across CLI restarts.

---

## 5. Modified & Untracked Files

- `web/models/Notification.ts` (New: Mongoose Notification schema and types)
- `web/lib/notifications.ts` (New: notification creation, deduplication, and helper library)
- `web/app/api/notifications/route.ts` (New: paginated GET and bulk DELETE endpoints)
- `web/app/api/notifications/[id]/route.ts` (New: PATCH read status and DELETE single notification endpoints)
- `web/app/api/notifications/read-all/route.ts` (New: PATCH mark all as read endpoint)
- `web/app/notifications/page.tsx` (New: responsive Notification Center page)
- `web/components/Navbar.tsx` (Modified: added notification bell dropdown, badge, and mobile drawer link)
- `web/components/Footer.tsx` (Modified: added Notifications link to Explore directory)
- `web/app/dashboard/page.tsx` (Modified: added Notifications card to Quick Links)
- `web/app/api/bookings/route.ts` (Modified: wired automatic `booking_confirmed` notification)
- `web/app/api/bookings/[id]/cancel/route.ts` (Modified: wired automatic `booking_cancelled` notification)
- `web/app/api/auth/change-password/route.ts` (Modified: wired automatic `password_changed` notification)
- `DONE.md` (Updated: progress and verification tracker)

---

## 6. Priority Order of Next Tasks

1. **Manual User Browser Testing**:
   - Log in to RailConnect (`http://localhost:3000/login`).
   - Create a test booking on `/booking` -> observe unread count increment in Navbar bell.
   - Click the Navbar notification bell -> verify dropdown preview displays the `booking_confirmed` alert.
   - Cancel a booking on `/bookings` -> verify `booking_cancelled` notification appears.
   - Change your password in `/settings` -> verify `password_changed` security alert is created.
   - Navigate to `/notifications` -> test All / Unread / Read filters, Mark as Read toggle, and Clear Read actions.
2. **Awaiting User Instruction**: Wait for user review and confirmation before initiating the next scheduled feature.
