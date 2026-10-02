# Publication requirements

The repository builds a static site and has a CI workflow. No public host, domain, or deployment credentials have been chosen. Add `.github/workflows/deploy.yml` after the host is configured. Current local checks do not establish CDN behavior or a completed production rollback drill.

## Release sequence

1. Run `make setup`, `make check SCOPE=all`, the relevant native checks, and `make build`. Smoke-test the actual `dist/` artifact with `bun scripts/check-dist.ts` in `frontend/`. Automatic CI runs browser-free checks and the build; manually run **Check and build** with its browser option enabled for the complete browser and production smoke checks.
2. Retain the previous working website and catalog. Record the source commit, tool versions, and native verification for the candidate.
3. Upload the candidate's complete `revisions/<id>/<revision>/` trees to persistent storage. Never overwrite an existing revision with different bytes or delete previous published revisions during a sync.
4. Verify the new revision URLs, MIME types, and export assets before activating the website/catalog artifact. Keep activation as one release operation.
5. Check a fresh page and an already-open page from the prior release. Both must load their referenced revisions and download complete files.
6. Practice restoring the prior website/catalog while preserving the newer revisions. Record the result and restore the intended release.

The host must serve revisions from stable public URLs across deployments. A previous deployment visible only in the provider's dashboard does not meet this requirement. The first version has no automatic revision garbage collection.

## HTTP and privacy configuration

| Files | Required behavior |
| --- | --- |
| `revisions/**` | `Cache-Control: public, max-age=31536000, immutable`; retain across releases |
| `catalog.json`, `index.html` | Revalidate, for example `Cache-Control: no-cache` |
| Vite's hashed application assets | Long immutable caching; retain with rollback artifacts |
| HTML, JS, JSON, SVG, WebP | Correct MIME type and `X-Content-Type-Options: nosniff` |

Serve over HTTPS so Clipboard and random preview tokens work. Preview iframes need scripts, but must keep their opaque origin. Check any site-wide content security policy against that design and the preview's own policy.

Use no third-party fonts, analytics, cookies, or error reporting. The application stores settings in memory only. Review and document the chosen provider's request-log retention, IP handling, and analytics defaults before making broader privacy claims.

## Performance and evidence

The catalog loads summaries and WebP thumbnails. Only the selected widget loads full templates and export assets; only one preview runs. Browser checks write a local control-to-code timing sample using an internal contract fixture to `build/evidence/responsiveness.json`. This fixture is never included in the library.

That automated timing is a development-machine sample, not a representative-device benchmark. Before public launch, measure input-to-preview and input-to-code latency on the intended low-end device, with network throttling and the hosted site. Keep the device, browser, sample count, and percentile measurements with the release notes. Add search services or incremental packaging only when measurements justify them.
