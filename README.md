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

```bash
npm install
npm run setup
npm run dev
```

- Web app: http://localhost:5174
- API: http://localhost:4100

Demo courier login:

- Email: `courier`
- Password: `123456`

## Testing QR scan without a printed card

After seeding, PNG QR codes are written to `backend/qr-codes/`. Open a pending-card PNG and scan it with the camera, or use **Use photo of QR code** on the Scan page. Couriers do not type the QR value.

Pending demo tokens are also printed in the seed output.

## Email / OTP

Set SMTP values in `backend/.env` to send real OTP emails. If SMTP is not configured, the API still creates the OTP and logs it to the backend console so you can complete the flow locally.

## Environment

Copy `backend/.env.example` to `backend/.env`.

The backend uses Prisma with PostgreSQL. Set `DATABASE_URL` to a Postgres connection string. On Railway, the Postgres plugin provides `DATABASE_URL` automatically — do not hardcode it.

Production start runs `prisma migrate deploy` before the API, which creates the required tables.
