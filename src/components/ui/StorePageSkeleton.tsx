/** Structural skeleton matching store/cart layout — avoids blank «جاري التحميل» flash. */

export function StorePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F6F8FB]" dir="rtl" aria-busy="true" aria-live="polite">
      {/* Announcement placeholder */}
      <div className="h-9 bg-[#EEF3FF]" />

      {/* Header placeholder */}
      <div className="border-b border-[#E5EAF1] bg-white">
        <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between gap-3 px-[4%]">
          <div className="h-8 w-28 animate-pulse rounded-lg bg-[#E8EDF5]" />
          <div className="hidden h-10 flex-1 max-w-md animate-pulse rounded-full bg-[#E8EDF5] sm:block" />
          <div className="flex gap-2">
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#E8EDF5]" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#E8EDF5]" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#E8EDF5]" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] space-y-6 px-[4%] py-5">
        {/* Promo slider skeleton */}
        <div className="h-[160px] animate-pulse rounded-2xl bg-[#E8EDF5] sm:h-[280px] md:h-[360px]" />

        {/* Category strip */}
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[108px] shrink-0 space-y-2 sm:w-[125px]">
              <div className="h-[72px] animate-pulse rounded-xl bg-[#E8EDF5] sm:h-[84px]" />
              <div className="mx-auto h-3 w-16 animate-pulse rounded bg-[#E8EDF5]" />
            </div>
          ))}
        </div>

        {/* Section title + chips */}
        <div className="space-y-3">
          <div className="h-6 w-40 animate-pulse rounded bg-[#E8EDF5]" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-[#E8EDF5]" />
            ))}
          </div>
          {/* Product cards 2-up */}
          <div className="flex gap-2.5 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-[calc((100%-10px)/2)] max-w-[200px] shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F6] bg-white"
              >
                <div className="aspect-square animate-pulse bg-[#E8EDF5]" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-full animate-pulse rounded bg-[#E8EDF5]" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[#E8EDF5]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[#E8EDF5]" />
                  <div className="h-9 w-full animate-pulse rounded-xl bg-[#E8EDF5]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav placeholder (mobile) */}
      <div className="fixed inset-x-0 bottom-0 h-16 border-t border-[#E5EAF1] bg-white md:hidden" />
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F6F8FB]" dir="rtl" aria-busy="true">
      <div className="h-9 bg-[#EEF3FF]" />
      <div className="border-b border-[#E5EAF1] bg-white">
        <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between px-[4%]">
          <div className="h-8 w-28 animate-pulse rounded-lg bg-[#E8EDF5]" />
          <div className="flex gap-2">
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#E8EDF5]" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#E8EDF5]" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] space-y-4 px-[4%] py-6">
        <div className="h-7 w-36 animate-pulse rounded bg-[#E8EDF5]" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-xl border border-[#E5EAF1] bg-white p-3"
          >
            <div className="h-[84px] w-[84px] animate-pulse rounded-lg bg-[#E8EDF5]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#E8EDF5]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[#E8EDF5]" />
              <div className="h-8 w-24 animate-pulse rounded bg-[#E8EDF5]" />
            </div>
          </div>
        ))}
        <div className="h-40 animate-pulse rounded-xl bg-[#E8EDF5]" />
      </div>
      <div className="fixed inset-x-0 bottom-0 h-16 border-t border-[#E5EAF1] bg-white md:hidden" />
    </div>
  );
}
