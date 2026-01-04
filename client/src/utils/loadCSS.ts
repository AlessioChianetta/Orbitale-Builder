/**
 * Async CSS Loading Utility
 * Loads CSS asynchronously without blocking page render
 */

export function loadCSS(href: string, before?: HTMLElement, media = 'all') {
  const ss = window.document.styleSheets;
  
  // Check if stylesheet is already loaded
  for (let i = 0; i < ss.length; i++) {
    if (ss[i].href === href) {
      return; // Already loaded
    }
  }

  const ref = before || window.document.getElementsByTagName('script')[0];
  const link = window.document.createElement('link');
  
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print'; // Temporarily set to print to avoid blocking
  
  // Once loaded, switch to all media
  link.onload = function() {
    link.media = media;
  };

  // Insert before the reference element
  if (ref && ref.parentNode) {
    ref.parentNode.insertBefore(link, ref);
  }

  return link;
}
