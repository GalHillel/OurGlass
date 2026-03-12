# Net Worth Engine

The **OurGlass Net Worth Engine** is the application's "Single Source of Truth" for calculating total wealth. It aggregates data from multiple sources and applies real-time market valuations to provide an accurate financial snapshot.

## Calculation Logic

The engine follows a specific priority matrix to ensure data resilience:

### 1. Asset Valuation Priority
- **Stocks**: `Quantity * Live Market Price * Exchange Rate`. 
  - If market price is unavailable, it falls back to the `current_amount` or `initial_amount`.
- **Foreign Currency**: `Amount * Official Exchange Rate` (USD, EUR support).
- **Yielding Assets**: Uses a compounding formula for Money Market Funds and Savings accounts.
- **Cash/Other**: Uses the `current_amount` (most recent update) or `initial_amount`.

### 2. Live Balance Compounding
For assets that accrue interest (e.g., money market funds), the engine calculates a "Live Balance" using:
$$Balance = Principal \times (1 + \frac{Rate}{100})^{\frac{Days}{365}}$$
*Note: This is calculated on the fly in the client layer for real-time visual updates.*

### 3. Universal USD Support
If an asset's currency is set to `USD`, the value is automatically converted to `ILS` using the latest cached exchange rate before being added to the total.

## Technical Implementation

- **Location**: `src/lib/networth-engine.ts`
- **Output**: Returns a `CalculationResult` object containing:
  - `totalAssets` (Gross)
  - `totalLiabilities`
  - `netWorthBeforeFees` (Assets - Liabilities)
  - `portfolioValue`
  - `calculatedAssets` (Individual asset breakdown with live values)

## Data Sources

| Data Type | Source | Frequency |
| :--- | :--- | :--- |
| Stock Prices | Finnhub API | Cached 1 Minute |
| Exchange Rates | ExchangeRate-API | Cached 1 Hour |
| Static Assets | Supabase DB | Real-time Sync |
| Interest Rates | User Input (Default 4.5% for MMF) | Persistent |

## Safety Mechanisms

- **Number Sanitization**: All inputs are passed through `Number(...) || 0` to prevent `NaN` or `undefined` from breaking the aggregation.
- **Non-Negative Values**: Calculated values are clamped to `Math.max(0, val)` to ensure total wealth doesn't display incorrect negative assets.
