# Publication requirements

The public site is [chaldea.vercel.app](https://chaldea.vercel.app), hosted by the `chaldea` project in the Vercel `aleph19` team. It serves prebuilt static files from GitHub release archives. Production is public; preview deployments retain Vercel Authentication. No runtime API server is required.

## GitHub releases

Version tags use `vMAJOR.MINOR.PATCH`. Align the frontend and backend package versions, run `make setup` and `make check`, and tag the checked source commit. Do not change content or settings schema versions for a package release.

Each release provides GitHub's source archives and `chaldea-site-VERSION.zip`, containing the complete production `dist/` tree at the archive root. Publish `SHA256SUMS` alongside the site archive. Keep generated archives outside Git. Serve the extracted files over HTTP for local inspection; opening `index.html` directly does not support the catalog and preview requests.

A GitHub release does not automatically deploy the website. Use the manual deployment workflow or the equivalent staged CLI sequence below.

## Vercel setup and retention

The project ID is `prj_j1kW0OcWUPIaJPK4zP23ylVpeclP` and team ID is `team_CktxYlUSi6kFhrNdcVlUHHkm`. These are identifiers, not credentials. Local `.vercel/` and environment files are ignored by Git.

Before running `.github/workflows/deploy.yml`, configure the GitHub `production` environment with a required reviewer and a deployment branch rule restricted to `main`. Add a scoped Vercel token directly as its `VERCEL_TOKEN` secret. The repository variables `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` already contain the identifiers above. The token must never be committed or pasted into release notes. The initial deployment used an authenticated local CLI; the workflow has not been run with a production token.

Dispatch **Deploy released site** from `main` and select a published tag such as `v1.0.0`. The workflow downloads every published stable release archive with pagination, verifies checksums, rejects unsafe archive entries, and assembles the selected site with all retained `revisions/` and `assets/`. Duplicate immutable paths with different bytes stop deployment. Keep every published archive and checksum; they are the durable source of revision history.

The assembler also works with extracted local archives:

```sh
bun frontend/scripts/prepare-vercel.ts /tmp/selected-site .vercel/output /tmp/previous-site
```

The output directory must not already exist. Omit previous directories only for the first release; later deployments must include all published history. It adds cache and MIME rules without an HTML fallback for missing revision files.

With the intended project linked and verified, use Vercel CLI 63.1.2 to stage `.vercel/output` with `vercel deploy --prebuilt --prod --skip-domain --no-wait`. Inspect the returned deployment with `vercel inspect <url> --wait`, verify its files with `vercel curl`, then run `vercel promote <url>` and `vercel alias set <url> chaldea.vercel.app`. The requested address is an explicit deployment alias, so reassign it after every promotion. The project's additional generated domain is `chaldea-theta.vercel.app`.

Rollback uses the same workflow with an older release tag. It combines that release's HTML and catalog with **all** retained revisions and assets, including newer releases. Do not use Vercel Instant Rollback or point the alias at an old deployment that lacks newer revision files.

## Website publication sequence

1. Run `make setup` and `make check`. This already builds and validates the production artifact. Inspect changed browser interactions and any native exports manually in an isolated environment; the automatic checks do not establish rendering or desktop behavior.
2. Retain the previous working website and catalog. Record the source commit, tool versions, and native verification for the candidate.
3. Assemble the candidate with every retained release's complete `revisions/<id>/<revision>/` trees and hashed application assets. Never overwrite an existing revision with different bytes or omit published history.
4. Stage production without assigning domains, then verify revision URLs, MIME types, and export assets on that staged deployment. Promote it and reassign the public alias to activate the complete website/catalog/revision set together.
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

The application uses no third-party font requests, analytics SDK, cookies, or error-reporting integration. It stores settings in memory only. Vercel still handles operational request data as the hosting provider; do not describe hosting as having zero logs or zero IP processing. Project analytics identifiers alone do not establish visitor tracking, and no analytics script was added for deployment. Account-specific log retention and provider privacy terms need review before broader privacy claims.

## First deployment evidence

On 11 October 2026, release `v1.0.0` at source commit `1645970f3ccc990668755d5caa3b615b54da11d6` was deployed as `dpl_8XZ8zMTewi1XetZMqycyA1dsFVWA`. Its artifact came from [successful CI run 38147691201](https://github.com/Aleph1-9012/Chaldea/actions/runs/38147691201), using pinned Rust 1.97.1 and Bun 1.4.2. The site archive SHA-256 is `3ecb0ad2e66fe44c3e79e6cf29a089286edac40458b61bfed5feedd833faf8f7`.

Staged HTTP checks compared the homepage, 38-entry catalog, a widget bundle, preview HTML, and native QML asset with the release bytes. MIME types, cache headers, `nosniff`, and a missing revision's 404 were verified. Public HTTP access returned 200 after production authentication settings propagated. A warm homepage request from the development machine measured about 109 ms to first byte; this is one request, not a general performance benchmark.

The hosted site was checked in the Codex Chromium browser at 1280 × 720 and 390 × 844. Home-to-library navigation, search, a live Branch Grammar preview, dummy input, setting updates, and generated QML worked. The download button reported that the download started; the browser automation did not return a completed download file. No browser console errors were observed. The static deployment's runtime error-log query returned no logs.

There was no earlier hosted release for a production rollback or prior-release open-tab drill. The assembler's tests verify retaining newer revisions when selecting older HTML/catalog files. Native desktop rendering and broad device-performance measurements were not rerun for this hosting-only change.

## Performance and evidence

The catalog loads summaries and thumbnails; only the selected widget loads its complete revision. Before public launch, measure loading and interaction on representative devices and the chosen host. Record the source revision, device, browser, and measurements. Automatic checks report structural and export correctness, not visual or performance benchmarks.
