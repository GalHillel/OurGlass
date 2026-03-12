# Deployment Guide

OurGlass is designed for seamless deployment using **Vercel** for the frontend/API and **Supabase** for the backend/database.

## 1. Supabase Setup

1. **Create a New Project**: Sign up at [supabase.com](https://supabase.com) and create a new project.
2. **Initialize Database**:
   - Go to the **SQL Editor**.
   - Copy the contents of [`database/schema.sql`](../database/schema.sql) and run it.
   - This will set up all tables, RLS policies, and functions.
3. **API Keys**:
   - Go to **Project Settings > API**.
   - Copy the `URL`, `anon public` key, and `service_role` key.

## 2. Environment Variables

Create a `.env.local` file (use [`env/example.env`](../env/example.env) as a template) and populate it with your keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_google_ai_key
FINNHUB_API_KEY=your_finnhub_key
```

## 3. Vercel Deployment

1. **Connect Repository**: Push your code to GitHub/GitLab and link it to a new project in [Vercel](https://vercel.com).
2. **Configure Environment Variables**:
   - Add all variables from your `.env.local` to the Vercel Project Settings.
3. **Build Settings**:
   - Framework Preset: **Next.js**.
   - Root Directory: `./`.
4. **Deploy**: Click "Deploy". Vercel will automatically detect the App Router and Edge/Serverless functions.

## 4. Post-Deployment

- **Authentication**: Update the **Redirect URLs** in Supabase Auth settings to match your Vercel deployment URL (e.g., `https://your-app.vercel.app/auth/callback`).
- **Cron Jobs**: If using daily snapshots or interest accrual, you can use Vercel Cron Jobs or Supabase `pg_net` to trigger the `/api/yield` and `/api/monthly-story` endpoints.

## Troubleshooting

- **401 Unauthorized**: Ensure the `NEXT_PUBLIC_SUPABASE_URL` and `ANON_KEY` are correctly set in Vercel.
- **Supabase Policy Errors**: Check that the `current_couple_id()` function was correctly created in the SQL Editor.
- **AI Response Failures**: Verify your `GEMINI_API_KEY` has sufficient quota and is correctly entered.
