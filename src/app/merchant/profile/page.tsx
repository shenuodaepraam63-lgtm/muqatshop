"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getMerchantSession,
  saveMerchantSession,
  hashPassword,
} from "@/lib/merchant";

export default function MerchantProfilePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getMerchantSession();
    if (!s) return;
    setName(s.name);
    setPhone(s.phone || "");
    setEmail(s.email);
  }, []);

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

  const field = "w-full border rounded-xl px-3 py-2.5 text-sm";

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-bold">حسابي</h1>
      <form onSubmit={save} className="bg-white border rounded-2xl p-4 space-y-3">
        <div>
          <label className="text-xs text-muted block mb-1">البريد</label>
          <input className={field} value={email} disabled />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">الاسم</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">الموبايل</label>
          <input className={field} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">كلمة مرور جديدة (اختياري)</label>
          <input
            className={field}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="اتركها فارغة للإبقاء على الحالية"
          />
        </div>
        {err && <p className="text-sm text-sale">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "حفظ"}
        </button>
      </form>
    </div>
  );
}
