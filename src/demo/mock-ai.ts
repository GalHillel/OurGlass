import { mockDB } from "./mock-db";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export const MOCK_AI_RESPONSES = [
    {
        keywords: ["וולט", "wolt", "אוכל", "מסעדות"],
        generate: () => {
            const txs = mockDB.getTransactions().filter(t => t.category === "אוכל" || t.description?.includes("וולט"));
            const count = txs.length;
            const total = Math.abs(txs.reduce((acc, t) => acc + t.amount, 0));
            return `ראיתי שקניתם וולט ${count} פעמים בתקופה האחרונה 😅 סך הכל הוצאתם ${CURRENCY_SYMBOL}${total.toLocaleString()}. אולי כדאי לבשל קצת יותר? זה יכול לחסוך לכם המון.`;
        }
    },
    {
        keywords: ["יפן", "טיול", "חופשה"],
        generate: () => {
            const wish = mockDB.getWishlist().find(w => w.name.includes("יפן"));
            if (wish) {
                const remaining = wish.price - wish.saved_amount;
                return `אם תמשיכו לחסוך בקצב הנוכחי, תגיעו ליעד הטיול ליפן בעוד כמה חודשים! 🇯🇵 חסרים לכם עוד ${CURRENCY_SYMBOL}${remaining.toLocaleString()} כדי להשלים את היעד.`;
            }
            return "חופשה ביפן היא רעיון מעולה! כדאי להוסיף אותה לווישליסט כדי שנוכל לעקוב אחרי החיסכון.";
        }
    },
    {
        keywords: ["מניות", "השקעות", "תיק", "בורסה"],
        generate: () => {
            const assets = mockDB.getAssets().filter(a => a.type === "stock");
            const total = assets.reduce((acc, a) => acc + a.current_amount, 0);
            return `תיק ההשקעות שלכם שווה כרגע ${CURRENCY_SYMBOL}${total.toLocaleString()}. הוא מגוון יחסית, אבל כדאי לשים לב לחשיפה הגבוהה למניות טכנולוגיה כמו NVDA ו-AAPL.`;
        }
    },
    {
        keywords: ["בזבוזים", "הוצאות", "מצב", "איך אנחנו"],
        generate: () => {
            return "החודש ההוצאות שלכם על בילויים עלו קצת, אבל חסכתם יפה בקטגוריית הקניות! 💪 סך הכל המצב נראה יציב מאוד.";
        }
    },
    {
        keywords: ["הלוואה", "רכב", "טסלה"],
        generate: () => {
            const liab = mockDB.getLiabilities().find(l => l.name.includes("רכב"));
            if (liab) {
                return `ההלוואה ל${liab.name} עומדת על ${CURRENCY_SYMBOL}${liab.remaining_amount.toLocaleString()}. אם תגדילו את ההחזר החודשי ב-200 ₪, תוכלו לחסוך קצת בריביות.`;
            }
            return "נראה שאין לכם הלוואות פתוחות על רכב כרגע. מעולה!";
        }
    },
    {
        keywords: ["תקציב", "חריגה", "בדיקה"],
        generate: () => {
            return "בדקתי את התקציב שלכם - אתם עומדים ביעדים ברוב הקטגוריות. שימו לב רק להוצאות ה׳בילויים׳ שהן קרובות לרף העליון שהצבתם.";
        }
    }
];

export function getMockAIResponse(input: string): string {
    const normalized = input.toLowerCase();
    const match = MOCK_AI_RESPONSES.find(r => 
        r.keywords.some(k => normalized.includes(k.toLowerCase()))
    );
    
    return match ? match.generate() : "אני מנתח את הנתונים הפיננסיים שלכם... נראה שהמצב מעולה! יש לכם עוד שאלות ספציפיות על הנתונים?";
}
