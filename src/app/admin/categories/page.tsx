"use client";

import { useEffect, useState } from "react";
import { supabase, type Category, type CategoryGroup } from "@/lib/supabase";
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
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [gName, setGName] = useState("");
  const [gSlug, setGSlug] = useState("");
  const [cName, setCName] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cGroupId, setCGroupId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editGroup, setEditGroup] = useState<string | null>(null);
  const [editGName, setEditGName] = useState("");
  const [editCat, setEditCat] = useState<string | null>(null);
  const [editCName, setEditCName] = useState("");
  const [editCGroup, setEditCGroup] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: g }, { data: c }] = await Promise.all([
      supabase.from("category_groups").select("*").order("sort_order").order("name"),
      supabase.from("categories").select("*").order("sort_order").order("name"),
    ]);
    setGroups((g as CategoryGroup[]) || []);
    setCategories((c as Category[]) || []);
    if (!cGroupId && g?.[0]?.id) setCGroupId(g[0].id);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("category_groups").insert({
      name: gName.trim(),
      slug: gSlug.trim() || slugify(gName),
      sort_order: groups.length,
    });
    if (err) setError(err.message.includes("unique") ? "رابط المجموعة مستخدم" : err.message);
    else {
      setGName("");
      setGSlug("");
      await load();
    }
    setSaving(false);
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cGroupId) {
      setError("اختر مجموعة واسم التصنيف");
      return;
    }
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("categories").insert({
      name: cName.trim(),
      slug: cSlug.trim() || slugify(cName),
      group_id: cGroupId,
      sort_order: categories.filter((x) => x.group_id === cGroupId).length,
    });
    if (err) setError(err.message.includes("unique") ? "رابط التصنيف مستخدم" : err.message);
    else {
      setCName("");
      setCSlug("");
      await load();
    }
    setSaving(false);
  };

  const saveGroupEdit = async (id: string) => {
    await supabase
      .from("category_groups")
      .update({ name: editGName.trim(), slug: slugify(editGName) })
      .eq("id", id);
    setEditGroup(null);
    load();
  };

  const saveCatEdit = async (id: string) => {
    await supabase
      .from("categories")
      .update({
        name: editCName.trim(),
        slug: slugify(editCName),
        group_id: editCGroup || null,
      })
      .eq("id", id);
    setEditCat(null);
    load();
  };

  const removeGroup = async (id: string) => {
    if (!confirm("حذف المجموعة؟ التصنيفات تحتها هتفضل لكن بدون مجموعة.")) return;
    await supabase.from("category_groups").delete().eq("id", id);
    load();
  };

  const removeCat = async (id: string) => {
    if (!confirm("حذف التصنيف؟")) return;
    await supabase.from("categories").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">المجموعات والتصنيفات</h1>
        <p className="text-sm text-muted mt-1">
          مجموعة (مثل إلكترونيات) → تصنيفات داخلها → عند رفع المنتج تختار التصنيف
        </p>
      </div>

      {error && (
        <div className="text-sm text-sale bg-sale/10 rounded-lg px-3 py-2">{error}</div>
      )}

      {/* Groups */}
      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold">1) المجموعات الرئيسية</h2>
        <form onSubmit={addGroup} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-muted mb-1">اسم المجموعة</label>
            <input
              value={gName}
              onChange={(e) => {
                setGName(e.target.value);
                setGSlug(slugify(e.target.value));
              }}
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="مثال: إلكترونيات"
              required
            />
          </div>
          <div className="w-36">
            <label className="block text-xs text-muted mb-1">الرابط</label>
            <input value={gSlug} onChange={(e) => setGSlug(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" dir="ltr" />
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-1 bg-ink text-white text-sm px-4 py-2 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة مجموعة
          </button>
        </form>

        {loading ? (
          <p className="text-muted text-sm">...</p>
        ) : (
          <ul className="divide-y">
            {groups.map((g) => (
              <li key={g.id} className="py-3 flex items-center gap-2">
                {editGroup === g.id ? (
                  <>
                    <input value={editGName} onChange={(e) => setEditGName(e.target.value)} className="flex-1 border rounded-lg px-2 py-1 text-sm" />
                    <button type="button" onClick={() => saveGroupEdit(g.id)} className="p-1.5 text-green-700"><Check className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setEditGroup(null)} className="p-1.5"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-muted" dir="ltr">/groups/{g.slug}</p>
                    </div>
                    <span className="text-xs text-muted">
                      {categories.filter((c) => c.group_id === g.id).length} تصنيف
                    </span>
                    <button type="button" onClick={() => { setEditGroup(g.id); setEditGName(g.name); }} className="p-2 text-muted"><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => removeGroup(g.id)} className="p-2 text-muted hover:text-sale"><Trash2 className="w-4 h-4" /></button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Categories */}
      <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold">2) التصنيفات داخل المجموعة</h2>
        <form onSubmit={addCategory} className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[140px]">
            <label className="block text-xs text-muted mb-1">المجموعة</label>
            <select value={cGroupId} onChange={(e) => setCGroupId(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white" required>
              <option value="">اختر</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-muted mb-1">اسم التصنيف</label>
            <input
              value={cName}
              onChange={(e) => {
                setCName(e.target.value);
                setCSlug(slugify(e.target.value));
              }}
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="مثال: سماعات"
              required
            />
          </div>
          <div className="w-36">
            <label className="block text-xs text-muted mb-1">الرابط</label>
            <input value={cSlug} onChange={(e) => setCSlug(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" dir="ltr" />
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-1 bg-ink text-white text-sm px-4 py-2 rounded-xl">
            <Plus className="w-4 h-4" /> إضافة تصنيف
          </button>
        </form>

        <div className="space-y-6">
          {groups.map((g) => {
            const cats = categories.filter((c) => c.group_id === g.id);
            return (
              <div key={g.id}>
                <h3 className="text-sm font-semibold text-muted mb-2 border-b pb-1">{g.name}</h3>
                {cats.length === 0 ? (
                  <p className="text-xs text-muted">لا تصنيفات بعد</p>
                ) : (
                  <ul className="space-y-1">
                    {cats.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-[#faf8f5]">
                        {editCat === c.id ? (
                          <>
                            <input value={editCName} onChange={(e) => setEditCName(e.target.value)} className="flex-1 border rounded-lg px-2 py-1 text-sm" />
                            <select value={editCGroup} onChange={(e) => setEditCGroup(e.target.value)} className="border rounded-lg text-sm px-2 py-1">
                              {groups.map((gg) => (
                                <option key={gg.id} value={gg.id}>{gg.name}</option>
                              ))}
                            </select>
                            <button type="button" onClick={() => saveCatEdit(c.id)} className="p-1 text-green-700"><Check className="w-4 h-4" /></button>
                            <button type="button" onClick={() => setEditCat(null)} className="p-1"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{c.name}</p>
                              <p className="text-[11px] text-muted" dir="ltr">/categories/{c.slug}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditCat(c.id);
                                setEditCName(c.name);
                                setEditCGroup(c.group_id || g.id);
                              }}
                              className="p-1.5 text-muted"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => removeCat(c.id)} className="p-1.5 text-muted hover:text-sale">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {categories.some((c) => !c.group_id) && (
            <div>
              <h3 className="text-sm font-semibold text-muted mb-2">بدون مجموعة</h3>
              <ul>
                {categories.filter((c) => !c.group_id).map((c) => (
                  <li key={c.id} className="text-sm py-1 flex justify-between">
                    <span>{c.name}</span>
                    <button type="button" onClick={() => removeCat(c.id)} className="text-sale text-xs">حذف</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
