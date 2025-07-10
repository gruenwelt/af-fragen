// src/lib/stores/device.ts
import { readable } from 'svelte/store';

export const isMobile = readable(false, (set) => {
  if (typeof window === 'undefined') return;

  const check = () => set(window.innerWidth <= 768);
  check();

  window.addEventListener('resize', check);
  return () => window.removeEventListener('resize', check);
});