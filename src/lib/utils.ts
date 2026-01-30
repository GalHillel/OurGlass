import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getHebrewError(error: any): string {
  if (!error) return "שגיאה לא ידועה";
  const msg = error.message?.toLowerCase() || "";

  if (msg.includes("unique constraint") || error.code === '23505') return "הפריט כבר קיים במערכת";
  if (msg.includes("violates check constraint")) return "נתונים לא תקינים";
  if (msg.includes("null value")) return "חסרים נתונים בגוף הבקשה";
  if (msg.includes("foreign key")) return "לא ניתן למחוק פריט זה מכיוון שהוא מקושר לנתונים אחרים";
  if (msg.includes("network") || msg.includes("fetch")) return "בעיית תקשורת, נסו שוב מאוחר יותר";

  return "אירעה שגיאה בעיבוד הבקשה";
}
