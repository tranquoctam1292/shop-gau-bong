'use client';

interface ProductBadgesProps {
  onSale?: boolean | null;
  featured?: boolean | null;
  isNew?: boolean | null;
}

export function ProductBadges({ onSale, featured, isNew }: ProductBadgesProps) {
  const badges = [];

  if (onSale) {
    badges.push(
      <span
        key="sale"
        className="bg-accent text-accent-foreground text-xs font-semibold px-2 py-1 rounded-full"
      >
        Giảm giá
      </span>
    );
  }

  if (featured) {
    badges.push(
      <span
        key="featured"
        className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full"
      >
        Nổi bật
      </span>
    );
  }

  if (isNew) {
    badges.push(
      <span
        key="new"
        className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full"
      >
        Mới
      </span>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-2 left-2 flex flex-wrap gap-2 z-10">
      {badges}
    </div>
  );
}

