import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Muqatshop",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f4ea] text-ink">
      <div className="border-b border-border bg-page">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/admin" className="font-bold tracking-tight">
            Muqatshop Admin
          </a>
          <a href="/" className="text-sm text-muted hover:text-ink">
            عرض المتجر ←
          </a>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
