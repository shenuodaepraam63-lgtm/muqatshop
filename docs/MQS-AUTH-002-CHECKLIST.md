# MQS-AUTH-002 — حالة التنفيذ

## قاعدة البيانات
- [x] profiles / affiliate_profiles / supplier_profiles / account_activity
- [x] RLS + حماية تصعيد الدور
- [x] Trigger إنشاء profile
- [x] مزامنة تدريجية مع customers/merchants
- [x] v_account_identity

## الواجهة
- [x] /login
- [x] /register + اختيار النوع
- [x] /register/customer | affiliate | supplier
- [x] /verify-email
- [x] /forgot-password
- [x] /reset-password (+ /auth/reset-password القديم)
- [x] /account/pending | /affiliate/pending | /supplier/pending
- [x] /account/profile
- [x] تسجيل خروج موحّد (signOutEverywhere)

## يدوي من لوحة Supabase
- [ ] تطبيق قوالب البريد من docs/MQS-AUTH-002-EMAIL-TEMPLATES.md
- [ ] التأكد من Redirect URLs

## تدريجي لاحقًا
- [ ] استبدال جميع روابط /welcome بروابط /login في الهيدر
- [ ] لوحة اعتماد المسوقين/التجار من الإدارة على الجداول الجديدة
- [ ] تضييق RLS على customers/merchants بعد استقرار الواجهة
