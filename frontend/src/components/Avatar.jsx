import { avatarColor, initials } from '../lib/helpers';
import { cn } from '../lib/utils';

export function Avatar({ name, photoUrl, size = 40, className }) {
  const color = avatarColor(name);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-sans font-semibold select-none',
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: photoUrl ? undefined : color.bg,
        color: photoUrl ? undefined : color.fg,
        fontSize: Math.max(11, size * 0.36),
      }}
      aria-hidden="true"
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}