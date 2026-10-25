import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function GroupsIndexPage() {
  const { data: groups } = await supabase
    .from("category_groups")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order");

  const list = groups || [];

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">المجموعات</h1>
      <p className="text-sm text-muted mb-8">
        اختر مجموعة لعرض تصنيفاتها وفروعها
      </p>

      {list.length === 0 ? (
        <p className="text-muted text-center py-12">لا توجد مجموعات بعد</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {list.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${encodeURIComponent(g.slug)}`}
              className="rounded-2xl bg-[#f5f1e8] border border-[#e8e2d9] px-4 py-8 text-center hover:shadow-md transition"
            >
              <span className="font-semibold text-ink text-lg">{g.name}</span>
            </Link>
          ))}
        </div>
      )}

      <p className="text-center mt-10">
        <Link href="/categories" className="text-sm text-[#0042EB] hover:underline">
          أو تصفح شجرة التصنيفات كاملة
        </Link>
      </p>
    </div>
  );
}
