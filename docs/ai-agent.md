# AI Agent Documentation

The OurGlass AI Agent, known as **"Roee" (רועי)**, is the intelligent core of the application. It serves as a personal financial assistant for the couple, capable of understanding natural Hebrew language and taking actions on their behalf.

## Technology Stack

- **Framework**: [Vercel AI SDK](https://sdk.vercel.ai/)
- **Provider**: Google Generative AI (Gemini 2.0 Flash)
- **Backup**: OpenAI (GPT-4o mini)
- **Integration**: Next.js API Routes (`/api/chat`)

## Core Capabilities

### 1. Transaction Logging
Users can record expenses or income in natural language.
- *Examples*: "הוצאנו הרגע 150 שקל על קפה ומאפה בארומה" or "נכנסה משכורת של 12,000 שקל".
- Roee automatically categorizes the transaction and identifies the payer.

### 2. Asset & Investment Management
Users can add or update their assets, including stocks and foreign currency.
- *Examples*: "הוספתי 50 מניות של אפל" or "חסכנו עוד 500 דולר במזומן".

### 3. Financial Inquiries
Roee can answer questions about the couple's financial status.
- *Examples*: "כמה כסף הוצאנו על אוכל החודש?" or "מה השווי הנקי שלנו כרגע?".

## Tool Calling (Function Calling)

Roee is equipped with specific tools to interact with the OurGlass database securely:

| Tool Name | Purpose |
| :--- | :--- |
| `addTransaction` | Records a new expense or income entry. |
| `updateTransaction` | Modifies an existing transaction record. |
| `deleteTransaction` | Removes a transaction from the history. |
| `addAsset` | Adds a new asset (Cash, Stock, etc.) to the wealth list. |
| `addSubscription` | Set up a new recurring monthly/yearly payment. |
| `addWish` | Adds an item to the shared couple wishlist. |
| `MapsToPage` | Navigates the user to a specific screen in the app. |

## Guardrails & Logic

- **Absolute Values**: Roee is programmed to always send positive numbers to tools to avoid database corruption.
- **Installments**: Automatically handles Hebrew "Tashlumim" by recording the total amount and payment count.
- **Mandatory Feedback**: Roee always provides a verbal confirmation in Hebrew after executing a tool.
- **Couple Scoping**: Every action taken by Roee is strictly scoped to the active user's `couple_id`.

## Personality

Roee is designed to be:
- **Proactive**: Points out potential savings or unusual spending.
- **Israeli**: Uses modern slang and understands the local financial context.
- **Supportive**: Encourages the couple towards their financial goals.
