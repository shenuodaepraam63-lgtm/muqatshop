"use client";

import { useEffect, useState } from "react";
import { supabase, type Category } from "@/lib/supabase";
import { Plus, Trash2, Loader2, Pencil, Check, X } from "lucide-react";

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("name");
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const s = slug.trim() || slugify(name);
    const { error: err } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: s,
      sort_order: categories.length,
    });
    if (err) {
      setError(err.message.includes("unique") ? "الرابط مستخدم مسبقاً" : err.message);
    } else {
      setName("");
      setSlug("");
      await load();
    }
    setSaving(false);
  };

  const startEdit = (c: Category) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
  };

  const saveEdit = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    const { error: err } = await supabase
      .from("categories")
      .update({ name: editName.trim(), slug: editSlug.trim() || slugify(editName) })
      .eq("id", editId);
    if (err) setError(err.message);
    else {
      setEditId(null);
      await load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("حذف التصنيف؟ المنتجات المرتبطة لن تُحذف لكن ستفقد التصنيف.")) return;
    await supabase.from("categories").delete().eq("id", id);
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">إدارة التصنيفات</h1>

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-border p-5 mb-6 space-y-4">
        <h2 className="font-semibold">إضافة تصنيف جديد</h2>
        {error && <div className="text-sm text-sale bg-sale/10 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-muted mb-1">الاسم</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(slugify(e.target.value));
              }}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15"
              placeholder="مثال: أحذية"
              required
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-muted mb-1">الرابط</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15"
              dir="ltr"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 bg-ink text-white text-sm px-5 py-2 rounded-xl hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">جاري التحميل...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-muted">لا توجد تصنيفات بعد</div>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                {editId === c.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm"
                    />
                    <input
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="w-32 border border-border rounded-lg px-3 py-1.5 text-sm"
                      dir="ltr"
                    />
                    <button type="button" onClick={saveEdit} className="p-1.5 text-green-700 hover:bg-green-50 rounded-lg">
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setEditId(null)} className="p-1.5 text-muted hover:bg-gray-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink truncate">{c.name}</div>
                      <div className="text-xs text-muted" dir="ltr">
                        /{c.slug}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="p-2 text-muted hover:text-ink hover:bg-gray-50 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="p-2 text-muted hover:text-sale hover:bg-sale/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
