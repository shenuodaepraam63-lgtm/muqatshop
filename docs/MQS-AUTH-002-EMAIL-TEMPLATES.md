# MQS-AUTH-002 — قوالب البريد (Supabase Dashboard)

طبّق هذه النصوص في **Authentication → Email Templates** دون تغيير SMTP إلا عند الحاجة.

## Confirm signup

**Subject:** أكد بريدك الإلكتروني | Muqatshop

مرحبًا بك في Muqatshop.

شكرًا لإنشاء حسابك معنا.

يرجى الضغط على الرابط التالي لتأكيد بريدك الإلكتروني وإكمال التسجيل.

{{ .ConfirmationURL }}

## Reset password

**Subject:** إعادة تعيين كلمة المرور | Muqatshop

تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك.

إذا كنت أنت من طلب ذلك، استخدم الرابط التالي لإنشاء كلمة مرور جديدة.

{{ .ConfirmationURL }}

إذا لم تطلب هذا الإجراء، يمكنك تجاهل الرسالة.

## Redirect URLs

أضف في Auth URL Configuration:

- `https://muqatshop.vercel.app/auth/callback`
- `https://muqatshop.vercel.app/reset-password`
- `https://muqatshop.vercel.app/auth/reset-password`
- `http://localhost:3000/auth/callback` (للتطوير)

Site URL: `https://muqatshop.vercel.app`
