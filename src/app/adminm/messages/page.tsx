"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Merchant = { id: string; name: string; email: string };

export default function AdminmMessagesPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantId, setMerchantId] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase
      .from("merchants")
      .select("id, name, email")
      .order("name")
      .then(({ data }) => setMerchants((data as Merchant[]) || []));
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId || !body.trim()) return;
    const { error } = await supabase.from("merchant_messages").insert({
      merchant_id: merchantId,
      body: body.trim(),
    });
    if (error) setMsg(error.message);
    else {
      setMsg("تم الإرسال");
      setBody("");
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">رسالة لتاجر</h1>
      <form onSubmit={send} className="bg-white border rounded-2xl p-4 space-y-3">
        <select
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value)}
          className="w-full border rounded-xl px-3 py-2.5 text-sm"
          required
        >
          <option value="">اختر التاجر</option>
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.email}
            </option>
          ))}
        </select>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          required
          placeholder="نص الرسالة"
          className="w-full border rounded-xl px-3 py-2.5 text-sm"
        />
        <button type="submit" className="bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-full">
          إرسال
        </button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </form>
    </div>
  );
}
