import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { isAdminAuthSuccess, requireAdmin } from "@/lib/admin-auth";

/**
 * Admin-only merchant financial operations.
 * Wallet balances and withdrawals must never be written from the browser.
 */
type Body = {
  action?: string;
  applicationId?: string;
  withdrawalId?: string;
  merchantId?: string;
  name?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  code?: string;
  tempPassNote?: string;
  amount?: number;
};

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!isAdminAuthSuccess(auth)) return auth;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad("بيانات غير صالحة");
  }

  const action = String(body.action || "");
  const admin = getSupabaseServiceClient();

  try {
    if (action === "approve_application") {
      const applicationId = String(body.applicationId || "");
      const email = String(body.email || "").toLowerCase().trim();
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();
      const passwordHash = String(body.passwordHash || "");
      if (!applicationId || !email || !name || !passwordHash) {
        return bad("حقول الموافقة ناقصة");
      }

      const { data: existing } = await admin
        .from("merchants")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        await admin
          .from("merchant_applications")
          .update({ status: "approved", reviewed_at: new Date().toISOString() })
          .eq("id", applicationId);
        return NextResponse.json({ ok: true, existing: true });
      }

      const { data: merchant, error } = await admin
        .from("merchants")
        .insert({
          name,
          email,
          phone: phone || null,
          password_hash: passwordHash,
          is_active: true,
        })
        .select("id")
        .single();

      if (error || !merchant) {
        return bad(error?.message || "فشل إنشاء التاجر", 500);
      }

      const code =
        String(body.code || "").trim() ||
        String(merchant.id).replace(/-/g, "").slice(0, 8).toUpperCase();

      await admin.from("merchants").update({ code }).eq("id", merchant.id);
      await admin.from("merchant_wallets").insert({
        merchant_id: merchant.id,
        balance: 0,
        pending: 0,
      });

      const note = String(body.tempPassNote || "").trim();
      if (note) {
        await admin.from("merchant_messages").insert({
          merchant_id: merchant.id,
          body: note,
        });
      }

      await admin
        .from("merchant_applications")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", applicationId);

      return NextResponse.json({ ok: true, merchantId: merchant.id, code });
    }

    if (action === "reject_application") {
      const applicationId = String(body.applicationId || "");
      if (!applicationId) return bad("applicationId مطلوب");
      const { error } = await admin
        .from("merchant_applications")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", applicationId);
      if (error) return bad(error.message, 500);
      return NextResponse.json({ ok: true });
    }

    if (action === "complete_withdrawal") {
      const withdrawalId = String(body.withdrawalId || "");
      if (!withdrawalId) return bad("withdrawalId مطلوب");

      const { data: row, error: fetchErr } = await admin
        .from("merchant_withdrawals")
        .select("id, amount, phone, status, merchant_id")
        .eq("id", withdrawalId)
        .maybeSingle();
      if (fetchErr || !row) return bad("طلب السحب غير موجود", 404);
      if (row.status !== "pending" && row.status !== "processing") {
        return bad("حالة السحب غير قابلة للإتمام");
      }

      await admin
        .from("merchant_withdrawals")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", withdrawalId);

      await admin.from("merchant_messages").insert({
        merchant_id: row.merchant_id,
        body: `تم تحويل مبلغ ${row.amount} ج.م بنجاح على الرقم ${row.phone}. شكرًا لك.`,
      });

      await admin.from("wallet_transactions").insert({
        merchant_id: row.merchant_id,
        type: "withdraw_done",
        amount: 0,
        note: `تم إتمام سحب ${row.amount} ج.م`,
      });

      return NextResponse.json({ ok: true });
    }

    if (action === "reject_withdrawal") {
      const withdrawalId = String(body.withdrawalId || "");
      if (!withdrawalId) return bad("withdrawalId مطلوب");

      const { data: row, error: fetchErr } = await admin
        .from("merchant_withdrawals")
        .select("id, amount, status, merchant_id")
        .eq("id", withdrawalId)
        .maybeSingle();
      if (fetchErr || !row) return bad("طلب السحب غير موجود", 404);
      if (row.status === "completed" || row.status === "rejected") {
        return bad("لا يمكن رفض هذا الطلب");
      }

      const amount = Number(row.amount) || 0;
      const { data: w } = await admin
        .from("merchant_wallets")
        .select("balance")
        .eq("merchant_id", row.merchant_id)
        .maybeSingle();

      if (w) {
        await admin
          .from("merchant_wallets")
          .update({
            balance: Number(w.balance) + amount,
            updated_at: new Date().toISOString(),
          })
          .eq("merchant_id", row.merchant_id);
      }

      await admin
        .from("merchant_withdrawals")
        .update({ status: "rejected" })
        .eq("id", withdrawalId);

      await admin.from("merchant_messages").insert({
        merchant_id: row.merchant_id,
        body: `تم رفض طلب السحب بمبلغ ${amount} ج.م وإرجاع الرصيد لمحفظتك.`,
      });

      await admin.from("wallet_transactions").insert({
        merchant_id: row.merchant_id,
        type: "withdraw_reject",
        amount,
        note: "رفض سحب — إرجاع الرصيد",
      });

      return NextResponse.json({ ok: true });
    }

    return bad("عملية غير معروفة");
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
