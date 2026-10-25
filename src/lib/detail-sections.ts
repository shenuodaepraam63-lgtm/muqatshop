import type { DetailSection } from "@/lib/supabase";

/** Normalize and serialize product detail sections for DB storage */
export function serializeDetailSections(
  sections: DetailSection[] | null | undefined
): DetailSection[] {
  return (sections || [])
    .map((s) => {
      const title = (s.title || "").trim();
      const kind =
        s.kind === "specs" || (s.rows && s.rows.length) ? "specs" : "text";
      const rows = (s.rows || [])
        .map((r) => ({
          label: (r.label || "").trim(),
          value: (r.value || "").trim(),
        }))
        .filter((r) => r.label || r.value);
      return {
        title,
        kind: kind as "text" | "specs",
        content: (s.content || "").trim(),
        rows: kind === "specs" ? rows : [],
      };
    })
    .filter((s) => {
      if (!s.title) return false;
      if (s.kind === "specs") return s.rows.length > 0 || !!s.content;
      return true;
    });
}
