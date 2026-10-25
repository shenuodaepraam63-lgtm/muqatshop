"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, type Category, type CategoryGroup } from "@/lib/supabase";
import {
  Plus,
  Trash2,
  Loader2,
  Pencil,
  Check,
  X,
  GripVertical,
  FolderTree,
  Layers,
  ChevronDown,
  ChevronLeft,
  GitBranch,
} from "lucide-react";

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildParentOptions(
  categories: Category[],
  groupId: string,
  excludeIds: Set<string> = new Set()
): { id: string; label: string }[] {
  const inGroup = categories.filter((c) => c.group_id === groupId);
  const byParent = new Map<string | null, Category[]>();
  for (const c of inGroup) {
    const key = c.parent_id || null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const list of byParent.values()) {
    list.sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "ar")
    );
  }
  const out: { id: string; label: string }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const c of byParent.get(parentId) || []) {
      if (!excludeIds.has(c.id)) {
        const prefix = depth === 0 ? "" : "— ".repeat(depth);
        out.push({ id: c.id, label: `${prefix}${c.name}` });
      }
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

function collectSelfAndDescendants(id: string, categories: Category[]): Set<string> {
  const set = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of categories) {
      if (c.parent_id && set.has(c.parent_id) && !set.has(c.id)) {
        set.add(c.id);
        changed = true;
      }
    }
  }
  return set;
}

