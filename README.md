# ⏳ OurGlass - דמו אינטראקטיבי (Static Demo)

> **שימו לב:** זוהי גרסת **הדגמה סטטית** (Static Demo) המיועדת להצגת יכולות ה-UI/UX.
> המערכת פועלת באופן עצמאי (Client-Side) עם נתונים לדוגמה, ללא חיבור למסד נתונים וללא צורך בהרשמה.

## 🌟 פיצ'רים מרכזיים
* **ממשק עברי מלא (RTL):** תמיכה טבעית ועיצוב מותאם לשפה העברית.
* **זמן קפוא:** הנתונים מדמים מצב של "אמצע החודש" (15 באוקטובר 2025) באופן קבוע.
* **תקציב לדוגמה:** מוגדר תקציב חודשי של 30,000 ₪ להמחשת ניהול פיננסי בריא.
* **נתונים עשירים:** מניות, מזומנים, הוצאות, ומנויים מוזנים מראש.
* **אנונימיות:** כל המידע האישי הוחלף בשמות גנריים ("אני", "בן/בת זוג").

## 🚀 הרצה מקומית

```bash
npm install
npm run dev
```

האפליקציה תהיה זמינה בכתובת: http://localhost:3000

## 🎯 טכנולוגיות

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **RTL Support** - Hebrew interface

## 📦 מבנה הפרויקט

```
src/
├── app/              # Next.js pages & routes
├── components/       # React components
├── lib/             # Utilities & demo data
│   └── demoData.ts  # Static demo data source
├── hooks/           # Custom React hooks
└── types/           # TypeScript definitions
```

## 💡 הערות פיתוח

- כל הנתונים נשמרים ב-`src/lib/demoData.ts`
- אין קריאות API או חיבורים לשרתים חיצוניים
- התאריך קפוא ל-15 באוקטובר 2025 לצורך דמו עקבי
- כל הטקסטים בעברית למעט שמות מניות בינלאומיות

## 🌐 פריסה (Deployment)

הפרויקט מוכן לפריסה ב-Vercel:

```bash
npm run build
vercel deploy
```

---

**נבנה בגאווה עם ❤️ ו-TypeScript**
