import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function fetchStockData(symbols: string[]) {
    try {
        if (symbols.length === 0) return {};

        const joinedSymbols = symbols.join(',');
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${joinedSymbols}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Yahoo API failed');

        const data = await response.json();
        const results = data.quoteResponse?.result || [];

        // Map to Object keyed by symbol for O(1) lookup
        const stocksMap: Record<string, any> = {};
        results.forEach((stock: any) => {
            stocksMap[stock.symbol] = {
                symbol: stock.symbol,
                price: stock.regularMarketPrice,
                currency: stock.currency,
                changePercent: stock.regularMarketChangePercent,
                dayHigh: stock.regularMarketDayHigh,
                dayLow: stock.regularMarketDayLow,
            };
        });

        return stocksMap;
    } catch (e) {
        console.error("Fetch Stocks Error:", e);
        return {};
    }
}

async function fetchUsdIls() {
    try {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=ILS=X`;
        const res = await fetch(url);
        if (!res.ok) return 3.7; // Fallback
        const data = await res.json();
        return data.quoteResponse?.result?.[0]?.regularMarketPrice || 3.7;
    } catch {
        return 3.7;
    }
}

export async function GET() {
    // Default "Market Watch" list for GET request
    const defaultSymbols = ['AAPL', 'MSFT', 'TSLA', 'SPY', 'QQQ', 'BTC-USD'];
    const stocks = await fetchStockData(defaultSymbols);
    const usdToIls = await fetchUsdIls();

    return NextResponse.json({ stocks, usdToIls });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const symbols = body.symbols || [];

        if (!Array.isArray(symbols)) {
            return NextResponse.json({ error: 'Symbols must be an array' }, { status: 400 });
        }

        const stocks = await fetchStockData(symbols);
        const usdToIls = await fetchUsdIls();

        return NextResponse.json({ stocks, usdToIls });

    } catch (error) {
        console.error('Stock API Error:', error);
        // Return valid JSON even on error to prevent Client crash
        return NextResponse.json({ stocks: {}, usdToIls: 3.7 });
    }
}
