import Link from "next/link";

export function SectionHeader({
  title,
  description,
  href,
  linkLabel = "عرض الكل",
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-[#14243A] sm:text-xl">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[#718096] line-clamp-1">{description}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-[#3157D5] hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
