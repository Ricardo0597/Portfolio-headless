<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project rules (Portfolio Tech Lab)

- The app runs under `basePath: '/headless'` behind the Drupal site's nginx (DDEV). Fetch Drupal with
  relative `/jsonapi/...` URLs; never hardcode a host.
- Keep logic that can be pure in `src/lib/` (JSON:API normalisation, ranking) and test it there; hooks
  only manage state.
- Every async path needs an error state the visitor can retry. No spinner may wait forever: model loading
  has a timeout (`MODEL_TIMEOUT_MS`).
- Tests: `npm test` (Vitest + Testing Library + jsdom). Mock `@huggingface/transformers`; tests must never
  download the model or call Drupal.
- Before committing: `npm test`, `npm run build` and `npm audit --omit=dev` must be clean.
- Pin new dependencies to exact versions. The dev server also runs in DDEV's `nodejs` container (Node 20), so test
  tooling must support Node 20.
- Commits follow Conventional Commits; no `Co-Authored-By` trailers.
