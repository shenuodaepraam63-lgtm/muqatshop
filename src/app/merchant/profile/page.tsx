"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getMerchantSession,
  saveMerchantSession,
  clearMerchantSession,
  hashPassword,
} from "@/lib/merchant";
import { clearSiteRole } from "@/lib/role";

export default function MerchantProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [merchantId, setMerchantId] = useState("");

  const [deleteStep, setDeleteStep] = useState<"idle" | "code">("idle");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");

  useEffect(() => {
    const s = getMerchantSession();
    if (!s) {
      router.replace("/merchant/login");
      return;
    }
    setMerchantId(s.id);
    setName(s.name);
    setPhone(s.phone || "");
    setEmail(s.email);
  }, [router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    const s = getMerchantSession();
    if (!s) return;
    if (!name.trim()) {
      setErr("الاسم مطلوب");
      return;
    }
    setLoading(true);
    const patch: Record<string, string> = {
      name: name.trim(),
      phone: phone.trim() || "",
    };
    if (password.length > 0) {
      if (password.length < 6) {
        setErr("كلمة المرور 6 أحرف على الأقل");
        setLoading(false);
        return;
      }
      patch.password_hash = await hashPassword(password);
      await supabase.auth.updateUser({ password });
    }
    const { error } = await supabase.from("merchants").update(patch).eq("id", s.id);
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    saveMerchantSession({
      ...s,
      name: name.trim(),
      phone: phone.trim() || null,
    });
    setPassword("");
    setMsg("تم حفظ البيانات");
  };

  const requestDeleteCode = async () => {
    setDeleteErr("");
    setDeleteMsg("");
    if (!confirm("سيتم إرسال رمز من Supabase لتأكيد حذف حساب التاجر. متابعة؟")) return;
    setDeleteLoading(true);
    const em = email.trim().toLowerCase();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const { error: reErr } = await supabase.auth.reauthenticate();
      if (!reErr) {
        setDeleteLoading(false);
        setDeleteStep("code");
        setDeleteOtp("");
        setDeleteMsg("تم إرسال الرمز إلى بريدك.");
        return;
      }
    }

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: em,
      options: { shouldCreateUser: false },
    });
    setDeleteLoading(false);
    if (otpErr) {
      setDeleteErr(otpErr.message);
      return;
    }
    setDeleteStep("code");
    setDeleteOtp("");
    setDeleteMsg("تم إرسال الرمز إلى بريدك.");
  };

  const confirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteErr("");
    setDeleteLoading(true);
    const em = email.trim().toLowerCase();

    const { error: vErr } = await supabase.auth.verifyOtp({
      email: em,
      token: deleteOtp.trim(),
      type: "email",
    });
    if (vErr) {
      setDeleteLoading(false);
      setDeleteErr("رمز غير صحيح أو منتهي");
      return;
    }

    // تعطيل الحساب بدل مسح الطلبات التاريخية
    await supabase
      .from("merchants")
      .update({ is_active: false, email_verified: false })
      .eq("id", merchantId);

    await supabase.auth.signOut();
    clearMerchantSession();
    clearSiteRole();
    setDeleteLoading(false);
    router.replace("/welcome?tab=merchant");
  };

  const field = "w-full border rounded-xl px-3 py-2.5 text-sm";

  return (
    <div className="space-y-4 max-w-md pb-16">
      <h1 className="text-xl font-bold">حسابي</h1>
      <form onSubmit={save} className="bg-white border rounded-2xl p-4 space-y-3">
        <div>
          <label className="text-xs text-muted block mb-1">البريد</label>
          <input className={field} value={email} disabled dir="ltr" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">الاسم</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">التليفون</label>
          <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">كلمة مرور جديدة (اختياري)</label>
          <input
            type="password"
            className={field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="اتركه فارغًا إن لم تغيّر"
          />
        </div>
        {err && <p className="text-sm text-sale">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white py-3 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "حفظ"}
        </button>
      </form>

      <div id="delete-account" className="bg-red-50 border-2 border-sale rounded-2xl p-4 space-y-3">
        <h2 className="font-bold text-sale">حذف حساب التاجر</h2>
        <p className="text-xs text-muted">رمز رقمي من Supabase على بريدك قبل التعطيل النهائي.</p>
        {deleteStep === "idle" && (
          <button
            type="button"
            disabled={deleteLoading}
            onClick={requestDeleteCode}
            className="w-full bg-sale text-white py-3 rounded-full text-sm font-bold disabled:opacity-50"
          >
            {deleteLoading ? "..." : "حذف الحساب نهائيًا"}
          </button>
        )}
        {deleteStep === "code" && (
          <form onSubmit={confirmDelete} className="space-y-3">
            {deleteMsg && <p className="text-sm text-green-700">{deleteMsg}</p>}
            {deleteErr && <p className="text-sm text-sale">{deleteErr}</p>}
            <input
              inputMode="numeric"
              maxLength={8}
              required
              value={deleteOtp}
              onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="الرمز"
              className={`${field} text-center tracking-widest font-mono`}
              dir="ltr"
            />
            <button
              type="submit"
              disabled={deleteLoading || deleteOtp.length < 6}
              className="w-full bg-sale text-white py-3 rounded-full text-sm font-bold disabled:opacity-50"
            >
              تأكيد الحذف
            </button>
            <button type="button" className="w-full text-xs text-muted" onClick={() => setDeleteStep("idle")}>
              إلغاء
            </button>
          </form>
        )}
        {deleteStep === "idle" && deleteErr && <p className="text-sm text-sale">{deleteErr}</p>}
      </div>
    </div>
  );
}
