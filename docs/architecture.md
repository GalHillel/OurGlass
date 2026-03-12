# System Architecture

OurGlass is built with a modern, full-stack Next.js architecture, leveraging Supabase for the backend and Vercel AI SDK for intelligent features.

## High-Level Architecture

```mermaid
graph TD
    User((User))
    Client[Next.js Client (React + Tailwind)]
    API[Next.js API Routes (Edge/Serverless)]
    DB[(Supabase PostgreSQL)]
    AI[Vercel AI SDK / Google Gemini]
    Market[External APIs: Finnhub / Fixer]

    User <--> Client
    Client <--> API
    API <--> DB
    API <--> AI
    API <--> Market
    Client <--> DB (Direct via Supabase Client)
```

## Layers

### 1. Client Layer (React / Next.js)
- **Framework**: Next.js 16+ (App Router).
- **Styling**: Tailwind CSS for a responsive, modern glassmorphic design.
- **State Management**: Zustand (Global state) + React Query (Server state).
- **UI Components**: Radix UI (accessible primitives) + Lucide React (icons).
- **Animations**: Framer Motion for smooth transitions and Micro-animations.

### 2. API Layer (Next.js Routes)
- **Secure Endpoints**: Handles sensitive logic like AI routing, market data fetching, and rate limiting.
- **AI Router**: Intelligently switches between Gemini and OpenAI models based on quota and performance.
- **Rate Limiting**: Custom token-bucket rate limiting to prevent API abuse.

### 3. Database Layer (Supabase)
- **PostgreSQL**: Robust, relational data storage.
- **Row Level Security (RLS)**: Enforces the "Couple Model" - users can only access data belonging to their shared `couple_id`.
- **Functions & Triggers**: Handles complex server-side logic like yield accrual and automatic profile creation.
- **Auth**: Fully managed Supabase Auth with social login support.

### 4. AI Engine
- **Models**: Predominantly Gemini 1.5/2.0 Flash for speed and accuracy.
- **Tool Calling**: Native integration with Vercel AI SDK to allow the AI to interact directly with the database schema.
- **System Prompts**: Highly tuned Hebrew-first persona ("Roee") for a natural user experience.

### 5. Net Worth Engine
- **Single Source of Truth**: A client-side logic layer that calculates total wealth by aggregating assets (cash, stocks, foreign currency) and subtracting liabilities.
- **Live Sync**: Integrates real-time market data to ensure values are always accurate.
