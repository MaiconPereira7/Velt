# Velt

![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

[🇧🇷 Português](README.md) | 🇺🇸 English

Personal finance and crypto portfolio tracker — keep track of your net worth, manage income and expenses, and get automated insights about your financial habits.

## About the project

Velt is a full-stack project built to practice and showcase real software architecture, not just "making it work." A few technical points worth highlighting:

- **Clean Architecture on the backend** — controllers know nothing about Firestore, and use cases know nothing about Express. The domain layer (`domain/`) defines repository contracts; the concrete implementation (`infra/firestore/`) is isolated and swappable without touching business logic. A `container.ts` acts as a composition root, making it explicit where the pieces connect.
- **End-to-end validation and security** — Zod schemas validate every request body, domain errors become `AppError` with the correct HTTP status (400/401/409) caught by a centralized error handler, and auth routes have rate limiting against brute force.
- **Reactive frontend with modern Angular** — standalone components, signals for local state and `computed` for derived values, functional guards for protected routes, and environment-based configuration (`environment.ts`/`environment.prod.ts`) for production builds.
- **Deliberate contract separation** — the frontend data model (`core/models`) and the backend's `AuthResponse`/`JwtPayload` are defined and kept in sync on purpose, even though they're two independent TypeScript projects.

## Features

- Sign up and login with JWT authentication
- **Dashboard** — net worth overview (crypto + account balance), P&L, recent transactions
- **Wallet** — register crypto assets (BTC, ETH, SOL, etc.) with live pricing
- **Finances** — income/expense tracking, spending categorization, savings rate
- **Insights** — automated analysis of the user's financial data
- **Profile** — account info and consolidated summary

## Stack

- **Frontend:** Angular 19 (standalone components, signals), SCSS
- **Backend:** Node.js + Express + TypeScript, layered architecture (controllers → use cases → repositories)
- **Database:** Firebase Firestore
- **Auth:** JWT (via `jsonwebtoken`)
- **Validation:** Zod
- **Crypto pricing:** CoinGecko (with caching and a simulated fallback if the backend is offline)

## Project structure

```
Velt/
├── server/     # REST API (Express + TypeScript + Firestore)
│   └── src/
│       ├── controllers/    # HTTP layer
│       ├── useCases/       # Business rules (testable without Express/Firestore)
│       ├── domain/         # Entities and repository contracts
│       ├── infra/firestore/# Concrete repository implementations
│       ├── validators/     # Zod schemas
│       └── utils/          # JWT, hashing, error handling, rate limiting, etc.
└── web/        # Frontend (Angular)
    └── src/app/
        ├── core/       # Services, guards, interceptors, config, models
        ├── pages/      # Screens (dashboard, wallet, finances, insights, profile, login, register)
        └── shared/     # Reusable components and pipes (sidebar, formatting)
```

## Getting started

### Prerequisites

- Node.js 20+
- A Firebase project with Firestore enabled and a service account key

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in your own values (see below)
npm run dev
```

The server runs on `http://localhost:3333`.

Environment variables (`server/.env`):

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret key used to sign JWT tokens (generate a strong random value) |
| `PORT` | Server port (default `3333`) |
| `CORS_ORIGIN` | Allowed CORS origin (frontend URL) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (quoted, with escaped `\n`) |

### Frontend

```bash
cd web
npm install
npm start
```

The app runs on `http://localhost:4200`.

## Type checking

```bash
cd server && npx tsc --noEmit
cd web && npx tsc --noEmit -p tsconfig.app.json
```

## License

MIT — see [LICENSE](LICENSE).
