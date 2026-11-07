/** Same geometry as MarketplaceProductCard — shown before rise-in. */
export function ProductCardSkeleton() {
  return (
    <div
      className="product-card-skeleton"
      aria-hidden
    >
      <div className="product-card-skeleton__media">
        <div className="product-card-skeleton__shape" />
      </div>
      <div className="product-card-skeleton__body">
        <div className="product-card-skeleton__line product-card-skeleton__line--title" />
        <div className="product-card-skeleton__line product-card-skeleton__line--title-short" />
        <div className="product-card-skeleton__line product-card-skeleton__line--price" />
        <div className="product-card-skeleton__line product-card-skeleton__line--stock" />
        <div className="product-card-skeleton__btn" />
      </div>
    </div>
  );
}
