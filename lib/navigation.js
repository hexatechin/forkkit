const ROOT_DOMAIN = "indocia.in";

export function getTenantUrl(tenantSlug, path = "/") {
  // Normalize path
  const normalizedPath =
    path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") {
    // Server-side fallback
    return `/t/${tenantSlug}${normalizedPath}`;
  }
  const hostname = window.location.hostname;
  // Main Indocia domain
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return `${tenantSlug}.${ROOT_DOMAIN}${normalizedPath}`;
  }
  // Indocia tenant subdomain
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return normalizedPath || "/";
  }

  // Fallback
  return `/t/${tenantSlug}${normalizedPath}`;
}
