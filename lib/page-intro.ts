/**
 * Shared bits of the first-load intro (components/Preloader.tsx) and the page curtain / content reveal
 * (components/PageTransition.tsx, components/PageReveal.tsx), which have to agree on who is covering the page.
 */

/** Fired when a cover is about to lift off the page, so the content can rise in with it. `detail.delay` is in seconds. */
export const PAGE_REVEAL_EVENT = "page-curtain:reveal";

/** True while the language-cycling preloader is on screen (it is in the server HTML, so this holds from first paint). */
export function preloaderIsUp(): boolean {
  const el = document.querySelector<HTMLElement>("[data-preloader]");
  if (!el) return false;
  const style = window.getComputedStyle(el);
  // opacity 0 is what the stylesheet's failsafe leaves behind if scripts took too long to start.
  return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0.01;
}
