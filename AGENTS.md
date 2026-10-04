# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Locked Product Direction

- The selected visual source is `../assets/design-concepts/round-4/homepage-option-3.png`, the third displayed result from the latest ideation round.
- Preserve its light editorial composition, deep navy typography, restrained orange accent, authentic air-cargo photography, generous whitespace, alternating image/text service rows, airport-code rail, and dark contact band.
- Use a stable system sans-serif stack for English and Simplified Chinese in the implementation. Do not introduce unverified slogans, prices, transit-time promises, certifications, partner logos, customer figures, contact details, or geographic maps.
- The site is a bilingual company-and-services presentation prototype only. It does not include ordering, rate lookup, tracking, accounts, persistence, or a real form backend.

## Publication

- The user approved creating the public GitHub repository `zhx-CN/ever-flame-logistics` and publishing the website with GitHub Pages on 2026-10-04.
- This directory is the repository root. The Pages workflow builds `dist/github-pages/` and obtains its base path from `actions/configure-pages`.
- Preserve all bilingual directory entry points when changing routes so shared inner-page links and refreshes keep working on static hosting.