export default function CategoriesAdminPage() {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const [gName, setGName] = useState("");
  const [cName, setCName] = useState("");
  const [cParentId, setCParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [editGroup, setEditGroup] = useState<string | null>(null);
  const [editGName, setEditGName] = useState("");
  const [editCat, setEditCat] = useState<string | null>(null);
  const [editCName, setEditCName] = useState("");
  const [editCParent, setEditCParent] = useState("");

  const [dragGroupId, setDragGroupId] = useState<string | null>(null);
  const [dragCatId, setDragCatId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const flash = (msg: string) => {
    setOkMsg(msg);
    setTimeout(() => setOkMsg(""), 2000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: g }, { data: c }] = await Promise.all([
      supabase.from("category_groups").select("*").order("sort_order").order("name"),
      supabase.from("categories").select("*").order("sort_order").order("name"),
    ]);
    const glist = (g as CategoryGroup[]) || [];
    setGroups(glist);
    setCategories((c as Category[]) || []);
    setSelectedGroupId((prev) => prev || glist[0]?.id || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const parentOptions = useMemo(
    () => (selectedGroupId ? buildParentOptions(categories, selectedGroupId) : []),
    [categories, selectedGroupId]
  );

  const groupCats = useMemo(() => {
    return categories
      .filter((c) => c.group_id === selectedGroupId)
      .sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "ar")
      );
  }, [categories, selectedGroupId]);

  const roots = useMemo(
    () => groupCats.filter((c) => !c.parent_id),
    [groupCats]
  );

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) return;
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("category_groups")
      .insert({
        name: gName.trim(),
        slug: slugify(gName),
        sort_order: groups.length,
        is_active: true,
      })
      .select()
      .single();
    if (err) setError(err.message.includes("unique") ? "رابط المجموعة مستخدم" : err.message);
    else {
      setGName("");
      await load();
      if (data?.id) setSelectedGroupId(data.id);
      flash("تم إضافة المجموعة");
    }
    setSaving(false);
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !selectedGroupId) {
      setError("اختر مجموعة واسم التصنيف");
      return;
    }
    setSaving(true);
    setError("");
    const parent = cParentId || null;
    const siblings = categories.filter(
      (x) => x.group_id === selectedGroupId && (x.parent_id || null) === parent
    );
    const { error: err } = await supabase.from("categories").insert({
      name: cName.trim(),
      slug: slugify(cName),
      group_id: selectedGroupId,
      parent_id: parent,
      sort_order: siblings.length,
    });
    if (err) {
      setError(err.message.includes("unique") ? "رابط التصنيف مستخدم" : err.message);
    } else {
      setCName("");
      await load();
      flash("تم إضافة التصنيف");
    }
    setSaving(false);
  };

  const startAddChild = (parent: Category) => {
    setSelectedGroupId(parent.group_id || "");
    setCParentId(parent.id);
    setCName("");
    setError("");
    setExpanded((e) => ({ ...e, [parent.id]: true }));
    setTimeout(() => document.getElementById("cat-name-input")?.focus(), 80);
  };

  const saveGroupEdit = async (id: string) => {
    await supabase
      .from("category_groups")
      .update({ name: editGName.trim(), slug: slugify(editGName) })
      .eq("id", id);
    setEditGroup(null);
    load();
    flash("تم التحديث");
  };

  const saveCatEdit = async (id: string) => {
    const parent = editCParent || null;
    if (parent === id) {
      setError("لا يمكن أن يكون التصنيف أباً لنفسه");
      return;
    }
    if (parent) {
      const banned = collectSelfAndDescendants(id, categories);
      if (banned.has(parent)) {
        setError("لا يمكن وضع التصنيف تحت أحد فروعه");
        return;
      }
    }
    const { error: err } = await supabase
      .from("categories")
      .update({
        name: editCName.trim(),
        slug: slugify(editCName),
        parent_id: parent,
      })
      .eq("id", id);
    if (err) setError(err.message);
    setEditCat(null);
    load();
    flash("تم التحديث");
  };

  const removeGroup = async (id: string) => {
    if (!confirm("حذف المجموعة؟ التصنيفات تبقى بدون مجموعة.")) return;
    await supabase.from("category_groups").delete().eq("id", id);
    if (selectedGroupId === id) setSelectedGroupId("");
    load();
  };

  const removeCat = async (id: string) => {
    const children = categories.filter((c) => c.parent_id === id);
    if (children.length) {
      if (!confirm(`فيه ${children.length} فرع. الحذف هيفصل الفروع عن الأب. متابعة؟`)) return;
      await supabase.from("categories").update({ parent_id: null }).eq("parent_id", id);
    } else if (!confirm("حذف التصنيف؟")) return;
    await supabase.from("categories").delete().eq("id", id);
    load();
  };

  const reorderGroups = async (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const list = [...groups];
    const fromIdx = list.findIndex((g) => g.id === fromId);
    const toIdx = list.findIndex((g) => g.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [item] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, item);
    setGroups(list);
    await Promise.all(
      list.map((g, i) =>
        supabase.from("category_groups").update({ sort_order: i }).eq("id", g.id)
      )
    );
    flash("تم ترتيب المجموعات");
  };

  const reorderCatsSameParent = async (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = categories.find((c) => c.id === fromId);
    const to = categories.find((c) => c.id === toId);
    if (!from || !to) return;
    if ((from.parent_id || null) !== (to.parent_id || null)) return;
    if (from.group_id !== to.group_id) return;

    const siblings = categories
      .filter(
        (c) =>
          c.group_id === from.group_id &&
          (c.parent_id || null) === (from.parent_id || null)
      )
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const fromIdx = siblings.findIndex((c) => c.id === fromId);
    const toIdx = siblings.findIndex((c) => c.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [item] = siblings.splice(fromIdx, 1);
    siblings.splice(toIdx, 0, item);

    setCategories((prev) =>
      prev.map((c) => {
        const idx = siblings.findIndex((s) => s.id === c.id);
        if (idx >= 0) return { ...c, sort_order: idx };
        return c;
      })
    );

    await Promise.all(
      siblings.map((c, i) =>
        supabase.from("categories").update({ sort_order: i }).eq("id", c.id)
      )
    );
    flash("تم ترتيب التصنيفات");
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const renderCatNode = (c: Category, depth: number) => {
    const kids = groupCats
      .filter((x) => x.parent_id === c.id)
      .sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "ar")
      );
    const isOpen = expanded[c.id] !== false;
    const editParentOpts =
      editCat === c.id
        ? buildParentOptions(
            categories,
            selectedGroupId,
            collectSelfAndDescendants(c.id, categories)
          )
        : [];

    return (
      <div key={c.id} className="select-none">
        <div
          draggable={editCat !== c.id}
          onDragStart={(e) => {
            setDragCatId(c.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragCatId) reorderCatsSameParent(dragCatId, c.id);
            setDragCatId(null);
          }}
          onDragEnd={() => setDragCatId(null)}
          className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2.5 mb-1.5 transition ${
            dragCatId === c.id
              ? "border-[#0042EB]/40 bg-[#0042EB]/5 opacity-60"
              : "border-transparent hover:border-[#e8e2d9] hover:bg-white bg-[#faf9f6]"
          }`}
          style={{ marginInlineStart: depth * 18 }}
        >
          <span className="cursor-grab active:cursor-grabbing text-[#b0a99a] shrink-0 touch-none">
            <GripVertical className="w-4 h-4" />
          </span>

          {kids.length > 0 ? (
            <button
              type="button"
              onClick={() => setExpanded((ex) => ({ ...ex, [c.id]: !isOpen }))}
              className="p-0.5 text-muted shrink-0"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}

          {editCat === c.id ? (
            <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
              <input
                value={editCName}
                onChange={(e) => setEditCName(e.target.value)}
                className="flex-1 min-w-[120px] border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0042EB]/20"
              />
              <select
                value={editCParent}
                onChange={(e) => setEditCParent(e.target.value)}
                className="border border-[#e5e5e5] rounded-lg text-sm px-2 py-1.5 max-w-[160px] bg-white"
              >
                <option value="">جذر (تحت المجموعة)</option>
                {editParentOpts.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => saveCatEdit(c.id)}
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditCat(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#101010] truncate">{c.name}</p>
                <p className="text-[10px] text-[#888] font-mono truncate" dir="ltr">
                  /categories/{c.slug}
                  {depth > 0 ? ` · مستوى ${depth + 1}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100">
                <button
                  type="button"
                  title="فرع جديد"
                  onClick={() => startAddChild(c)}
                  className="p-1.5 rounded-lg hover:bg-[#0042EB]/10 text-[#0042EB]"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditCat(c.id);
                    setEditCName(c.name);
                    setEditCParent(c.parent_id || "");
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-muted"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCat(c.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-muted hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
        {isOpen && kids.map((k) => renderCatNode(k, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#101010] tracking-tight">
            المجموعات والتصنيفات
          </h1>
          <p className="text-sm text-[#666] mt-1.5 leading-relaxed">
            نظّم الأقسام بشكل شجري · اسحب لإعادة الترتيب · أضف فروعاً بلا حد
          </p>
        </div>
        {(error || okMsg) && (
          <div
            className={`text-sm rounded-xl px-4 py-2.5 ${
              error
                ? "bg-rose-50 text-rose-700 border border-rose-100"
                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
            }`}
          >
            {error || okMsg}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5 items-start">
        <aside className="bg-white rounded-2xl border border-[#eae6df] shadow-sm overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#f0ebe3] bg-gradient-to-l from-[#faf8f5] to-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#101010] text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#101010]">المجموعات</p>
              <p className="text-[11px] text-[#888]">{groups.length} مجموعة</p>
            </div>
          </div>

          <form onSubmit={addGroup} className="p-3 border-b border-[#f0ebe3] space-y-2">
            <input
              value={gName}
              onChange={(e) => setGName(e.target.value)}
              placeholder="اسم مجموعة جديدة..."
              className="w-full border border-[#e5e5e5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15 focus:border-[#0042EB]/40"
            />
            <button
              type="submit"
              disabled={saving || !gName.trim()}
              className="w-full flex items-center justify-center gap-1.5 bg-[#101010] text-white text-sm font-medium py-2 rounded-xl hover:bg-[#222] disabled:opacity-40 transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة مجموعة
            </button>
          </form>

          <div className="p-2 max-h-[55vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8 text-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : groups.length === 0 ? (
              <p className="text-xs text-center text-[#999] py-8">لا مجموعات بعد</p>
            ) : (
              <ul className="space-y-1">
                {groups.map((g) => {
                  const count = categories.filter((c) => c.group_id === g.id).length;
                  const active = selectedGroupId === g.id;
                  return (
                    <li
                      key={g.id}
                      draggable={editGroup !== g.id}
                      onDragStart={(e) => {
                        setDragGroupId(g.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragGroupId) reorderGroups(dragGroupId, g.id);
                        setDragGroupId(null);
                      }}
                      onDragEnd={() => setDragGroupId(null)}
                      className={`rounded-xl transition ${
                        dragGroupId === g.id ? "opacity-50" : ""
                      } ${
                        active
                          ? "bg-[#101010] text-white shadow-md"
                          : "hover:bg-[#f5f1e8] text-[#101010]"
                      }`}
                    >
                      {editGroup === g.id ? (
                        <div className="flex items-center gap-1 p-2">
                          <input
                            value={editGName}
                            onChange={(e) => setEditGName(e.target.value)}
                            className="flex-1 border rounded-lg px-2 py-1 text-sm text-ink"
                          />
                          <button type="button" onClick={() => saveGroupEdit(g.id)} className="p-1 text-emerald-600">
                            <Check className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setEditGroup(null)} className="p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-2.5">
                          <span
                            className={`cursor-grab active:cursor-grabbing shrink-0 ${
                              active ? "text-white/50" : "text-[#c4bdb0]"
                            }`}
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedGroupId(g.id)}
                            className="flex-1 text-right min-w-0"
                          >
                            <p className="text-sm font-medium truncate">{g.name}</p>
                            <p className={`text-[10px] ${active ? "text-white/60" : "text-[#999]"}`}>
                              {count} تصنيف
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditGroup(g.id);
                              setEditGName(g.name);
                            }}
                            className={`p-1 rounded-lg ${active ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGroup(g.id)}
                            className={`p-1 rounded-lg ${active ? "hover:bg-white/10" : "hover:bg-rose-50 hover:text-rose-600"}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="px-3 py-2 text-[10px] text-[#aaa] border-t border-[#f0ebe3]">
            اسحب ⋮⋮ لتغيير ترتيب المجموعات
          </p>
        </aside>

        <section className="bg-white rounded-2xl border border-[#eae6df] shadow-sm overflow-hidden min-h-[480px]">
          <div className="px-5 py-3.5 border-b border-[#f0ebe3] bg-gradient-to-l from-[#faf8f5] to-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#0042EB]/10 text-[#0042EB] flex items-center justify-center shrink-0">
                <FolderTree className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#101010] truncate">
                  {selectedGroup ? selectedGroup.name : "اختر مجموعة"}
                </p>
                <p className="text-[11px] text-[#888]">
                  {selectedGroup
                    ? `${groupCats.length} تصنيف · اسحب لإعادة الترتيب`
                    : "من القائمة الجانبية"}
                </p>
              </div>
            </div>
          </div>

          {!selectedGroupId ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#aaa]">
              <FolderTree className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">اختر مجموعة لعرض وإدارة تصنيفاتها</p>
            </div>
          ) : (
            <>
              <form
                onSubmit={addCategory}
                className="p-4 border-b border-[#f0ebe3] bg-[#fbfaf8] space-y-3"
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#666] mb-1">
                      تحت أي تصنيف؟
                    </label>
                    <select
                      value={cParentId}
                      onChange={(e) => setCParentId(e.target.value)}
                      className="w-full border border-[#e5e5e5] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
                    >
                      <option value="">— جذر (مباشر تحت المجموعة)</option>
                      {parentOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#666] mb-1">
                      اسم التصنيف / الفرع
                    </label>
                    <input
                      id="cat-name-input"
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      placeholder="مثال: ملابس منزلية"
                      className="w-full border border-[#e5e5e5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
                      required
                    />
                  </div>
                </div>
                {cParentId && (
                  <p className="text-xs text-[#666]">
                    سيُضاف تحت:{" "}
                    <strong className="text-[#101010]">
                      {categories.find((x) => x.id === cParentId)?.name}
                    </strong>{" "}
                    <button
                      type="button"
                      className="text-[#0042EB] underline"
                      onClick={() => setCParentId("")}
                    >
                      إلغاء
                    </button>
                  </p>
                )}
                <button
                  type="submit"
                  disabled={saving || !cName.trim()}
                  className="inline-flex items-center gap-1.5 bg-[#0042EB] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0036c4] disabled:opacity-40 transition"
                >
                  <Plus className="w-4 h-4" />
                  إضافة تصنيف
                </button>
              </form>

              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center py-12 text-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : roots.length === 0 ? (
                  <div className="text-center py-16 text-[#aaa]">
                    <p className="text-sm">لا تصنيفات في هذه المجموعة بعد</p>
                    <p className="text-xs mt-1">أضف تصنيفاً من النموذج أعلاه</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">{roots.map((c) => renderCatNode(c, 0))}</div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
