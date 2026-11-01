// Access to the page's smooth scroller (Lenis), registered by SmoothScroll.
// Without it (reduced motion) these fall back to native scrolling.
let lenis = null;

export function registerLenis(instance) {
  lenis = instance;
}

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// A slow, cinematic glide to a section — passing through everything between.
export function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;

  if (lenis) {
    lenis.scrollTo(target, { duration: 2.4, easing: easeInOutCubic, force: true });
  } else {
    target.scrollIntoView();
  }
}

// Freeze page scrolling, e.g. while a full-screen menu is open.
export function lockScroll(locked) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
