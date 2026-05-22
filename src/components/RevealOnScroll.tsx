'use client';

// Mounts once per page. Finds every `.reveal` element, adds `.reveal-init`
// (which hides it via CSS), then uses an IntersectionObserver to add `.in`
// when each element enters the viewport — triggering the fade-from-below.
//
// Important: the SSR HTML keeps `.reveal` only, which is visible by
// default. We add `.reveal-init` BEFORE the observer fires its first
// callback so there's no flash of visible-then-hidden content. Browsers
// that don't support IntersectionObserver or have JS disabled never
// hide the content in the first place.

import { useEffect } from 'react';

export default function RevealOnScroll() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (elements.length === 0) return;

    // Hide first, then observe. Browsers paint these two style mutations
    // in the same frame so users don't see a flash.
    for (const el of elements) el.classList.add('reveal-init');

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );

    for (const el of elements) io.observe(el);

    return () => io.disconnect();
  }, []);

  return null;
}
