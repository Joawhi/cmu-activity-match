import { CATEGORY_META } from '../lib/helpers';

export function CategoryChip({ category, className = '' }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Other;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold tracking-wide uppercase ${className}`}
      style={{ backgroundColor: meta.bg, color: meta.fg, borderColor: `${meta.fg}33` }}
    >
      {category}
    </span>
  );
}
