# Expense Tracker — Phase 1

This is step 1 of the agent build plan: database schema + CSV upload + basic dashboard.
Categorization here uses simple keyword rules — phase 2 swaps this for an LLM-based
categorization agent that handles messy merchant names, plus anomaly detection and a
weekly digest.

## Structure

```
expense-tracker/
  backend/    Express + TypeScript + Prisma (SQLite by default)
  frontend/   React + Vite dashboard
```

## Run it

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

This starts the API on http://localhost:4000.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

### 3. Try it

Upload `backend/sample-data/transactions.csv` from the dashboard to see it populate
with sample data, or upload your own bank statement export as a CSV with columns:
`date, description, amount` (negative amounts = expenses, positive = income).

## What's here

- **Upload** — parses a CSV, auto-categorizes each row with keyword rules, stores it.
- **Dashboard summary** (`GET /dashboard/summary`) — income, expenses, net, and a
  per-category breakdown for the current month.
- **Budget vs actual** — add rows to the `Budget` table (via Prisma Studio: `npx prisma studio`)
  to set a monthly limit per category; the summary endpoint flags anything over budget.
- **Burn rate** (`GET /dashboard/burn-rate?balance=X`) — rough "days until zero" estimate
  based on this month's spending pace.

## Next phase (the agent part)

1. Replace keyword categorization with an LLM call per transaction batch (handles
   inconsistent merchant naming much better).
2. Add a weekly job that compares each category's spend to its rolling average and
   flags anomalies.
3. Generate a plain-language weekly digest and deliver it by email or a chat bot
   (Telegram/WhatsApp), optionally allowing you to log expenses by just texting it.

Say the word when you're ready to move to phase 2 and I'll build the categorization
agent next.
