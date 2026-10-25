import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    const name = String(body.name || "عميل").trim();

    if (!email || !code) {
      return NextResponse.json({ ok: false, error: "بيانات ناقصة" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || "Muqatshop <onboarding@resend.dev>";

    if (resendKey) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "رمز التحقق — Muqatshop",
          html: `<div dir="rtl" style="font-family:sans-serif">
            <p>مرحبًا ${name}،</p>
            <p>رمز التحقق الخاص بك:</p>
            <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
            <p>صالح لمدة 15 دقيقة.</p>
          </div>`,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        return NextResponse.json({ ok: false, error: "فشل إرسال البريد", detail: t }, { status: 502 });
      }
      return NextResponse.json({ ok: true, sent: true });
    }

    // بدون Resend: وضع اختبار — يظهر الرمز في الواجهة
    return NextResponse.json({
      ok: true,
      sent: false,
      debugCode: code,
      message: "أضف RESEND_API_KEY لإرسال البريد الحقيقي",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
