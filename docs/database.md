# Database Documentation

OurGlass uses **Supabase (PostgreSQL)** as its primary data layer. The database is designed with a multi-tenant "Couple Model" at its core, ensuring strict data isolation and efficient relational queries.

## The Couple Model

Every user belongs to a `couple_id`. This ID is the primary partition key for all financial data.

- **Isolation**: Row Level Security (RLS) ensures that a user can only see or modify data where the `couple_id` matches their own.
- **Shared Access**: When two users are linked in a profile, they share the same `couple_id`, giving them a unified view of their finances.

## Key Tables

| Table | Description |
| :--- | :--- |
| `profiles` | User metadata, settings, and partner associations. |
| `transactions` | Ledger of all income, expenses, and transfers. |
| `categories` | Financial categories (Fixed/Variable) with budget limits. |
| `goals` | Assets, savings goals, and investment holdings. |
| `subscriptions` | Recurring monthly/yearly payments (Ghost Assets). |
| `liabilities` | Loans, mortgages, and debts. |
| `wealth_history`| Daily/Monthly snapshots for net worth progression charts. |
| `wishlist` | Shared list of items the couple wants to purchase. |

## Row Level Security (RLS)

RLS is enabled on all tables. Policies are generally defined as:
```sql
CREATE POLICY "Couples can manage their data" ON table_name
FOR ALL USING (couple_id = public.current_couple_id());
```

## Stored Procedures & Logic

- **`current_couple_id()`**: A helper function to safely retrieve the active user's `couple_id` from the `profiles` table.
- **`accrue_yield_for_couple()`**: A server-side procedure that compounds interest for yielding assets based on the elapsed time since the last update.
- **`handle_new_user()`**: An auth hook that automatically creates a profile and a new `couple_id` upon signup.

## Indexes

Strategic indexing is applied to `couple_id` and `date` columns to ensure high performance even with thousands of transactions per couple.

- `transactions_couple_date_idx`: Optimizes the main transaction feed.
- `wealth_history_couple_date_idx`: Optimizes chart rendering.
- `transactions_couple_idempotency_key_uidx`: Prevents duplicate entries from AI tools or rapid UI clicks.
