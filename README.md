# Card Delivery App

Independent courier application for delivering physical bank cards.

This app has its **own** frontend, backend, database, users, customers, cards, OTP system, and delivery history. It does **not** connect to the CIB Scanning App.

A later integration may send only the **count of successfully delivered cards** to the CIB Scanning App admin dashboard. That connection is not implemented yet.

## Courier workflow

1. Scan the card QR code → card enters courier custody
2. Deliver the card to the customer in person
3. Send OTP → customer receives it by email
4. Customer tells the courier the OTP
5. Courier enters the OTP → backend verifies it → card is marked delivered

## Pages

- Login
- Dashboard
- Deliveries
- History
- Profile

## Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Set the PostgreSQL postgres password and development database name in `backend/.env`.
3. Create the development database in PostgreSQL if it does not exist.
4. Optionally create `delivery_test` and set `TEST_DATABASE_URL` (required for backend tests only).
5. Install, migrate, seed, and start:

```bash
npm install
npm run setup
npm run dev
```

- Web app: http://localhost:5174
- API: http://localhost:4100

`npm run setup` reads `DATABASE_URL` from `backend/.env`. It will fail with Prisma P1012 until that file exists and the URL is set.

Do not point `DATABASE_URL` and `TEST_DATABASE_URL` at the same database.

## Local frontend + backend without PostgreSQL

Temporary development mode. The real Vite frontend still calls the real Express API. Prisma and PostgreSQL stay in the project.

In `backend/.env`:

```bash
BACKEND_DATA_MODE=memory
```

Do not set `DATABASE_URL`. Do not set `VITE_API_URL`. Then:

```bash
npm run dev
```

- Web app: http://localhost:5174 (use the Vite Network URL on your phone)
- API: http://localhost:4100 (in-memory store, no PostgreSQL)

Unset `BACKEND_DATA_MODE` or set `BACKEND_DATA_MODE=database` to use Prisma/PostgreSQL again. Memory mode is not allowed in production.

Demo courier login:

- Email: `courier@gmail.com`
- Password: `12345678`

## Testing QR scan without a printed card

After seeding, PNG QR codes are written to `backend/qr-codes/`. Open a pending-card PNG and scan it with the camera, or use **Use photo of QR code** on the Scan page. Couriers do not type the QR value.

Pending demo tokens are also printed in the seed output.

## Email / OTP

OTP codes are generated on the backend as random 6-digit values, stored directly, and emailed to the customer with Resend. They expire after 5 minutes. The courier UI never receives the OTP.

Production requires `JWT_SECRET`. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` on Railway only.

## Tests

The repo uses **Vitest**. Backend tests hit the real Express app and Prisma against an isolated Postgres database. Frontend tests use Testing Library in jsdom. OTP email is mocked; Resend is never called.

Create a dedicated database whose name contains `test`, for example `delivery_test`. Never point tests at production.

This Windows machine already has **PostgreSQL 17** running as service `postgresql-x64-17` on port `5432`. `psql` is not on PATH. Create the isolated test database with your existing Postgres password:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h 127.0.0.1 -c "CREATE DATABASE delivery_test;"
```

Then set in `backend/.env`:

```bash
# backend/.env
TEST_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/delivery_test?schema=public"
```

Do not reuse `DATABASE_URL` for tests. Backend tests ignore `DATABASE_URL` and refuse to start without `TEST_DATABASE_URL`.

```bash
npm test
npm run test:watch
npm run test:coverage
```

CI (GitHub Actions) starts its own Postgres service and uses a dummy `JWT_SECRET`. It does not use Resend or production secrets.

## Environment

Copy `backend/.env.example` to `backend/.env`. Never commit `backend/.env`.

- `BACKEND_DATA_MODE` — `memory` for a temporary in-memory store (no PostgreSQL); unset or `database` for Prisma/PostgreSQL. Forbidden in production.
- `DATABASE_URL` — local development database used by `npm run setup` and database mode. Not required in memory mode.
- `TEST_DATABASE_URL` — isolated `delivery_test` database used only by backend tests
- `JWT_SECRET` — local placeholders are fine in development; required in production
- `RESEND_API_KEY` — Railway backend only; used to email the OTP
- `RESEND_FROM_EMAIL` — Railway backend only; Resend from address
- `FRONTEND_ORIGIN` — allowed frontend origin(s)

The backend uses Prisma with PostgreSQL. On Railway, the Postgres plugin provides `DATABASE_URL` automatically — do not hardcode a production URL.

Production start runs `prisma migrate deploy` before the API, which creates the required tables.

## Repeat scans and cancellation

Scanning an active card already assigned to the courier shows **Already scanned**. The OTP button opens verification directly; if no OTP has been sent yet, it sends one using the existing email flow. An existing OTP is reused.

Couriers can cancel an active delivery by entering a reason and allowing a fresh device location capture. Cancellation requires coordinates, accuracy and a recent capture timestamp; permission denial or location failure leaves the delivery active. The saved record includes the server cancellation time, courier identity and customer address snapshot. Cancellation invalidates outstanding OTPs and prevents further scan, send or verify actions on that card.

The courier dashboard includes **Cancelled Cards**, linking to the cancelled deliveries filter. Each record shows the reason, courier, timestamps, location accuracy and a map link. Reporting follows the existing signed-in courier scope. Device-reported location is evidence for review, not independently verified proof of presence. Customer records currently contain addresses rather than GPS coordinates, so automatic distance comparison is not available.

The additive database migration adds a nullable cancellation JSON record to Card. The existing production start command applies it before starting the backend. Deploy the updated backend before the frontend. These changes do not require new email configuration.
