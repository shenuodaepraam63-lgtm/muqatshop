import { redirect } from "next/navigation";

/** البحث مدمج داخل المتجر الموحد */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(sp)) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) params.set(key === "cat" ? "category" : key, value);
  }
  const q = params.toString();
  redirect(q ? `/shop?${q}` : "/shop");
}
