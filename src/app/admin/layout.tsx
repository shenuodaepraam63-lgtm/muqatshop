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
    <>
      <style>{`
        body > div > header,
        body > div > nav.md\\:hidden,
        body > div > footer,
        body > header,
        body > footer,
        .bottom-nav-safe,
        [role="region"][aria-label="إعلان"] {
          display: none !important;
        }
        main { padding-bottom: 0 !important; min-height: auto !important; }
      `}</style>
      <div className="min-h-screen bg-[#f7f4ea] text-ink fixed inset-0 z-[100] overflow-auto">
        <div className="border-b border-border bg-page sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/admin" className="font-bold tracking-tight">
              Muqatshop Admin
            </a>
            <a href="/" className="text-sm text-muted hover:text-ink">
              عرض المتجر
            </a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
      </div>
    </>
  );
}
