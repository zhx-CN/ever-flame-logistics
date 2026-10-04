import { pagePaths } from "./content.js";

export function normalizeBasePath(value = "/") {
  const path = String(value).trim() || "/";
  if (!path.startsWith("/") || /[\\?#]/.test(path)) {
    throw new Error("Site base must be an absolute URL path, such as /ever-flame-logistics/.");
  }
  const segments = path.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === ".." || segment.includes(":"))) {
    throw new Error("Site base cannot contain relative segments or a URL scheme.");
  }
  return segments.length ? `/${segments.join("/")}/` : "/";
}

export function cleanPath(pathname) {
  let decoded = pathname || "/";
  try {
    decoded = decodeURI(decoded);
  } catch {
    // A malformed URL should display the not-found page instead of crashing.
  }
  return decoded.replace(/\/+$/, "") || "/";
}

export function createSitePaths(base = "/") {
  const basePath = normalizeBasePath(base);
  const siteRoot = basePath === "/" ? "" : basePath.slice(0, -1);

  function resolveRoute(pathname) {
    const fullPath = cleanPath(pathname).replace(/\/index\.html$/, "") || "/";
    let path = fullPath;
    if (siteRoot) {
      if (fullPath === siteRoot) path = "/";
      else if (fullPath.startsWith(`${siteRoot}/`)) path = fullPath.slice(siteRoot.length);
      else return { locale: "en", page: "notFound" };
    }
    const locale = path === "/zh" || path.startsWith("/zh/") ? "zh" : "en";
    const localPath = locale === "zh" ? cleanPath(path.slice(3) || "/") : path;
    const slug = localPath === "/" ? "" : localPath.replace(/^\//, "");
    const page = Object.keys(pagePaths).find((key) => pagePaths[key] === slug) || "notFound";
    return { locale, page };
  }

  function pathFor(page, locale) {
    const slug = pagePaths[page] ?? "";
    const localPath = locale === "zh" ? `zh${slug ? `/${slug}` : ""}` : slug;
    const path = `${basePath}${localPath}`;
    // Directory URLs are canonical on GitHub Pages project sites.
    return siteRoot && localPath ? `${path}/` : path;
  }

  function assetPath(path) {
    return `${basePath}${path.replace(/^\/+/, "")}`;
  }

  return { basePath, resolveRoute, pathFor, assetPath };
}
