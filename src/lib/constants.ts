const DEFAULT_SITE_URL = "https://elegenceinvitation.best";

function normalizeSiteUrl(value: string | undefined) {
  const rawUrl = value?.trim() || DEFAULT_SITE_URL;
  const absoluteUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  try {
    const url = new URL(absoluteUrl);
    if (url.hostname.endsWith(".vercel.app")) return DEFAULT_SITE_URL;
    return url.origin.replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export function siteUrl(path = "/") {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return new URL(safePath, `${SITE_URL}/`).toString();
}
