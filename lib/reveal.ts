/** On phones, results render below the form; scroll them into view once they arrive. */
export function revealOnSmallScreens(el: HTMLElement | null) {
  if (!el || window.matchMedia("(min-width: 768px)").matches) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
}
