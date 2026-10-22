"use client";

const messages = [
  "🚚 شحن مجاني للطلبات فوق 600 جنيه",
  "💎 أسلوبك، قصتك",
  "✨ توصيل لكل محافظات مصر",
];

export function AnnouncementBar() {
  const doubled = [...messages, ...messages];

  return (
    <div
      className="bg-ink text-page text-sm h-[37px] overflow-hidden flex items-center"
      role="region"
      aria-label="إعلان"
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((msg, i) => (
          <span key={i} className="mx-8 font-medium">
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
