"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  supabase,
  type Product,
  type Category,
  slugify,
} from "@/lib/supabase";

type Props = {
  product?: Product;
};

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [compareAt, setCompareAt] = useState(
    product?.compare_at_price?.toString() || ""
  );
  const [stock, setStock] = useState(product?.stock?.toString() || "0");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [mainIndex, setMainIndex] = useState(product?.main_image_index || 0);
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data as Category[]);
      });
  }, []);

  function addImageUrl() {
    const url = imageUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      setError("رابط الصورة غير صالح");
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrl("");
    setError("");
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setMainIndex((m) => {
      if (i === m) return 0;
      if (i < m) return Math.max(0, m - 1);
      return m;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("العنوان مطلوب");
      return;
    }
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum < 0) {
      setError("السعر غير صالح");
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: product?.slug || slugify(name) + "-" + Date.now().toString(36),
      description: description.trim() || null,
      price: priceNum,
      compare_at_price: compareAt ? Number(compareAt) : null,
      stock: Number(stock) || 0,
      category_id: categoryId || null,
      images,
      main_image_index: images.length ? Math.min(mainIndex, images.length - 1) : 0,
      is_featured: isFeatured,
      is_active: isActive,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("products").update(payload).eq("id", product!.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-page border border-border rounded-media p-6 space-y-6"
    >
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">العنوان *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-ink/15"
          placeholder="مثال: مقطف جلد كلاسيك"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">الوصف</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full border border-border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-ink/15 resize-y"
          placeholder="وصف المنتج..."
        />
      </div>

      {/* Price row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">السعر (EGP) *</label>
          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-ink/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            السعر قبل الخصم
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={compareAt}
            onChange={(e) => setCompareAt(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-ink/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">المخزون</label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-ink/15"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-1">التصنيف</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-ink/15"
        >
          <option value="">— بدون —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium mb-2">
          الصور (روابط مؤقتة حتى Cloudinary)
        </label>
        <div className="flex gap-2 mb-3">
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... رابط الصورة"
            className="flex-1 border border-border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-ink/15"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImageUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={addImageUrl}
            className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-card"
          >
            إضافة
          </button>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <div
                key={url + i}
                className={`relative rounded-lg overflow-hidden border-2 aspect-square bg-card ${
                  mainIndex === i ? "border-ink" : "border-border"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1 flex gap-1 justify-center">
                  <button
                    type="button"
                    onClick={() => setMainIndex(i)}
                    className="text-[10px] text-white px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/40"
                  >
                    {mainIndex === i ? "رئيسية ✓" : "اجعلها رئيسية"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="text-[10px] text-white px-1.5 py-0.5 rounded bg-red-500/80"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted mt-2">
          الصق روابط الصور مؤقتاً (Imgur / Drive / أي رابط مباشر). لاحقاً هيتربط بـ
          Cloudinary.
        </p>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4"
          />
          نشط (يظهر في المتجر)
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4"
          />
          مميز
        </label>
      </div>

      {error && <p className="text-sale text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-ink text-page px-6 py-2.5 rounded-btn font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة المنتج"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="px-6 py-2.5 border border-border rounded-btn font-medium hover:bg-card"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
