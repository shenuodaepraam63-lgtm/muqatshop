import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function GroupsIndexPage() {
  const { data: groups } = await supabase
    .from("category_groups")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order");

  const { data: cats } = await supabase
    .from("categories")
    .select("id, name, slug, group_id, parent_id")
    .order("sort_order");

  const list = groups || [];
  const allCats = cats || [];

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">الأقسام</h1>
      <p className="text-sm text-muted mb-8">تصفح حسب المجموعة ثم التصنيف والفروع</p>

      <div className="space-y-10">
        {list.map((g) => {
          const roots = allCats.filter((c) => c.group_id === g.id && !c.parent_id);
          return (
            <section key={g.id}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{g.name}</h2>
                <Link
                  href={`/groups/${encodeURIComponent(g.slug)}`}
                  className="text-sm text-muted hover:text-ink"
                >
                  عرض الكل
                </Link>
              </div>
              {roots.length === 0 ? (
                <p className="text-sm text-muted">لا تصنيفات بعد</p>
              ) : (
                <div className="space-y-4">
                  {roots.map((root) => {
                    const kids = allCats.filter((c) => c.parent_id === root.id);
                    return (
                      <div key={root.id}>
                        <Link
                          href={`/categories/${encodeURIComponent(root.slug)}`}
                          className="text-sm font-semibold hover:underline"
                        >
                          {root.name}
                        </Link>
                        {kids.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                            {kids.map((c) => (
                              <Link
                                key={c.id}
                                href={`/categories/${encodeURIComponent(c.slug)}`}
                                className="bg-[#f5f1e8] hover:bg-[#ebe6dc] rounded-2xl px-4 py-4 text-center transition border border-transparent hover:border-[#e8e2d9]"
                              >
                                <span className="text-sm font-semibold">{c.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
        {list.length === 0 && (
          <p className="text-muted text-center py-12">لا توجد أقسام بعد</p>
        )}
      </div>
    </div>
  );
}
