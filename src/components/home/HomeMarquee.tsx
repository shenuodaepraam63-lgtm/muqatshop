/**
 * Lightweight CSS marquee — brand awareness strip (Dream2000-style rhythm).
 */
export function HomeMarquee({
  text = "Muqatshop — تسوق بثقة · عروض حقيقية · تصفح التصنيفات · أضف للسلة بسهولة",
}: {
  text?: string;
}) {
  const chunk = `${text}   ·   `;
  return (
    <div className="home-marquee" role="presentation" aria-hidden>
      <div className="home-marquee__track">
        <span className="home-marquee__item">{chunk.repeat(6)}</span>
        <span className="home-marquee__item">{chunk.repeat(6)}</span>
      </div>
    </div>
  );
}
