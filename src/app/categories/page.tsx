import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "التصنيفات | Muqatshop",
};

type Cat = {
  id: string;
  name: string;
  slug: string;
  group_id: string | null;
  parent_id: string | null;
};

function buildChildren(parentId: string, all: Cat[]): Cat[] {
  return all.filter((c) => c.parent_id === parentId);
}

function CategoryBranch({ cat, all, depth = 0 }: { cat: Cat; all: Cat[]; depth?: number }) {
  const kids = buildChildren(cat.id, all);
  return (
    <div className={depth > 0 ? "mr-4 border-r border-[#eae6df] pr-3" : ""}>
      <Link
        href={`/categories/${encodeURIComponent(cat.slug)}`}
        className={`block rounded-xl px-3 py-2.5 transition hover:bg-[#f5f1e8] ${
          depth === 0 ? "font-semibold text-ink" : "text-sm text-[#333]"
        }`}
      >
        {cat.name}
      </Link>
      {kids.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {kids.map((k) => (
            <CategoryBranch key={k.id} cat={k} all={all} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function CategoriesIndexPage() {
  const [{ data: groups }, { data: cats }] = await Promise.all([
    supabase
      .from("category_groups")
      .select("id, name, slug, image")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("categories")
      .select("id, name, slug, group_id, parent_id")
      .order("sort_order"),
  ]);

  const list = groups || [];
  const allCats = (cats || []) as Cat[];

  return (
    <div className="bg-page min-h-screen">
      <div className="bg-[#e8e2d4] text-[11px] tracking-wide uppercase text-muted">
        <div className="max-w-page mx-auto px-4 md:px-8 py-2.5 flex gap-1">
          <Link href="/" className="hover:text-ink">
            الرئيسية
          </Link>
          <span>/</span>
          <span className="text-ink">التصنيفات</span>
        </div>
      </div>

      <div className="max-w-page mx-auto px-4 md:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">التصنيفات</h1>
        <p className="text-sm text-muted mb-8">
          مجموعة ← تصنيف ← فروع. اضغط أي مستوى لعرض المنتجات
        </p>

        {list.length === 0 ? (
          <p className="text-muted text-center py-16">لا توجد مجموعات بعد</p>
        ) : (
          <div className="space-y-6">
            {list.map((g) => {
              const roots = allCats.filter((c) => c.group_id === g.id && !c.parent_id);
              return (
                <section
                  key={g.id}
                  className="rounded-2xl border border-[#eae6df] bg-white overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-[#fbfaf8] border-b border-[#f0ebe3]">
                    <div>
                      <h2 className="font-bold text-ink">{g.name}</h2>
                      <p className="text-[11px] text-muted">
                        {roots.length} تصنيف رئيسي
                      </p>
                    </div>
                    <Link
                      href={`/groups/${encodeURIComponent(g.slug)}`}
                      className="text-xs font-medium text-[#0042EB] hover:underline shrink-0"
                    >
                      دخول المجموعة
                    </Link>
                  </div>
                  <div className="p-3 space-y-2">
                    {roots.length === 0 ? (
                      <p className="text-sm text-muted px-2 py-3">لا تصنيفات داخل هذه المجموعة</p>
                    ) : (
                      roots.map((root) => (
                        <CategoryBranch key={root.id} cat={root} all={allCats} />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
