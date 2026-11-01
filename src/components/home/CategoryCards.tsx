import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/supabase";

export function CategoryCards({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-5">
      {categories.slice(0, 10).map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${encodeURIComponent(cat.slug)}`}
          className="group relative h-[120px] overflow-hidden rounded-[12px] border border-[#E5EAF1] bg-[#14243A] transition hover:border-[#3157D5] sm:h-[150px] sm:rounded-[14px]"
        >
          {cat.image ? (
            <Image
              src={cat.image}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              sizes="(max-width:767px) 47vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3554] to-[#14243A]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14243A]/85 via-[#14243A]/25 to-transparent" />
          <p className="absolute inset-x-0 bottom-0 p-3 text-[13px] font-bold text-white sm:text-[15px] line-clamp-2">
            {cat.name}
          </p>
        </Link>
      ))}
    </div>
  );
}
