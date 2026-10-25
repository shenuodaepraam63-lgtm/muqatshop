"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, type Category, type CategoryGroup } from "@/lib/supabase";

type Props = {
  value: string;
  onChange: (categoryId: string) => void;
  className?: string;
};

type FlatOption = {
  id: string;
  label: string;
  depth: number;
  group_id: string | null;
};

function buildTreeOptions(
  categories: Category[],
  groupId: string
): FlatOption[] {
  const inGroup = categories.filter((c) => c.group_id === groupId);
  const byParent = new Map<string | null, Category[]>();
  for (const c of inGroup) {
    const key = c.parent_id || null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "ar"));
  }

  const out: FlatOption[] = [];
  const walk = (parentId: string | null, depth: number) => {
    const kids = byParent.get(parentId) || [];
    for (const c of kids) {
      const prefix = depth === 0 ? "" : "— ".repeat(depth);
      out.push({
        id: c.id,
        label: `${prefix}${c.name}`,
        depth,
        group_id: c.group_id || null,
      });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export function CategorySelect({ value, onChange, className }: Props) {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: g }, { data: c }] = await Promise.all([
        supabase.from("category_groups").select("*").order("sort_order"),
        supabase
          .from("categories")
          .select("id, name, slug, group_id, parent_id, sort_order")
          .order("sort_order"),
      ]);
      setGroups((g as CategoryGroup[]) || []);
      setCategories((c as Category[]) || []);
      if (value && c) {
        const found = (c as Category[]).find((x) => x.id === value);
        if (found?.group_id) setGroupId(found.group_id);
      }
    })();
  }, [value]);

  const options = useMemo(
    () => (groupId ? buildTreeOptions(categories, groupId) : []),
    [categories, groupId]
  );

  const field =
    className ||
    "w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white";

  return (
    <div className="grid sm:grid-cols-2 gap-4 sm:col-span-2">
      <div>
        <label className="block text-sm font-medium mb-1.5">المجموعة</label>
        <select
          value={groupId}
          onChange={(e) => {
            setGroupId(e.target.value);
            onChange("");
          }}
          className={field}
        >
          <option value="">اختر المجموعة</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">التصنيف / الفرع</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={field}
          disabled={!groupId}
        >
          <option value="">بدون تصنيف</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
