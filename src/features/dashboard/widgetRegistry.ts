import React from "react";

// Here we define a mapping from ID to the actual component it renders.
// For now, it will be a simple string enum or type since the components are inside HomeMosaic itself.
// The widgets will be rendered dynamically by mapping over the store.

export type WidgetId =
    | 'reactor'
    | 'ai-hub'
    | 'health'
    | 'savings'
    | 'investments'
    | 'vault'
    | 'settlements'
    | 'quick-action'
    | 'partner-stats'
    | 'calendar'
    | 'categories';

export interface WidgetDefinition {
    id: WidgetId;
    title: string;
    description: string;
}

export const WIDGET_REGISTRY: Record<WidgetId, WidgetDefinition> = {
    'reactor': { id: 'reactor', title: 'כור ההיתוך', description: 'תמונת המצב הנוכחית' },
    'ai-hub': { id: 'ai-hub', title: 'AI Hub', description: 'סיכום חכם ותובנות' },
    'health': { id: 'health', title: 'בריאות פיננסית', description: 'ציון וסיווג אוטומטי' },
    'savings': { id: 'savings', title: 'מעקב חיסכון', description: 'חיסכון חודשי במבט מהיר' },
    'investments': { id: 'investments', title: 'תיק השקעות', description: 'מעקב אחר נכסים פיננסיים' },
    'vault': { id: 'vault', title: 'מזומן וכספות', description: 'נזילות מיידית' },
    'settlements': { id: 'settlements', title: 'התחשבנויות', description: 'ניהול חובות בין בני זוג' },
    'quick-action': { id: 'quick-action', title: 'פעולה מהירה', description: 'הוספת הוצאות בקליק' },
    'partner-stats': { id: 'partner-stats', title: 'חלוקה', description: 'אני / את / אנחנו' },
    'calendar': { id: 'calendar', title: 'לוח הוצאות', description: 'פריסה חודשית של הוצאות' },
    'categories': { id: 'categories', title: 'קטגוריות', description: 'פילוח הוצאות מפורט' },
};
