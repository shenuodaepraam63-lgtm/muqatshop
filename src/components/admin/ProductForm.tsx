"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, type ProductColor, type Category } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { X, Upload, Star, Loader2, Plus, Palette } from "lucide-react";
import Image from "next/image";

type ProductFormProps = {
  initial?: {
    id?: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    compare_at_price: number | null;
    images: string[];
    main_image_index: number;
    stock: number;
    is_featured: boolean;
    is_active: boolean;
    category_id: string | null;
    brand?: string | null;
    material?: string | null;
    colors?: ProductColor[];
    features?: string | null;
    specs?: string | null;
    weight?: string | null;
    dimensions?: string | null;
    origin_country?: string | null;
    care_instructions?: string | null;
  };
};

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const PRESET_COLORS: ProductColor[] = [
  { name: "أسود", hex: "#1a1a1a" },
  { name: "أبيض", hex: "#ffffff" },
  { name: "بني", hex: "#8B4513" },
  { name: "بيج", hex: "#D4C4A8" },
  { name: "كحلي", hex: "#1B3A5F" },
  { name: "رمادي", hex: "#6B7280" },
  { name: "أحمر", hex: "#DC2626" },
  { name: "أخضر", hex: "#166534" },
  { name: "ذهبي", hex: "#C9A227" },
  { name: "فضي", hex: "#A8A8A8" },
];

