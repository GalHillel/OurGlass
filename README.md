# OurGlass (אוארגלאס) 💎

**OurGlass** is a premium, Hebrew-first AI-powered financial platform designed specifically for couples. It transforms joint finance management into a shared, proactive, and even enjoyable journey.

> [!NOTE]
> **Language Support**: The application UI, AI interactions, and user-facing content are **entirely in Hebrew**.

---

## ✨ Features

- **💎 Net Worth Engine**: Real-time tracking of shared assets, stocks, real estate, and liabilities.
- **🤖 Roee AI Agent**: A conversational assistant that logs transactions, updates assets, and provides financial advice in natural Hebrew.
- **📊 Wealth Journey**: Visual history of your couple's net worth progression.
- **📈 Market Integration**: Live stock prices (Finnhub) and USD/ILS exchange rates.
- **💡 Smart Insights**: Witty, AI-generated daily insights that "roast" or "praise" your spending habits.
- **🔄 Ghost Assets**: Track and optimize recurring subscriptions and memberships.
- **🪄 Yield Accrual**: Automatic interest calculation for high-yield savings and money market funds.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Backend/DB**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/) + Google Gemini
- **State**: Zustand & React Query
- **Styling**: Tailwind CSS + Framer Motion
- **UI Components**: Radix UI + Lucide React

## 🏗️ Architecture Overview

OurGlass uses a robust multi-tenant architecture where every piece of data is scoped to a unique `couple_id`.
- **Client**: Modern React components with glassmorphic design.
- **API**: Edge-ready Next.js routes for AI orchestration and market data.
- **Database**: PostgreSQL with strict Row Level Security (RLS) policies for couple data isolation.

For more details, see [docs/architecture.md](./docs/architecture.md).

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js 18+
- A Supabase account
- A Google AI (Gemini) API Key

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/OurGlass.git
cd OurGlass
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Variables
Copy the example template and fill in your keys:
```bash
cp env/example.env .env.local
```
Refer to [env/example.env](./env/example.env) for a full list of required variables.

### 5. Database Setup
1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in the Supabase dashboard.
3. Paste and run the contents of [database/schema.sql](./database/schema.sql).

### 6. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📦 Project Structure

```text
/docs           # Detailed technical documentation
/database       # SQL schema and migration scripts
/env            # Environment variable templates
/src
  /app          # Next.js App Router (Pages & API)
  /components   # React UI components
  /lib          # Core engines (Net Worth, AI Router)
  /utils        # Supabase helpers and utilities
  /types        # TypeScript definitions
```

---

## 🚢 Deployment

OurGlass is optimized for deployment on **Vercel**. See the [Deployment Guide](./docs/deployment.md) for step-by-step instructions for Vercel and Supabase.

---

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on coding standards and pull request workflows.

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Made with ❤️ for couples who want to build their future together.*
