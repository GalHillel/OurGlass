import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.FINNHUB_API_KEY;

// ============ CACHE CONFIGURATION ============
const CACHE_DURATION_MS = 1 * 60 * 1000; // 1 minute for stock prices
const EXCHANGE_RATE_CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours for exchange rate
const FETCH_TIMEOUT_MS = 5000; // 5 second timeout per stock

// ============ CACHE STORES ============
interface StockCacheEntry {
    price: number;
    changePercent: number;
    timestamp: number;
}

interface ExchangeRateCacheEntry {
    value: number;
    lastUpdated: number;
}

const stockCache = new Map<string, StockCacheEntry>();
let exchangeRateCache: ExchangeRateCacheEntry = {
    value: 3.65,
    lastUpdated: 0
};

// ============ UTILITY FUNCTIONS ============

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Get exchange rate with caching
 */
async function getExchangeRate(): Promise<{ rate: number; cached: boolean }> {
    const now = Date.now();

    // Return cached if still valid
    if (now - exchangeRateCache.lastUpdated < EXCHANGE_RATE_CACHE_DURATION_MS) {
        return { rate: exchangeRateCache.value, cached: true };
    }

    try {
        const res = await fetchWithTimeout('https://api.exchangerate-api.com/v4/latest/USD', FETCH_TIMEOUT_MS);
        if (!res.ok) throw new Error('Exchange Rate API failed');

        const data = await res.json();
        const rate = data.rates?.ILS || 3.65;

        exchangeRateCache = {
            value: rate,
            lastUpdated: now
        };

        return { rate, cached: false };
    } catch (e) {
        console.error("Failed to fetch exchange rate:", e);
        // Return stale cache on error
        return { rate: exchangeRateCache.value, cached: true };
    }
}

/**
 * Get quote for a single stock with caching
 */
async function getQuote(symbol: string): Promise<{ price: number; changePercent: number; cached: boolean; error?: string }> {
    const now = Date.now();
    const cached = stockCache.get(symbol);

    // Return cached if still valid
    if (cached && (now - cached.timestamp < CACHE_DURATION_MS)) {
        return {
            price: cached.price,
            changePercent: cached.changePercent,
            cached: true
        };
    }

    if (!API_KEY) {
        // If no API key, return cached or zero
        if (cached) {
            return { price: cached.price, changePercent: cached.changePercent, cached: true };
        }
        return { price: 0, changePercent: 0, cached: false, error: 'No API key configured' };
    }

    try {
        const res = await fetchWithTimeout(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`,
            FETCH_TIMEOUT_MS
        );

        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();

        // Check for valid data
        if (data.c === undefined || data.c === 0) {
            // Return cached data on invalid response
            if (cached) {
                return { price: cached.price, changePercent: cached.changePercent, cached: true };
            }
            return { price: 0, changePercent: 0, cached: false, error: 'Invalid symbol or no data' };
        }

        const stockData = {
            price: data.c || 0,
            changePercent: data.dp || 0,
            timestamp: now
        };

        // Update cache
        stockCache.set(symbol, stockData);

        return {
            price: stockData.price,
            changePercent: stockData.changePercent,
            cached: false
        };
    } catch (e) {
        console.error(`Error fetching ${symbol}:`, e);
        // Return cached on error
        if (cached) {
            return { price: cached.price, changePercent: cached.changePercent, cached: true };
        }
        return { price: 0, changePercent: 0, cached: false, error: (e as Error).message };
    }
}

// ============ API HANDLER ============
export async function POST(request: Request) {
    try {
        const { symbols } = await request.json();

        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: symbols array required' },
                { status: 400 }
            );
        }

        // 1. Fetch USD/ILS Rate (from Cache or API)
        const { rate: usdToIls, cached: exchangeRateCached } = await getExchangeRate();

        // 2. Fetch Stocks in Parallel with individual error handling
        const stockPromises = symbols.map(async (sym: string) => {
            const data = await getQuote(sym);
            return {
                symbol: sym,
                price: data.price,
                currency: 'USD',
                changePercent: data.changePercent,
                cached: data.cached,
                error: data.error
            };
        });

        const stocks = await Promise.all(stockPromises);

        // 3. Transform array to object for frontend
        const stocksMap: Record<string, {
            symbol: string;
            price: number;
            currency: string;
            changePercent: number;
            cached?: boolean;
            error?: string;
        }> = {};

        let anyErrors = false;
        let allCached = true;

        stocks.forEach(s => {
            stocksMap[s.symbol] = s;
            if (s.error) anyErrors = true;
            if (!s.cached) allCached = false;
        });

        return NextResponse.json({
            stocks: stocksMap,
            exchangeRate: usdToIls,
            usdToIls,
            meta: {
                exchangeRateCached,
                allCached,
                anyErrors,
                timestamp: Date.now(),
                cacheDurationMs: CACHE_DURATION_MS
            }
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            {
                error: 'Failed to fetch stock data',
                message: (error as Error).message,
                retryable: true
            },
            { status: 500 }
        );
    }
}
