# Muqat Shop

متجر مقاطف ومنتجات أنيق مبني بـ Next.js 15 + Tailwind + Supabase + Vercel.

## التقنيات

- **Next.js 15** (App Router)
- **Tailwind CSS**
- **Supabase** (Database + Auth + Storage)
- **Zustand** (السلة)
- **Vercel** (Hosting)

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local
# أضف مفاتيح Supabase في .env.local
npm run dev
```

## البنية

```
src/
├── app/              # الصفحات
├── components/
│   ├── layout/       # Header, Footer, Announcement, BottomNav
│   ├── home/         # Hero, ProductCard...
│   └── product/
├── lib/              # supabase, store, utils
└── types/
```

## الخطوات القادمة

1. ربط Supabase وإنشاء الجداول
2. صفحة المنتج + السلة + Checkout
3. لوحة تحكم بسيطة
4. رفع الصور على Supabase Storage
