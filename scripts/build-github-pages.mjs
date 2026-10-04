import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { content, pagePaths } from "../src/content.js";
import { createSitePaths } from "../src/routing.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
let requestedBase = process.env.PAGES_BASE_PATH ?? "/";
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--base" && args[index + 1]) requestedBase = args[++index];
  else if (args[index].startsWith("--base=")) requestedBase = args[index].slice(7);
  else throw new Error(`Unknown argument: ${args[index]}. Use --base /repository-name/.`);
}

const sitePaths = createSitePaths(requestedBase);
await build({ root, mode: "github-pages", base: sitePaths.basePath });

const output = path.join(root, "dist", "github-pages");
const shell = await readFile(path.join(output, "index.html"), "utf8");
const escapeHtml = (text) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const routes = [];

for (const locale of ["en", "zh"]) {
  for (const [page, slug] of Object.entries(pagePaths)) {
    const folder = locale === "zh" ? path.join("zh", slug) : slug;
    const directory = path.join(output, folder);
    const [title, description] = content[locale].seo[page];
    const html = shell
      .replace('<html lang="en">', `<html lang="${locale === "zh" ? "zh-CN" : "en"}">`)
      .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/, `<meta name="description" content="${escapeHtml(description)}" />`);

    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "index.html"), html, "utf8");
    routes.push({ page, locale, href: sitePaths.pathFor(page, locale), file: `${folder.replaceAll(path.sep, "/")}${folder ? "/" : ""}index.html` });
  }
}

// Known routes have physical directories: direct links and refreshes return 200
// even when the host has no SPA fallback. Unknown routes render the app's 404.
await writeFile(path.join(output, "404.html"), shell, "utf8");
await writeFile(path.join(output, ".nojekyll"), "", "utf8");
await writeFile(path.join(output, "pages-manifest.json"), JSON.stringify({ basePath: sitePaths.basePath, routes }, null, 2) + "\n", "utf8");
console.log(`GitHub Pages build ready: ${output}`);
console.log(`Base path: ${sitePaths.basePath}; static route entries: ${routes.length}`);
