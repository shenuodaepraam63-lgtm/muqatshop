"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  supabase,
  type ProductColor,
  type ProductVariant,
  type ProductType,
  type DetailSection,
} from "@/lib/supabase";
import { presetsForType } from "@/lib/sizes";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { DetailSectionsEditor } from "@/components/admin/DetailSectionsEditor";
import { serializeDetailSections } from "@/lib/detail-sections";
import { X, Upload, Star, Loader2, Plus } from "lucide-react";
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
    sizes?: string[];
    variants?: ProductVariant[];
    product_type?: string | null;
    features?: string | null;
    specs?: string | null;
    weight?: string | null;
    weight_value?: number | null;
    dimensions?: string | null;
    origin_country?: string | null;
    care_instructions?: string | null;
    sale_ends_at?: string | null;
    detail_sections?: DetailSection[] | null;
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

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function variantKey(size?: string | null, color?: string | null) {
  return `${size || ""}||${color || ""}`;
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
  const [saleEndsAt, setSaleEndsAt] = useState(toLocalInput(initial?.sale_ends_at));
  const [categoryId, setCategoryId] = useState(initial?.category_id || "");
  const [productType, setProductType] = useState<ProductType>(
    (initial?.product_type as ProductType) || "general"
  );
  const [brand, setBrand] = useState(initial?.brand || "");
  const [material, setMaterial] = useState(initial?.material || "");
  const [colors, setColors] = useState<ProductColor[]>(initial?.colors || []);
  const [sizes, setSizes] = useState<string[]>(initial?.sizes || []);
  const [customSize, setCustomSize] = useState("");
  const [variantMap, setVariantMap] = useState<Record<string, { stock: string; price: string }>>(() => {
    const m: Record<string, { stock: string; price: string }> = {};
    (initial?.variants || []).forEach((v) => {
      m[variantKey(v.size, v.color)] = {
        stock: String(v.stock ?? 0),
        price: v.price != null ? String(v.price) : "",
      };
    });
    return m;
  });
  const [features, setFeatures] = useState(initial?.features || "");
  const [specs, setSpecs] = useState(initial?.specs || "");
  const [stock, setStock] = useState(initial?.stock?.toString() || "0");
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured || false);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [mainIndex, setMainIndex] = useState(initial?.main_image_index || 0);
  const [weight, setWeight] = useState(initial?.weight || "");
  const [weightValue, setWeightValue] = useState(
    initial?.weight_value != null ? String(initial.weight_value) : ""
  );
  const [dimensions, setDimensions] = useState(initial?.dimensions || "");
  const [origin, setOrigin] = useState(initial?.origin_country || "");
  const [care, setCare] = useState(initial?.care_instructions || "");
  const [detailSections, setDetailSections] = useState<DetailSection[]>(
    () => (initial?.detail_sections || []).filter((s) => s && typeof s.title === "string")
  );
  const [showExtras, setShowExtras] = useState(
    !!(initial?.weight || initial?.dimensions || initial?.origin_country || initial?.care_instructions || initial?.weight_value)
  );
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#8B4513");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    if (!cropFile && cropQueue.length > 0) {
      setCropFile(cropQueue[0]);
      setCropQueue((q) => q.slice(1));
    }
  }, [cropFile, cropQueue]);

  const sizeList = sizes.length ? sizes : [];
  const colorList = colors.length ? colors.map((c) => c.name) : [];

  const matrixRows = useMemo(() => {
    const rows: { size: string | null; color: string | null; hex?: string }[] = [];
    if (sizeList.length && colorList.length) {
      sizeList.forEach((s) => colors.forEach((c) => rows.push({ size: s, color: c.name, hex: c.hex })));
    } else if (sizeList.length) {
      sizeList.forEach((s) => rows.push({ size: s, color: null }));
    } else if (colorList.length) {
      colors.forEach((c) => rows.push({ size: null, color: c.name, hex: c.hex }));
    }
    return rows;
  }, [sizeList, colorList, colors]);

  const useVariants = matrixRows.length > 0;

  const handleNameChange = (v: string) => {
    setName(v);
    if (!initial?.id) setSlug(slugify(v));
  };

  const toggleSize = (s: string) => {
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const addCustomSize = () => {
    const s = customSize.trim();
    if (!s) return;
    if (!sizes.includes(s)) setSizes((prev) => [...prev, s]);
    setCustomSize("");
  };

  const setVarField = (size: string | null, color: string | null, field: "stock" | "price", val: string) => {
    const k = variantKey(size, color);
    setVariantMap((prev) => ({
      ...prev,
      [k]: {
        stock: field === "stock" ? val : prev[k]?.stock ?? "0",
        price: field === "price" ? val : prev[k]?.price ?? "",
      },
    }));
  };

  const buildVariants = (): ProductVariant[] => {
    if (!useVariants) return [];
    return matrixRows.map((r) => {
      const k = variantKey(r.size, r.color);
      const cell = variantMap[k];
      const p = cell?.price?.trim();
      return {
        size: r.size,
        color: r.color,
        color_hex: r.hex || null,
        stock: Number(cell?.stock) || 0,
        price: p ? Number(p) : null,
      };
    });
  };

  const queueFilesForCrop = (files: FileList | null) => {
    if (!files?.length) return;
    const list: File[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 12 * 1024 * 1024) {
        setError("حجم الصورة أكبر من 12 ميجا");
        continue;
      }
      list.push(file);
    }
    if (!list.length) return;
    setError("");
    if (cropFile) setCropQueue((q) => [...q, ...list]);
    else {
      setCropFile(list[0]);
      if (list.length > 1) setCropQueue(list.slice(1));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadCropped = async (file: File) => {
    setCropFile(null);
    setUploading(true);
    setError("");
    try {
      const url = await uploadToCloudinary(file);
      setImages((prev) => [...prev, url]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
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

  const resolveSaleEnds = (): string | null => {
    if (!compareAt || !saleEndsAt) return null;
    const end = new Date(saleEndsAt);
    if (Number.isNaN(end.getTime()) || end.getTime() <= Date.now()) return null;
    return end.toISOString();
  };

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
    const variants = buildVariants();
    const totalStock = useVariants
      ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
      : Number(stock) || 0;

    const payload = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      description: description.trim() || null,
      price: Number(price),
      compare_at_price: compareAt ? Number(compareAt) : null,
      sale_ends_at: resolveSaleEnds(),
      category_id: categoryId || null,
      product_type: productType,
      brand: brand.trim() || null,
      material: material.trim() || null,
      colors,
      sizes,
      variants,
      features: features.trim() || null,
      specs: specs.trim() || null,
      weight: weight.trim() || null,
      weight_value: weightValue ? Number(weightValue) : null,
      dimensions: dimensions.trim() || null,
      origin_country: origin.trim() || null,
      care_instructions: care.trim() || null,
      detail_sections: serializeDetailSections(detailSections),
      images,
      main_image_index: Math.min(mainIndex, Math.max(0, images.length - 1)),
      stock: totalStock,
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

  const field =
    "w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15";
  const presets = presetsForType(productType);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {cropFile && (
        <ImageCropModal file={cropFile} onCancel={() => setCropFile(null)} onDone={uploadCropped} />
      )}
      {error && <div className="text-sm text-sale bg-sale/10 rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">{success}</div>}

      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-ink flex items-center gap-2">
          <Upload className="w-4 h-4" /> الصور
        </h2>
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            queueFilesForCrop(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-ink/40 transition"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted" />
          ) : (
            <div className="text-muted text-sm">اضغط أو اسحب الصور</div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => queueFilesForCrop(e.target.files)} />
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {images.map((url, idx) => (
              <div key={url + idx} className="relative aspect-square rounded-xl overflow-hidden bg-card">
                <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setMainIndex(idx)} className={`absolute bottom-1 right-1 rounded-full p-1 ${mainIndex === idx ? "bg-amber-400 text-white" : "bg-black/50 text-white"}`}>
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
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} className={field} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">نوع المنتج</label>
            <select value={productType} onChange={(e) => setProductType(e.target.value as ProductType)} className={`${field} bg-white`}>
              <option value="general">عام</option>
              <option value="mug">مج / كباية</option>
              <option value="clothing">ملابس</option>
            </select>
          </div>
          <CategorySelect value={categoryId} onChange={setCategoryId} className={`${field} bg-white`} />
          <div>
            <label className="block text-sm font-medium mb-1.5">السعر الأساسي (ج.م) *</label>
            <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={field} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">السعر قبل الخصم</label>
            <input type="number" min="0" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">مدة الخصم</label>
            <input type="datetime-local" value={saleEndsAt} onChange={(e) => setSaleEndsAt(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">العلامة التجارية</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">الخامة</label>
            <input value={material} onChange={(e) => setMaterial(e.target.value)} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">الوصف</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${field} min-h-[80px]`} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">المميزات</label>
            <textarea value={features} onChange={(e) => setFeatures(e.target.value)} className={`${field} min-h-[60px]`} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">المواصفات</label>
            <textarea value={specs} onChange={(e) => setSpecs(e.target.value)} className={`${field} min-h-[60px]`} />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border p-5">
        <DetailSectionsEditor value={detailSections} onChange={setDetailSections} />
      </section>

      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold">الألوان</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button key={c.hex} type="button" onClick={() => addPreset(c)} className="text-xs border rounded-full px-3 py-1 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border" style={{ background: c.hex }} />
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="اسم اللون" className={`${field} max-w-[140px]`} />
          <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="w-10 h-10 rounded" />
          <button type="button" onClick={addColor} className="text-sm bg-ink text-white px-3 py-2 rounded-xl">إضافة</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {colors.map((c, i) => (
            <span key={c.name + i} className="text-xs border rounded-full px-2 py-1 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full border" style={{ background: c.hex }} />
              {c.name}
              <button type="button" onClick={() => setColors((prev) => prev.filter((_, j) => j !== i))} className="text-muted hover:text-sale">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold">المقاسات والمخزون</h2>
        {presets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {presets.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={`text-xs border rounded-full px-3 py-1 ${sizes.includes(s) ? "bg-ink text-white border-ink" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-center flex-wrap">
          <input value={customSize} onChange={(e) => setCustomSize(e.target.value)} placeholder="مقاس مخصص" className={`${field} max-w-[140px]`} />
          <button type="button" onClick={addCustomSize} className="text-sm border px-3 py-2 rounded-xl">إضافة مقاس</button>
        </div>
        {useVariants ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-muted border-b">
                  <th className="py-2 font-medium">المقاس</th>
                  <th className="py-2 font-medium">اللون</th>
                  <th className=