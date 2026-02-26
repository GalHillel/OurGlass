import React from "react";
import {
    HeartPulse,
    PiggyBank,
    Rocket,
    Shield,
    Zap,
    Users,
    CalendarDays,
    PieChart,
    Sparkles,
    Gift,
    CreditCard,
    MessageSquare,
    Lightbulb
} from "lucide-react";

export interface WidgetInfo {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
}

export const WIDGET_REGISTRY: Record<string, WidgetInfo> = {
    'reactor': {
        id: 'reactor',
        label: 'ליבת הכור',
        description: 'מבט על של השרפה החודשית והתקציב',
        icon: Zap,
        color: 'text-blue-400'
    },
    'ai-hub': {
        id: 'ai-hub',
        label: 'מרכז ה-AI',
        description: 'תובנות חכמות וסיכומי AI',
        icon: Sparkles,
        color: 'text-purple-400'
    },
    'health': {
        id: 'health',
        label: 'בריאות פיננסית',
        description: 'מדד הבריאות של התקציב שלך',
        icon: HeartPulse,
        color: 'text-blue-300'
    },
    'savings': {
        id: 'savings',
        label: 'חיסכון חודשי',
        description: 'מעקב אחר החיסכון והצבירה',
        icon: PiggyBank,
        color: 'text-emerald-300'
    },
    'investments': {
        id: 'investments',
        label: 'תיק השקעות',
        description: 'מעקב אחר מניות וניירות ערך',
        icon: Rocket,
        color: 'text-purple-300'
    },
    'vault': {
        id: 'vault',
        label: 'מזומן וכספות',
        description: 'ניהול נזילות ומזומנים',
        icon: Shield,
        color: 'text-amber-300'
    },
    'quick-action': {
        id: 'quick-action',
        label: 'פעולה מהירה',
        description: 'הוספת הוצאות בקליק',
        icon: Zap,
        color: 'text-cyan-300'
    },
    'partner-stats': {
        id: 'partner-stats',
        label: 'חלוקת בני זוג',
        description: 'מי שילם כמה ואיך מתחלקים',
        icon: Users,
        color: 'text-pink-300'
    },
    'calendar': {
        id: 'calendar',
        label: 'לוח הוצאות',
        description: 'מבט חודשי על ציר הזמן',
        icon: CalendarDays,
        color: 'text-indigo-300'
    },
    'categories': {
        id: 'categories',
        label: 'פילוח קטגוריות',
        description: 'איפה הכסף באמת הולך',
        icon: PieChart,
        color: 'text-rose-300'
    },
    'settlements': {
        id: 'settlements',
        label: 'התחשבנויות',
        description: 'סגירת חובות בין בני הזוג',
        icon: Users,
        color: 'text-amber-400'
    },
    'subscriptions': {
        id: 'subscriptions',
        label: 'הוצאות קבועות',
        description: 'מעקב אחר מנויים והוראות קבע',
        icon: CreditCard,
        color: 'text-cyan-300'
    },
    'wishlist': {
        id: 'wishlist',
        label: 'רשימת משאלות',
        description: 'ניהול רכישות מתוכננות וחלומות',
        icon: Gift,
        color: 'text-pink-300'
    },
    'monthly-roast': {
        id: 'monthly-roast',
        label: 'סיכום חודשי (ROAST)',
        description: 'ה-AI מנתח את ההוצאות שלך בוויס צהוב',
        icon: MessageSquare,
        color: 'text-orange-400'
    },
    'smart-insights': {
        id: 'smart-insights',
        label: 'תובנות חכמות',
        description: 'טיפים והזדמנויות לחיסכון מה-AI',
        icon: Lightbulb,
        color: 'text-blue-400'
    }
};
