import { NextRequest, NextResponse } from "next/server";

type Purpose =
  | "register"
  | "reset"
  | "delete"
  | "login"
  | "notice_delete"
  | "notice_password";

const recent = new Map<string, number>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = `${key}:${Math.floor(now / WINDOW_MS)}`;
  const n = (recent.get(bucket) || 0) + 1;
  recent.set(bucket, n);
  if (recent.size > 2000) {
    for (const k of recent.keys()) {
      if (!k.endsWith(String(Math.floor(now / WINDOW_MS)))) recent.delete(k);
    }
  }
  return n <= MAX_PER_WINDOW;
}

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
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    let body: {
      email?: string;
      code?: string;
      name?: string;
      purpose?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const code = body.code != null ? String(body.code).trim() : "";
    const name = String(body.name || "عميل").trim().slice(0, 120);
    const purpose = (body.purpose || "register") as Purpose;

    if (!email || !email.includes("@") || email.length > 200) {
      return NextResponse.json({ ok: false, error: "البريد مطلوب" }, { status: 400 });
    }

    if (!rateLimit(`ip:${ip}`) || !rateLimit(`email:${email}`)) {
      return NextResponse.json(
        { ok: false, error: "محاولات كثيرة — حاول لاحقًا" },
        { status: 429 }
      );
    }

    const allowed: Purpose[] = [
      "register",
      "reset",
      "delete",
      "login",
      "notice_delete",
      "notice_password",
    ];
    if (!allowed.includes(purpose)) {
      return NextResponse.json({ ok: false, error: "غرض غير مدعوم" }, { status: 400 });
    }

    const needsCode = ["register", "reset", "delete", "login"].includes(purpose);
    if (needsCode && (!code || code.length > 12)) {
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
    const { subject, html } = buildEmail({
      purpose,
      name,
      code: code || undefined,
    });

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
        { ok: false, error: "فشل إرسال البريد", detail: t.slice(0, 200) },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
