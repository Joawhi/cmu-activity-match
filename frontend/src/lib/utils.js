import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combines conditional class names and resolves conflicting Tailwind classes.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}