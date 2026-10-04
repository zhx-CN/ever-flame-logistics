import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { companyConfig, content, pagePaths } from "../src/content.js";
import { createSitePaths, normalizeBasePath } from "../src/routing.js";

test("local and project-site links preserve every bilingual page", () => {
  for (const base of ["/", "/ever-flame-logistics/", "/other-repo", "/preview/nested/"]) {
    const paths = createSitePaths(base);
    for (const page of Object.keys(pagePaths)) {
      for (const locale of ["en", "zh"]) {
        const href = paths.pathFor(page, locale);
        assert.ok(href.startsWith(paths.basePath));
        assert.deepEqual(paths.resolveRoute(href), { page, locale });
        assert.deepEqual(paths.resolveRoute(href.replace(/\/$/, "")), { page, locale });
        const htmlPath = `${href.replace(/\/$/, "")}/index.html`;
        assert.deepEqual(paths.resolveRoute(htmlPath), { page, locale });
      }
    }
    assert.equal(paths.assetPath("images/hero-air-cargo-loading.png"), `${paths.basePath}images/hero-air-cargo-loading.png`);
  }
  assert.equal(createSitePaths("/").pathFor("contact", "zh"), "/zh/contact");
});

test("project routes cannot accidentally resolve paths outside their repository", () => {
  const paths = createSitePaths("/ever-flame-logistics/");
  assert.equal(paths.resolveRoute("/about").page, "notFound");
  assert.equal(paths.resolveRoute("/ever-flame-logistics-other/about").page, "notFound");
  assert.equal(paths.resolveRoute("/ever-flame-logistics/unknown").page, "notFound");
  assert.doesNotThrow(() => paths.resolveRoute("/ever-flame-logistics/%E0%A4%A"));
  for (const base of ["https://example.com/", "/../repo/", "/repo?query=1", "/repo#hash", "/repo\\path"]) {
    assert.throws(() => normalizeBasePath(base));
  }
});

test("production pages work on a static host without a history fallback", async (t) => {
  const output = fileURLToPath(new URL("../dist/github-pages/", import.meta.url));
  const manifest = JSON.parse(await readFile(path.join(output, "pages-manifest.json"), "utf8"));
  const paths = createSitePaths(manifest.basePath);
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://localhost").pathname;
      if (!pathname.startsWith(paths.basePath)) {
        response.writeHead(404).end();
        return;
      }
      const relative = decodeURIComponent(pathname.slice(paths.basePath.length));
      let target = path.resolve(output, relative);
      if (target !== output.replace(/[\\/]$/, "") && !target.startsWith(path.resolve(output) + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      const info = await stat(target);
      if (info.isDirectory()) {
        if (!pathname.endsWith("/")) {
          response.writeHead(301, { location: `${pathname}/` }).end();
          return;
        }
        target = path.join(target, "index.html");
      }
      const body = await readFile(target);
      response.writeHead(200).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    server.closeAllConnections();
    server.close();
    await once(server, "close");
  });
  const origin = `http://127.0.0.1:${server.address().port}`;

  assert.equal(manifest.routes.length, Object.keys(pagePaths).length * 2);
  for (const { page, locale, href } of manifest.routes) {
    const response = await fetch(origin + href);
    assert.equal(response.status, 200, `${locale}/${page}: direct request`);
    const html = await response.text();
    assert.match(html, /id="root"/);
    assert.ok(html.includes(`<html lang="${locale === "zh" ? "zh-CN" : "en"}">`));
    assert.ok(html.includes(companyConfig.brand));
    assert.ok(html.includes(content[locale].seo[page][0].replaceAll("&", "&amp;")));
    assert.deepEqual(paths.resolveRoute(new URL(response.url).pathname), { page, locale });
    for (const match of html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"#?]+)"/g)) {
      assert.ok(match[1].startsWith(paths.basePath));
      assert.equal((await fetch(origin + match[1])).status, 200, match[1]);
    }
    const refreshed = await fetch(origin + href);
    assert.equal(refreshed.status, 200, `${locale}/${page}: refresh`);
  }
  for (const file of ["hero-air-cargo-loading.png", "airport-to-airport.png", "door-to-door.png", "cargo-warehouse.png"]) {
    const response = await fetch(origin + paths.assetPath(`images/${file}`));
    assert.equal(response.status, 200, file);
    assert.ok((await response.arrayBuffer()).byteLength > 1000, file);
  }
  assert.equal((await fetch(origin + paths.assetPath("images/missing.png"))).status, 404);
  assert.equal((await fetch(origin + paths.assetPath("unknown-page/"))).status, 404);
  assert.equal((await fetch(origin + paths.assetPath("404.html"))).status, 200);
  await stat(path.join(output, ".nojekyll"));
});
