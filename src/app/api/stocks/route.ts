import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.FINNHUB_API_KEY;

// Global Cache for Exchange Rate
let cachedRate = {
    value: 3.65,
    lastUpdated: 0
};

async function getExchangeRate() {
    const now = Date.now();
    const CACHE_DURATION = 3600000; // 1 Hour

    if (now - cachedRate.lastUpdated < CACHE_DURATION) {
        return cachedRate.value;
    }

    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!res.ok) throw new Error('Exchange Rate API failed');

        const data = await res.json();
        const rate = data.rates?.ILS || 3.65;

        cachedRate = {
            value: rate,
            lastUpdated: now
        };
        return rate;
    } catch (e) {
        console.error("Failed to fetch exchange rate:", e);
        return cachedRate.value; // Return stale or default on error
    }
}

async function getQuote(symbol: string) {
    if (!API_KEY) return null;
    try {
        // Finnhub Quote API
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`);
        const data = await res.json();
        return {
            price: data.c || 0, // Current price
            changePercent: data.dp || 0
        };
    } catch (e) {
        console.error(`Error fetching ${symbol}`, e);
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const { symbols } = await request.json();

        // 1. Fetch USD/ILS Rate (from Cache or ExchangeRate-API)
        const usdToIls = await getExchangeRate();

        // 2. Fetch Stocks in Parallel
        const stockPromises = symbols.map(async (sym: string) => {
            const data = await getQuote(sym);
            return {
                symbol: sym,
                price: data?.price || 0,
                currency: 'USD',
                changePercent: data?.changePercent || 0
            };
        });

        const stocks = await Promise.all(stockPromises);

        // Transform array back to object for frontend { 'AAPL': { ... } }
        const stocksMap: Record<string, any> = {};
        stocks.forEach(s => {
            stocksMap[s.symbol] = s;
        });

        return NextResponse.json({
            stocks: stocksMap,
            exchangeRate: usdToIls,
            usdToIls
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
