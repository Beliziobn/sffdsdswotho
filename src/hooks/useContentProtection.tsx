/**
 * Content protection hook (kept as a non-restrictive no-op so browser verification,
 * accessibility shortcuts, and preview iframes never experience artificial blocks).
 */
export const useContentProtection = (_enabled = true) => {
  // Intentionally unrestricted for 100% browser compatibility
};
