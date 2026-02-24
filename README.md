# OurGlass 💎 - Couple Finance Tracker

OurGlass is a premium, edge-to-edge finance tracking application designed specifically for couples. It combines real-time market data, AI-driven financial insights, and a sleek "Bento Box" UI to help couples manage their joint and individual finances with elegance and clarity.

## ✨ Key Features

- **Unified Cashflow**: Merges transactions, subscriptions, and debt payments into a single, easy-to-read "Reactor Core" balance.
- **Investment Portfolio**: Real-time stock tracking via Finnhub with live exchange rate conversion (USD/ILS).
- **AI Financial Psychologist**: A dedicated chat assistant that analyzes your spending habits and offers personalized advice.
- **Wishlist & Saving Goals**: Collaborative wishlist with a "Saving Oracle" that calculates how many work hours a dream item costs.
- **Full-Bleed UI**: Immersive, glassmorphic design that spans the entire screen height for a native-app feel.
- **Real-time Sync**: Instant updates across devices using Supabase Realtime subscriptions.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Database / Auth**: [Supabase](https://supabase.com/)
- **State Management**: [TanStack Query v5](https://tanstack.com/query/latest)
- **AI Integration**: [OpenAI](https://openai.com/) / [Google Gemini](https://ai.google.dev/)
- **Market Data**: [Finnhub API](https://finnhub.io/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed.
- A Supabase account.
- A Finnhub API key (free tier is enough).
- An OpenAI or Gemini API key.

### 2. Environment Variables
Create a `.env.local` file in the root directory and populate it with the following:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Integration (At least one required)
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Market Data (Required for Stocks)
FINNHUB_API_KEY=your_finnhub_key

# PWA & Notifications (Optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public
VAPID_PRIVATE_KEY=your_vapid_private
VAPID_EMAIL=mailto:admin@yourdomain.com

# Identity (Optional - Default User)
NEXT_PUBLIC_AUTO_EMAIL=admin@ourglass.app
NEXT_PUBLIC_AUTO_PASSWORD=password123
```

### 3. Supabase Database Setup
You need to create the following tables in your Supabase project. Ensure `couple_id` is used as a foreign key or a grouping field for data isolation.

| Table | Description |
| :--- | :--- |
| `profiles` | User profiles (name, budget, income, `couple_id`). |
| `couples` | Join table for couples. |
| `transactions` | Daily expenses and incomes. |
| `categories` | Custom expense categories. |
| `subscriptions` | Recurring monthly expenses. |
| `goals` | Financial assets (Cash, Stocks, Crypto, etc.). |
| `liabilities` | Debts, loans, and mortgages. |
| `wishlist` | Shared dream items. |
| `wealth_snapshots` | Historical snapshots for net worth charts. |

**Important**: Enable **Row Level Security (RLS)** on all tables and create policies that restrict access to data matching the user's `couple_id`.

### 4. Vercel Deployment
To deploy on Vercel:
1. Push your code to GitHub.
2. Link the repository to Vercel.
3. Add all the environment variables from your `.env.local` to the Vercel project settings.
4. **Cron Jobs**: If you wish to use "Ghost Subscriptions" (auto-detecting recurring charges), you can set up a Vercel Cron Job to hit `/api/ghost-subs` daily.

---

## 🎨 Code Customization & Localization

### Language
The app is currently localized in **Hebrew (RTL)**. To change the language, you should:
1. Update `src/app/layout.tsx` (change `lang="he"` and `dir="rtl"`).
2. Translate the strings in the components (mostly located in `src/components` and `src/app`).

### Multi-Payer Logic
The app uses an `appIdentity` store (`src/stores/appStore.ts`) to distinguish between the two partners. In `Settings`, users can set their device identity to "Him" or "Her" to automate payer attribution for new transactions.

---

## 🛠 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛡 Security Note
Never commit your `.env.local` file to version control. The repository includes a `.gitignore` to prevent this by default. Ensure your Supabase RLS policies are strictly enforced to prevent cross-couple data leaks.

---

Designed with ❤️ for couples who care about their financial future.
