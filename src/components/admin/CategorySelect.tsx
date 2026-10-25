"use client";

import { useEffect, useState } from "react";
import { supabase, type Category, type CategoryGroup } from "@/lib/supabase";

type Props = {
  value: string;
  onChange: (categoryId: string) => void;
  className?: string;
};

export function CategorySelect({ value, onChange, className }: Props) {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: g }, { data: c }] = await Promise.all([
        supabase.from("category_groups").select("*").order("sort_order"),
        supabase.from("categories").select("id, name, slug, group_id").order("sort_order"),
      ]);
      setGroups((g as CategoryGroup[]) || []);
      setCategories((c as Category[]) || []);
      if (value && c) {
        const found = (c as Category[]).find((x) => x.id === value);
        if (found?.group_id) setGroupId(found.group_id);
      }
    })();
  }, [value]);

  const filtered = categories.filter((c) => !groupId || c.group_id === groupId);
  const field = className || "w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white";

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
        <label className="block text-sm font-medium mb-1.5">التصنيف</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={field}
        >
          <option value="">بدون تصنيف</option>
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
