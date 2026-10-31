"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

type AuthShellProps = {
  title: string;
  description?: string;
  brandingMessage?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const DEFAULT_BRANDING =
  "منصة تجمع بين التسوق والتجار والمسوقين، وتمنح كل طرف تجربة منظمة في عالم التجارة الإلكترونية.";

export function AuthShell({
  title,
  description,
  brandingMessage = DEFAULT_BRANDING,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row bg-[#F6F8FB] text-[#202B3C]"
      style={{ fontFamily: "var(--font-cairo), var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Branding panel — desktop 42% */}
      <aside className="hidden lg:flex lg:w-[42%] bg-[#14243A] text-white flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
        <div className="relative z-10">
          <BrandLogo size="lg" className="brightness-0 invert" />
          <p className="mt-10 text-[28px] font-bold leading-relaxed">تجارتك تبدأ بخطوة.</p>
          <p className="mt-4 text-[15px] text-white/70 leading-relaxed max-w-sm">{brandingMessage}</p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-3 max-w-xs">
          {["عميل", "مسوق", "تاجر", "منصة"].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-4 text-center text-xs font-semibold tracking-wide"
            >
              {label}
            </div>
          ))}
        </div>
        <div
          className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#3157D5]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-1/3 h-40 w-40 rounded-full bg-[#18A999]/15 blur-2xl"
          aria-hidden
        />
      </aside>

      {/* Form panel — 58% */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[460px]">
          <div className="lg:hidden mb-8 flex justify-center">
            <BrandLogo size="md" />
          </div>

          <div className="bg-white border border-[#E4E9F0] rounded-2xl shadow-sm p-6 sm:p-8 motion-safe:animate-[fadeSlide_250ms_ease-out]">
            <h1 className="text-[28px] font-bold leading-tight text-[#202B3C]">{title}</h1>
            {description ? (
              <p className="mt-2 text-[15px] text-[#718096] leading-relaxed">{description}</p>
            ) : null}

            <div className="mt-6">{children}</div>

            {footer ? <div className="mt-6 pt-4 border-t border-[#E4E9F0]">{footer}</div> : null}
          </div>

          <p className="mt-6 text-center text-xs text-[#718096]">
            <Link href="/" className="hover:text-[#3157D5] transition-colors">
              العودة للرئيسية
            </Link>
          </p>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-\\[fadeSlide_250ms_ease-out\\] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
