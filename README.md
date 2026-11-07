![Chaldea homepage showing 42 widgets and library navigation](docs/assets/chaldea-hero-laptop.jpg)

# Chaldea

Chaldea is an interactive widget library for Quickshell. Try a design in your browser, adjust its appearance, and export native QML for your Linux desktop.

[Browse the live library](https://chaldea.vercel.app/?page=library) · [Read the docs](docs/roadmap.md) · [Download a packaged release](https://github.com/Aleph1-9012/Chaldea/releases/latest)

The live collection has **42 widgets across five families**, all with native QML exports. It includes quick notes, media players, animated glyphs, interactive art, and eleven slider designs. See the [inventory](docs/widget-inventory.md) for individual designs and source provenance.

Packaged releases contain the source and a prebuilt static site snapshot. The live site follows updates to `main` and may include newer changes than the latest release.

## Features

- Search by name, filter by family, and try widgets in live previews.
- Adjust colors, typography, layout, and motion through each widget's available settings.
- Browse on desktop or phone, with customization controls beside or below the preview.
- Try slider tracks that bend, rotate, or shift as you drag, with vector previews and thumbnails that remain sharp when enlarged.
- Copy generated QML or download individual output files, supporting assets, and licenses.
- Browse and customize without an account or saved customization state.

The hosted site uses Vercel Web Analytics for visitor and page-view counts. Search text and customization values are excluded. See [analytics and privacy](docs/publishing.md#web-analytics).

## Screenshots

The library offers family filters, search, and previews of each widget.

![Chaldea library with family filters and widget cards](docs/assets/chaldea-library.jpg)

Open a widget to try it live and adjust its settings. This is [Braid](https://chaldea.vercel.app/?widget=sliders-braid), with its live preview, grouped settings, and previous/next navigation.

![Braid slider with its live preview, customization controls, and widget navigation](docs/assets/chaldea-customization.jpg)

Screenshots were captured from the live site on 7 November 2026 at 2× pixel density.

## Widget families

| Family | Widgets | What it provides |
| --- | ---: | --- |
| [Glyphs](widgets/glyphs/README.md) | 11 | Drawings that respond to dummy input, deletion, and motion controls. |
| [Interactive art](widgets/interactive-art/README.md) | 9 | Interactive canvases, including Sea turtle and Fish murmuration, with live controls beside the preview. |
| [Quick notes](widgets/quick-notes/README.md) | 6 | Compact note widgets with editing, selection, and in-memory note state. |
| [Player](widgets/player/README.md) | 5 | Media controls and artwork, with MPRIS integration in native exports. Browser previews use silent sample tracks. |
| [Sliders](widgets/sliders/README.md) | 11 | Percentage controls with distinct track patterns, direct pointer and keyboard input, and adjustable appearance. |

The slider collection includes Comb, Slats, Stipple Blade, Weave, Louvers, Membrane, Braid, Fuse, Lattice, Field, and Interference. Each exports a value and user-change signal for your host application to connect to volume, brightness, or another control.

Glyph previews do not authenticate or lock the desktop session. Those integrations belong in a separate host. Native requirements are listed in each widget's README; the shared Quickshell and Qt baseline is in [chaldea.toml](chaldea.toml).

## Use the library

1. Browse the collection and try a widget in its preview.
2. Adjust its available settings to fit your setup.
3. Choose an output file, then copy its text or download that file.

Save every file in the output selector: the generated QML, supporting files, the `shell.qml` preview launcher, `README.md`, and the applicable license. Preserve the listed file names and subfolders, including fonts, artwork, and shaders. Follow the widget's README to try it or integrate it into your Quickshell configuration.

Settings and preview state stay in memory and reset when the preview is left or the page reloads.

## Browse locally

The public library runs at [chaldea.vercel.app](https://chaldea.vercel.app). You can also build and browse it locally.

Local setup requires GNU Make, a C compiler, and the pinned [Rust](rust-toolchain.toml) and [Bun](.bun-version) versions.

```sh
git clone https://github.com/Aleph1-9012/Chaldea.git
cd Chaldea
make setup
make dev
```

Open [localhost:5175](http://127.0.0.1:5175/) to browse the library.

`make dev` runs the Rust content packager, then Vite serves the site with the generated catalog and revision bundles. Frontend edits update through Vite. After editing files under `widgets/`, run `make content` and reload to use the new revisions.

## Development commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `make setup` | Check pinned tool versions and install frozen frontend dependencies. |
| `make dev` | Package local widgets and start the development server on port 5175. |
| `make content` | Rebuild packaged widgets after source changes. |
| `make check` | Run unit and code checks, build the site, and validate every widget and export. |
| `make test` | Rerun the Rust and Bun unit tests. |
| `make build` | Build the production site in `dist/`, excluding drafts. |
| `make preview` | Serve the existing production build on port 4173. |

`make check` already builds the production site. CI runs the same check and saves `dist/` as the `chaldea-site` artifact. Vercel's Git integration builds pushes to `main`, runs the same checks, and publishes the site while retaining previous widget revisions and application assets. Website updates do not require a version bump or GitHub release. See [deployment setup](docs/publishing.md). No browser is installed or launched by the checks.

The library checker discovers new widgets automatically and validates preview script syntax and declared assets, settings, generated files and asset bytes, and the production catalog. Inspect changed layouts and interactions in `make dev`; inspect changed native exports in an isolated Quickshell configuration.

## Project structure

The frontend uses Svelte 5 and TypeScript, built with Vite and managed with Bun. Rust validates and packages widget content at build time. The browser generates QML locally, so the site needs no separate runtime API server.

| Path | Contents |
| --- | --- |
| `backend/` | Rust source discovery, validation, and content packaging. |
| `frontend/` | Svelte 5 and TypeScript site, catalog client, QML generator, authoring scripts, and unit tests. |
| `widgets/` | Widget definitions, browser previews, native components, assets, and usage guides. |
| `schemas/` | Shared JSON contracts and cross-language fixtures. |
| `docs/` | Architecture, development, authoring, publication, and provenance records. |

Rust reads widget sources and packages revisions for the frontend. The browser and export scripts use the same QML generator. Widget folders declare the files they need; byte-identical helpers can resolve from a parent group's `_shared/` folder.

Generated content, build output, caches, and dependencies are ignored by Git. Keep `build/`, `dist/`, `backend/target/`, and `frontend/node_modules/` out of commits; change their sources and rebuild.

## Contributing

Follow the [roadmap](docs/roadmap.md) for planned work and the [widget authoring guide](docs/widget-guide.md) for adding designs or settings. Use the [development guide](docs/repair.md) for troubleshooting and manual export commands, and the [architecture guide](docs/architecture.md) for the packaging and preview contracts.

For production updates, follow the [publication requirements](docs/publishing.md), including retaining published revision URLs and verifying rollback.

## Support

If Chaldea is useful to you, you can support its development on [Ko-fi](https://ko-fi.com/aleph1_9012).

## License

The application is licensed under [Apache 2.0](LICENSE). Original widget code and assets use [0BSD](widgets/LICENSE). Third-party material retains its own terms. See [licensing](docs/licensing.md) for details.
