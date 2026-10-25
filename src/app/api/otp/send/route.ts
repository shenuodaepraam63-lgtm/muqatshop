import { NextRequest, NextResponse } from "next/server";

type Purpose =
  | "register"
  | "reset"
  | "delete"
  | "login"
  | "notice_delete"
  | "notice_password";

function buildEmail(opts: {
  purpose: Purpose;
  name: string;
  code?: string;
}): { subject: string; html: string } {
  const name = opts.name || "عميل";
  const codeBlock = opts.code
    ? `<p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0">${opts.code}</p>
       <p style="color:#666;font-size:13px">الرمز صالح لمدة 15 دقيقة.</p>`
    : "";

  switch (opts.purpose) {
    case "register":
      return {
        subject: "رمز التحقق — تأكيد حساب Muqatshop",
        html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.7;color:#1a1a1a">
          <p>مرحبًا ${name}،</p>
          <p>رمز التحقق لتأكيد بريدك في <strong>Muqatshop</strong>:</p>
          ${codeBlock}
          <p>إذا لم تطلب إنشاء حساب، تجاهل هذه الرسالة.</p>
        </div>`,
      };
    case "reset":
      return {
        subject: "رمز التحقق — استعادة كلمة المرور",
        html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.7;color:#1a1a1a">
          <p>مرحبًا ${name}،</p>
          <p>رمز التحقق لإعادة تعيين كلمة المرور:</p>
          ${codeBlock}
          <p>إذا لم تطلب استعادة كلمة المرور، تجاهل الرسالة ولا تشارك الرمز مع أحد.</p>
        </div>`,
      };
    case "delete":
      return {
        subject: "رمز التحقق — حذف حساب Muqatshop",
        html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.7;color:#1a1a1a">
          <p>مرحبًا ${name}،</p>
          <p>طلبت حذف حسابك. أدخل رمز التحقق التالي لإتمام الحذف:</p>
          ${codeBlock}
          <p style="color:#b45309">بعد التأكيد سيُحذف الحساب نهائيًا.</p>
        </div>`,
      };
    case "login":
      return {
        subject: "رمز التحقق — تسجيل الدخول",
        html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.7;color:#1a1a1a">
          <p>مرحبًا ${name}،</p>
          <p>رمز التحقق لتسجيل الدخول:</p>
          ${codeBlock}
        </div>`,
      };
    case "notice_delete":
      return {
        subject: "تم حذف حسابك — Muqatshop",
        html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.7;color:#1a1a1a">
          <p>مرحبًا ${name}،</p>
          <p>تم <strong>حذف حسابك</strong> في Muqatshop بنجاح بناءً على طلبك.</p>
          <p>إذا لم تقم بهذا الإجراء، تواصل فورًا مع الدعم عبر واتساب المتجر.</p>
        </div>`,
      };
    case "notice_password":
      return {
        subject: "تم تغيير كلمة المرور — Muqatshop",
        html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.7;color:#1a1a1a">
          <p>مرحبًا ${name}،</p>
          <p>تم <strong>تغيير كلمة مرور</strong> حسابك في Muqatshop.</p>
          <p>إذا لم تقم بهذا الإجراء، استعد الحساب فورًا من «نسيت كلمة المرور» وتواصل مع الدعم.</p>
        </div>`,
      };
    default:
      return {
        subject: "Muqatshop",
        html: `<div dir="rtl"><p>مرحبًا ${name}</p>${codeBlock}</div>`,
      };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const code = body.code != null ? String(body.code).trim() : "";
    const name = String(body.name || "عميل").trim();
    const purpose = (body.purpose || "register") as Purpose;

    if (!email) {
      return NextResponse.json({ ok: false, error: "البريد مطلوب" }, { status: 400 });
    }

    const needsCode = ["register", "reset", "delete", "login"].includes(purpose);
    if (needsCode && !code) {
      return NextResponse.json({ ok: false, error: "رمز التحقق مطلوب" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "إرسال البريد غير مفعّل. أضف RESEND_API_KEY في Vercel",
        },
        { status: 503 }
      );
    }

    const from = process.env.RESEND_FROM || "Muqatshop <onboarding@resend.dev>";
    const { subject, html } = buildEmail({ purpose, name, code: code || undefined });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [email], subject, html }),
    });

    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json(
        { ok: false, error: "فشل إرسال البريد", detail: t },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