export function ProductForm({ initial }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [compareAt, setCompareAt] = useState(initial?.compare_at_price?.toString() || "");
  const [categoryId, setCategoryId] = useState(initial?.category_id || "");
  const [brand, setBrand] = useState(initial?.brand || "");
  const [material, setMaterial] = useState(initial?.material || "");
  const [colors, setColors] = useState<ProductColor[]>(initial?.colors || []);
  const [features, setFeatures] = useState(initial?.features || "");
  const [specs, setSpecs] = useState(initial?.specs || "");
  const [stock, setStock] = useState(initial?.stock?.toString() || "0");
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured || false);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [mainIndex, setMainIndex] = useState(initial?.main_image_index || 0);
  const [weight, setWeight] = useState(initial?.weight || "");
  const [dimensions, setDimensions] = useState(initial?.dimensions || "");
  const [origin, setOrigin] = useState(initial?.origin_country || "");
  const [care, setCare] = useState(initial?.care_instructions || "");
  const [showExtras, setShowExtras] = useState(!!(initial?.weight || initial?.dimensions || initial?.origin_country || initial?.care_instructions));
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#8B4513");
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    supabase.from("categories").select("id, name, slug").order("sort_order").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!initial?.id) setSlug(slugify(v));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 8 * 1024 * 1024) {
          setError("حجم الصورة أكبر من 8 ميجا");
          continue;
        }
        urls.push(await uploadToCloudinary(file));
      }
      if (urls.length) setImages((prev) => [...prev, ...urls]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (mainIndex === idx) setMainIndex(0);
    else if (mainIndex > idx) setMainIndex((m) => m - 1);
  };

  const addColor = () => {
    const n = colorName.trim();
    if (!n) return;
    if (colors.some((c) => c.name === n || c.hex.toLowerCase() === colorHex.toLowerCase())) {
      setError("اللون موجود مسبقاً");
      return;
    }
    setColors((prev) => [...prev, { name: n, hex: colorHex }]);
    setColorName("");
    setError("");
  };

  const addPreset = (c: ProductColor) => {
    if (colors.some((x) => x.hex.toLowerCase() === c.hex.toLowerCase() || x.name === c.name)) return;
    setColors((prev) => [...prev, c]);
  };

  const removeColor = (idx: number) => setColors((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    if (!name.trim() || !price || images.length === 0) {
      setError("الاسم والسعر وصورة واحدة على الأقل مطلوبة");
      setSaving(false);
      return;
    }
    const payload = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      description: description.trim() || null,
      price: Number(price),
      compare_at_price: compareAt ? Number(compareAt) : null,
      category_id: categoryId || null,
      brand: brand.trim() || null,
      material: material.trim() || null,
      colors,
      features: features.trim() || null,
      specs: specs.trim() || null,
      weight: weight.trim() || null,
      dimensions: dimensions.trim() || null,
      origin_country: origin.trim() || null,
      care_instructions: care.trim() || null,
      images,
      main_image_index: Math.min(mainIndex, Math.max(0, images.length - 1)),
      stock: Number(stock) || 0,
      is_featured: isFeatured,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };
    try {
      if (initial?.id) {
        const { error: err } = await supabase.from("products").update(payload).eq("id", initial.id);
        if (err) throw err;
        setSuccess("تم تحديث المنتج بنجاح");
      } else {
        const { error: err } = await supabase.from("products").insert(payload);
        if (err) throw err;
        setSuccess("تم إضافة المنتج بنجاح");
        setTimeout(() => router.push("/admin"), 800);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="text-sm text-sale bg-sale/10 rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">{success}</div>}

      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-ink flex items-center gap-2">
          <Upload className="w-4 h-4" /> الصور
          <span className="text-xs font-normal text-muted">(رفع مباشر — بدون روابط)</span>
        </h2>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-ink/40 transition bg-[#FFFCEE]/50"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">جاري الرفع إلى Cloudinary...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted">
              <Upload className="w-8 h-8" />
              <span className="text-sm">اضغط أو اسحب الصور هنا</span>
              <span className="text-xs">PNG, JPG حتى 8 ميجا</span>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((url, idx) => (
              <div key={url + idx} className="relative aspect-square rounded-xl overflow-hidden bg-card group">
                <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                  <X className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setMainIndex(idx)} title="الصورة الرئيسية" className={`absolute bottom-1 right-1 rounded-full p-1 transition ${mainIndex === idx ? "bg-amber-400 text-white" : "bg-black/50 text-white opacity-0 group-hover:opacity-100"}`}>
                  <Star className="w-3.5 h-3.5" fill={mainIndex === idx ? "currentColor" : "none"} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-ink">المعلومات الأساسية</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">العنوان *</label>
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" required placeholder="مثال: مقطف جلد طبيعي كلاسيك" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">الرابط (Slug)</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">التصنيف</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15 bg-white">
              <option value="">بدون تصنيف</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">أضف تصنيفات من <a href="/admin/categories" className="underline">إدارة التصنيفات</a></p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">السعر (ج.م) *</label>
            <input type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">السعر قبل الخصم</label>
            <input type="number" min="0" step="1" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" placeholder="اختياري" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">العلامة التجارية</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" placeholder="مثال: Muqat" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">الخامة</label>
            <input value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" placeholder="مثال: جلد طبيعي" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">الوصف</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15 resize-y" placeholder="وصف المنتج..." />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-ink flex items-center gap-2"><Palette className="w-4 h-4" /> الألوان</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button key={c.hex} type="button" onClick={() => addPreset(c)} title={c.name} className="w-8 h-8 rounded-full border-2 border-white shadow ring-1 ring-black/10 hover:scale-110 transition" style={{ backgroundColor: c.hex }} />
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">اللون</label>
            <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer border border-border p-0.5" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-muted mb-1">اسم اللون</label>
            <input value={colorName} onChange={(e) => setColorName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())} className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" placeholder="مثال: بني داكن" />
          </div>
          <button type="button" onClick={addColor} className="flex items-center gap-1.5 bg-ink text-white text-sm px-4 py-2 rounded-xl hover:opacity-90">
            <Plus className="w-4 h-4" /> إضافة
          </button>
        </div>
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {colors.map((c, i) => (
              <span key={c.hex + c.name} className="inline-flex items-center gap-2 bg-[#f5f3eb] rounded-full pl-1 pr-3 py-1 text-sm">
                <span className="w-6 h-6 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                {c.name}
                <button type="button" onClick={() => removeColor(i)} className="text-muted hover:text-sale"><X className="w-3.5 h-3.5" /></button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-ink">المميزات والمواصفات</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5">المميزات</label>
          <textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={3} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15 resize-y" placeholder="سطر لكل ميزة" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">المواصفات</label>
          <textarea value={specs} onChange={(e) => setSpecs(e.target.value)} rows={3} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15 resize-y" placeholder="مواصفات تقنية..." />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-ink">المخزون والحالة</h2>
        <p className="text-xs text-muted -mt-2">الكمية تظهر للعميل فقط عند نفاد المخزون (0).</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">الكمية في المخزون</label>
            <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded accent-ink" />
              نشط
            </label>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded accent-ink" />
              مميز
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <button type="button" onClick={() => setShowExtras(!showExtras)} className="font-semibold text-ink flex items-center gap-2 w-full text-right">
          حقول إضافية اختيارية
          <span className="text-xs font-normal text-muted">(وزن، أبعاد، بلد المنشأ، عناية)</span>
          <span className="mr-auto text-muted text-sm">{showExtras ? "▲" : "▼"}</span>
        </button>
        {showExtras && (
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">الوزن</label>
              <input value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" placeholder="450 جرام" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الأبعاد</label>
              <input value={dimensions} onChange={(e) => setDimensions(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" placeholder="30 × 25 × 12 سم" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">بلد المنشأ</label>
              <input value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" placeholder="مصر" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">تعليمات العناية</label>
              <input value={care} onChange={(e) => setCare(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15" placeholder="قطعة قماش ناعمة" />
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3 sticky bottom-4 bg-[#f5f3eb]/90 backdrop-blur py-3 rounded-xl">
        <button type="submit" disabled={saving || uploading} className="flex items-center gap-2 bg-ink text-white px-8 py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial?.id ? "حفظ التعديلات" : "إضافة المنتج"}
        </button>
        <button type="button" onClick={() => router.push("/admin")} className="px-6 py-3 rounded-xl text-sm border border-border bg-white hover:bg-white/80">إلغاء</button>
      </div>
    </form>
  );
}
