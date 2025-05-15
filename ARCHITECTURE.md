# Project Architecture: URL Shortener

This document outlines the architecture of the URL shortener application, refactored to use Next.js App Router.

## 1. Overview

The application allows users to create shortened versions of long URLs. Users can then use these short URLs, which will redirect them to the original long URL. The application also provides basic statistics for each short link, including visit counts and a history of visits.

## 2. Core Technologies

- **Framework**: Next.js (with App Router)
- **Language**: TypeScript
- **Database**: MongoDB
- **Styling**: CSS Modules

## 3. Directory Structure (App Router)

```
/
|-- app/
|   |-- api/
|   |   |-- shorten/
|   |   |   |-- route.ts            # API endpoint for creating short links (POST)
|   |   |-- stats/
|   |   |   |-- [shortCode]/
|   |   |   |   |-- route.ts        # API endpoint for getting link stats (GET)
|   |-- [shortCode]/
|   |   |-- page.tsx              # Dynamic page for handling short link redirection
|   |-- stats/
|   |   |-- [shortCode]/
|   |   |   |-- page.tsx          # Page to display statistics for a short code
|   |   |   |-- StatsPage.module.css # CSS for the stats page
|   |-- page.tsx                  # Main page UI for interacting with the shortener
|   |-- Home.module.css           # CSS for the home page
|   |-- layout.tsx                # (Likely) Root layout for the application
|   |-- globals.css               # (Likely) Global styles, if used with layout
|-- lib/
|   |-- controllers/
|   |   |-- controller.ts         # Base controller class (handles MongoDB connection)
|   |   |-- shortLinkController.ts  # Logic for managing short links (CRUD, stats, visit history)
|   |   |-- shortcodeController.ts  # Existing controller for email shortcodes (separate functionality)
|   |-- util/
|   |   |-- base62.ts             # Utility for encoding/decoding numbers to base62 strings
|-- public/                     # Static assets
|-- styles/                     # May contain global styles if not in app/globals.css
|-- components/                 # Reusable UI components (e.g., from ShadCN if used)
|-- tsconfig.json               # TypeScript configuration
|-- package.json                # Project dependencies and scripts
|-- next.config.mjs             # Next.js configuration
|-- ARCHITECTURE.md             # This file
|-- ... (other configuration files)
```

## 4. Data Flow (App Router)

### 4.1. Creating a Short Link

1.  **User Interface (`app/page.tsx` - Client Component)**:
    *   User enters a long URL.
    *   On submit, a POST request is made to `/api/shorten` with `originalUrl`.

2.  **API Route Handler (`app/api/shorten/route.ts`)**:
    *   Receives POST request (`NextRequest`).
    *   Validates `originalUrl`.
    *   Calls `ShortLinkController.createShortLink(originalUrl)`.
    *   Returns `NextResponse` with `ShortLink` data (including full `shortUrl`) or error.

3.  **Controller (`lib/controllers/shortLinkController.ts`)**: (Logic remains largely the same)
    *   Validates URL, checks existence, generates `shortCode` using `base62` from a counter, inserts into MongoDB.

### 4.2. Redirecting a Short Link

1.  **User Action**: Navigates to a short URL (e.g., `http://domain.com/xyz123`).

2.  **Dynamic Route Page (`app/[shortCode]/page.tsx` - Server Component)**:
    *   Receives `shortCode` from URL parameters.
    *   Calls `ShortLinkController.redirectShortLink(shortCode)` (which also records the visit).
    *   If `originalUrl` is found, uses `redirect()` from `next/navigation`.
    *   If not found, uses `notFound()` from `next/navigation`.

3.  **Controller (`lib/controllers/shortLinkController.ts`)**:
    *   `redirectShortLink(shortCode)`:
        *   Finds link by `shortCode`.
        *   Atomically increments `visits`, updates `lastVisitedAt`, and pushes a new `VisitDetail` (timestamp) to `visitHistory` array.
        *   Returns `originalUrl` string or `null`.

### 4.3. Viewing Link Statistics

1.  **User Interface (`app/page.tsx` or direct navigation)**:
    *   User navigates to stats page (e.g., by clicking a link `http://domain.com/stats/xyz123`).

2.  **Stats Page (`app/stats/[shortCode]/page.tsx` - Client Component)**:
    *   Extracts `shortCode` using `useParams()`.
    *   Fetches data from `/api/stats/[shortCode]`.
    *   Displays statistics, including charts based on `visitHistory`.

3.  **API Route Handler (`app/api/stats/[shortCode]/route.ts`)**:
    *   Receives GET request (`NextRequest`), extracts `shortCode` from dynamic segment.
    *   Calls `ShortLinkController.getLinkStats(shortCode)`.
    *   Returns `NextResponse` with full `ShortLink` data (including `visitHistory`) or error.

4.  **Controller (`lib/controllers/shortLinkController.ts`)**:
    *   `getLinkStats(shortCode)`: Finds and returns the `ShortLink` document, which now includes `visitHistory`.

## 5. Database Schema

### 5.1. `shortLinks` Collection

-   `_id`: `ObjectId`
-   `originalUrl`: `string`
-   `shortCode`: `string` (**unique index**)
-   `createdAt`: `Date`
-   `visits`: `number`
-   `lastVisitedAt`: `Date` (Optional)
-   `visitHistory`: `Array` (Optional)
    -   Each element is a `VisitDetail` object:
        -   `timestamp`: `Date`
        -   `userAgent`: `string` (Optional, if captured)
        -   `referrer`: `string` (Optional, if captured)

### 5.2. `counters` Collection

-   `_id`: `string` (e.g., "shortLinkId")
-   `seq`: `number`

## 6. Key Components and Logic

-   **`base62.ts`**: Base62 encoding/decoding.
-   **`ShortLinkController.ts`**: Core logic for link management, DB interaction, visit tracking.
-   **App Router API Routes (`app/api/.../route.ts`)**: Handle HTTP requests using `NextRequest` and `NextResponse`.
-   **App Router Pages (`app/.../page.tsx`)**: Server and Client Components for UI and server-side logic (like redirection).
    - Redirection (`app/[shortCode]/page.tsx`) is handled server-side for efficiency.
    - UI pages (`app/page.tsx`, `app/stats/[shortCode]/page.tsx`) are Client Components for interactivity.

## 7. Error Handling

-   **API Routes**: Return `NextResponse.json({ error: ... }, { status: ... })`.
-   **Server Components (`app/[shortCode]/page.tsx`)**: Use `notFound()` for 404 errors.
-   **Client Components**: Handle fetch errors and display messages to the user.

## 8. Future Considerations / Potential Improvements

(Content largely the same as before, with emphasis on App Router patterns)
-   **Singleton Controller Instance / DB Connection Management**: Ensure efficient DB connection handling, especially with serverless functions.
-   **Capturing User Agent/Referrer**: Pass necessary request headers from API routes/Server Components to the controller to store more detailed `VisitDetail`.
-   **Advanced URL Validation**, **Custom Short Codes**, **Authentication**, **Rate Limiting**, **Detailed Analytics**, **Scalability**, **Testing** (including for App Router specifics).

This architecture document reflects the shift to the Next.js App Router paradigm. 