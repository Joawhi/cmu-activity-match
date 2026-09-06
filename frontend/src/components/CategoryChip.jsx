import { CATEGORY_META } from '../lib/helpers';

export function CategoryChip({ category, className = '' }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Other;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${className}`}
      style={{ backgroundColor: meta.bg, color: meta.fg }}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {category}
    </span>
  );
}