# Publication requirements

The public site is [chaldea.vercel.app](https://chaldea.vercel.app), hosted by the `chaldea` project in the Vercel `aleph19` team. It serves checked static output. Production is public; preview deployments retain Vercel Authentication. No runtime API server is required.

## Automatic website updates

In the existing Vercel project's **Settings → Git**, connect `Aleph1-9012/Chaldea`. Use `main` as the production branch and the repository root as the root directory. `vercel.json` selects the Other framework preset and supplies the install and build commands. The root must not be `frontend`, because Rust, schemas, and widgets are sibling directories.

Pushes to `main` build and deploy automatically through Vercel. `scripts/build-vercel.sh` installs the pinned Bun and Rust versions, runs `make setup` and `make check`, then assembles `.vercel/output`. Failed checks stop the build before publication. GitHub Actions checks the same source independently; Vercel runs its own checks rather than waiting for the Actions result. No GitHub deployment token is needed.

Routine website updates do not need package version changes, tags, or GitHub releases. Other Git branches use Vercel preview deployments. Keep the normal Git branch build queue enabled so production builds run sequentially; do not bypass it with concurrent production builds or manual promotion while a build is running.

## Vercel setup and retention

The project ID is `prj_j1kW0OcWUPIaJPK4zP23ylVpeclP` and team ID is `team_CktxYlUSi6kFhrNdcVlUHHkm`. These are identifiers, not credentials. Local `.vercel/` and environment files are ignored by Git.

The public `deployment.json` lists all retained `assets/` and `revisions/` files, with their paths, sizes, and SHA-256 hashes. After checks pass, `frontend/scripts/deployment-history.ts` restores and verifies these files from production. `frontend/scripts/prepare-vercel.ts` combines them with the newly built site and rejects conflicting immutable bytes. The history script then writes a cumulative manifest identifying `VERCEL_GIT_COMMIT_SHA`. Missing or invalid history stops deployment.

Production is the source of retained files. Keep external backups of complete deployed output, including `deployment.json`. If production becomes unavailable, restore the newest complete backup before resuming Git deployments. Never rebuild using only current source, which would omit historical URLs. The initial migration includes immutable files from every existing release archive.

For a staged local deployment, restore history into a new directory, then assemble and record it:

```sh
bun frontend/scripts/deployment-history.ts restore https://chaldea.vercel.app /tmp/chaldea-history
bun frontend/scripts/prepare-vercel.ts /tmp/selected-site /tmp/chaldea-deploy/.vercel/output /tmp/chaldea-history
bun frontend/scripts/deployment-history.ts record /tmp/chaldea-deploy/.vercel/output/static CHECKED_SOURCE_COMMIT
```

Install frozen frontend dependencies before running these scripts. The history and output directories must not exist beforehand. The assembler adds cache and MIME rules without an HTML fallback for missing revision files.

For a rollback, revert the affected source on `main`, keeping the current deployment tooling. Vercel checks and rebuilds the older design while retaining current history. Do not use Vercel Instant Rollback or point the domain at an old deployment that lacks newer revision files.

## GitHub releases

Create a packaged release when a milestone warrants one. Version tags use `vMAJOR.MINOR.PATCH`. Align the frontend and backend package versions, run `make setup` and `make check`, and tag the checked source commit. Do not change content or settings schema versions for a package release.

Each release provides GitHub's source archives and `chaldea-site-VERSION.zip`, containing the complete production `dist/` tree at the archive root. Publish `SHA256SUMS` alongside the archive. Keep generated archives outside Git. Serve the extracted files over HTTP for inspection; opening `index.html` directly does not support catalog and preview requests. Keep existing release archives and checksums as historical backups.

Creating a GitHub release does not trigger website deployment. The live site can contain newer checked commits than the latest packaged release.

## Website verification

1. Run `make setup` and `make check`. The check builds and validates the production artifact. Inspect changed browser interactions and native exports manually in an isolated environment; automatic checks do not establish rendering or desktop behavior.
2. Record the source commit, tool versions, and any native verification. Retain the previous working site, catalog, and complete immutable history.
3. Verify staged revision URLs, MIME types, cache headers, and export assets before promotion. Check anonymous access and file bytes after assigning the public alias.
4. Check a fresh page and an already-open page from the prior deployment. Both must load their referenced revisions and download complete files.
5. Practice restoring prior HTML and catalog while preserving newer revisions. Record the result and restore the intended checked build.

The host must serve revision files at stable public URLs across deployments. A previous deployment visible only in the provider's dashboard does not meet this requirement. There is no automatic revision garbage collection.

## HTTP and privacy configuration

| Files | Required behavior |
| --- | --- |
| `revisions/**` | `Cache-Control: public, max-age=31536000, immutable`; retain across deployments |
| `catalog.json`, `index.html`, `deployment.json` | Revalidate, for example `Cache-Control: no-cache` |
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

On 11 October 2026, patch `v1.0.1` at source commit `bb58a7de54194d3a3e7bbd7eb170685c756fd0a7` was deployed as `dpl_AD5Y3Xq6UEY36UGivSr4etj4vGzD`, then promoted and aliased to the public address. The artifact came from [successful CI run 38152221450](https://github.com/Aleph1-9012/Chaldea/actions/runs/38152221450). Its archive SHA-256 is `0d4421dd4ebd7ed032fd2d4a1d7d2f0e6b29da276ce8e0847faa070940b47092`. The 38-entry catalog and all 628 revision files remained byte-identical to 1.0.0, whose hashed application assets were also retained.

The patch removed the transition's bottom destination strip, reduced its simultaneous SVG masks, and began widget requests during the covering animation. Library plates now allow offscreen rendering to be skipped without lowering thumbnail resolution. In one local Codex Chromium comparison, the longest sampled Home-to-Library frame decreased from 38.1 ms to 23.1 ms. Display scheduling varied between samples, so these observations do not establish performance across devices. Temporary profiling code was removed before release.

Local browser checks covered family switching, later cards, interrupted navigation, scrolling, and a 390 × 844 layout. After deployment, public Home-to-Library and widget navigation, Player-to-All filtering, dummy input, customization, and generated QML worked without observed console warnings or errors. A tab opened on 1.0.0 before promotion also loaded the retained live preview and generated QML afterward. Staged and anonymous public HTTP checks compared the homepage, catalog, bundle, thumbnail, preview HTML, native QML, and prior application JavaScript with the release bytes, and verified MIME types, cache policies, `nosniff`, and missing-revision 404 responses. Complete browser downloads and a production rollback drill were not rerun for this patch.

On 11 October 2026, patch `v1.0.2` at source commit `e8f7530ae0b08c795b7aed370c40b1e3e70cbc79` was deployed as `dpl_7ExaZHTUCdfmT55wsbvPbe77rVdF`. Its artifact came from [successful CI run 38153295375](https://github.com/Aleph1-9012/Chaldea/actions/runs/38153295375), with archive SHA-256 `9352cd4b6d22b8f7e945597074b336f95351155658ef12f602582a81c7a15e26`. The existing block loader now covers bundle loading and the live preview's first render. Controlled local delays verified that it remains until readiness, clears on failure, stops when leaving a widget, and does not restart during customization. Interactive art restored its natural height after loading. Public navigation, preview readiness, and generated QML were checked after promotion. Staged and public file, cache, MIME, and retention checks passed; the catalog and all 628 widget revision files remain unchanged. The alias CLI did not exit after the public site updated; exact public release bytes were verified independently before stopping that local process.

On 11 October 2026, patch `v1.0.3` at source commit `443391d7c4b7ebf18a40702022bf9b9a95d84925` was deployed as `dpl_4WeyTw5FT6DZwCC27Jy2SPCLb5uF`. Its artifact came from [successful CI run 38154939933](https://github.com/Aleph1-9012/Chaldea/actions/runs/38154939933), with archive SHA-256 `ef0d90654b08f0724fb36a58463a408ac6a550e67c05955e0e2e29f341aa65e9`. Customization switches now stretch inside their tracks, and generated-file tabs reuse the library's liquid selection motion. Local checks covered keyboard toggling, rapid changes, overflow files, alignment while scrolling the file strip at 390 pixels wide, and the existing family selector. Production checks confirmed immediate settings and code updates with no observed console warnings or errors. Staged and public file, cache, MIME, and retention checks passed. The catalog and all 628 widget revision files remain unchanged.

## Git deployment migration

On 11 October 2026, the unchanged 1.0.3 site was deployed as `dpl_8C1SwRM2RJ1WtLmu26E3N613DZXv` with a cumulative `deployment.json`. Its 642 immutable files were compared with all four published release archives. Staged and public checks verified the homepage, catalog, manifest, a bundle, thumbnail, preview, native QML, and the original application JavaScript, including bytes, MIME, cache headers, `nosniff`, and missing-revision 404 responses. This bootstraps future builds without creating a release.

The repository supports native Git builds. Connecting the existing Vercel project to the repository remains an owner setup step; automatic Git-triggered deployment has not yet been verified.

The catalog loads summaries and thumbnails; only the selected widget loads its complete revision. Measure loading and interaction on representative devices and the chosen host. Record the source revision, device, browser, and measurements. Automatic checks report structural and export correctness, not visual or performance benchmarks.
