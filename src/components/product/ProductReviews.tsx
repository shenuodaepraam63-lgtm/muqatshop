"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Star } from "lucide-react";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("product_reviews")
      .select("id, customer_name, rating, comment, created_at")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(30);
    setReviews((data as Review[]) || []);
  };

  useEffect(() => {
    load();
  }, [productId]);

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSending(true);
    setMsg("");
    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      customer_name: name.trim(),
      rating,
      comment: comment.trim() || null,
      is_approved: true,
    });
    setSending(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setName("");
    setComment("");
    setRating(5);
    setMsg("شكرًا لتقييمك!");
    load();
  };

  return (
    <section className="mt-10 border-t border-[#e8e2d9] pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">التقييمات</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{avg.toFixed(1)}</span>
            <span className="text-muted">({reviews.length})</span>
          </div>
        )}
      </div>

      <ul className="space-y-4 mb-8">
        {reviews.length === 0 && (
          <p className="text-sm text-muted">لا توجد تقييمات بعد — كن أول من يقيّم</p>
        )}
        {reviews.map((r) => (
          <li key={r.id} className="bg-[#f8f5f0] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{r.customer_name}</span>
              <span className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < r.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-[#d4cfc4]"
                    }`}
                  />
                ))}
              </span>
            </div>
            {r.comment && <p className="text-sm text-muted leading-relaxed">{r.comment}</p>}
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="bg-white border border-[#e8e2d9] rounded-2xl p-4 space-y-3">
        <p className="font-semibold text-sm">أضف تقييمك</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسمك"
          className="w-full border border-[#e8e2d9] rounded-xl px-3 py-2 text-sm"
          required
        />
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i + 1)}
              className="p-0.5"
            >
              <Star
                className={`w-6 h-6 ${
                  i < rating ? "fill-amber-400 text-amber-400" : "text-[#d4cfc4]"
                }`}
              />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="تعليقك (اختياري)"
          rows={3}
          className="w-full border border-[#e8e2d9] rounded-xl px-3 py-2 text-sm resize-y"
        />
        {msg && <p className="text-sm text-muted">{msg}</p>}
        <button
          type="submit"
          disabled={sending}
          className="bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
        >
          {sending ? "جاري الإرسال..." : "إرسال التقييم"}
        </button>
      </form>
    </section>
  );
}
