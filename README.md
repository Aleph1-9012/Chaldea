# Chaldea

A widget library for Quickshell. Browse interactive previews, customize their appearance, and copy or download widgets for your desktop.

All current catalog entries have native QML downloads. The site runs locally and builds as static files; a public deployment is not configured yet. See the [inventory](docs/widget-inventory.md) for the current designs and counts.

## Widget families

| Family | What it provides |
| --- | --- |
| [Quick notes](widgets/quick-notes/README.md) | Compact note widgets with editing, selection, and in-memory note state. |
| [Player](widgets/player/README.md) | Media controls and artwork, with MPRIS integration in native exports. Browser previews use silent sample tracks. |
| [Glyphs](widgets/glyphs/README.md) | Drawings that respond to dummy input, deletion, and motion controls. |
| [Interactive art](widgets/interactive-art/README.md) | Interactive canvases with live controls and collections in the customization panel. |
| [Lockscreens](widgets/lockscreens/README.md) | One entry per layout, with native visual components and demo interactions. |

Lockscreen and Glyph previews do not authenticate or lock the desktop session. Those integrations belong in a separate host. Native requirements are listed in each widget's README; the shared Quickshell and Qt baseline is in [chaldea.toml](chaldea.toml).

## Use the library

1. Browse the collection and try a widget in its preview.
2. Adjust its available settings to fit your setup.
3. Choose an output file, then copy its text or download that file.

Save every file in the output selector: the generated QML, supporting files, the `shell.qml` preview launcher, `README.md`, and the applicable license. Preserve the listed file names and subfolders, including any images or audio. Follow the widget's README to try it or integrate it into your Quickshell configuration.

Browsing, customization, copying, and downloading require no account. Settings and preview state stay in memory and reset when the preview is left or the page reloads. The application has no telemetry or saved visitor state.

## Browse locally

Local setup requires GNU Make, a C compiler, and the pinned [Rust](rust-toolchain.toml) and [Bun](.bun-version) versions.

```sh
git clone https://github.com/Aleph1-9012/Chaldea.git
cd Chaldea
make setup
make dev
```

Open [localhost:5175](http://127.0.0.1:5175/) to browse the library.

The Svelte 5 site runs at `http://127.0.0.1:5175/`. The original backend preview UI remains at `http://127.0.0.1:5175/?workbench` during development. Frontend edits update through Vite. After editing files under `widgets/`, run `make content` and reload the page to rebuild the packaged previews.

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

`make check` already builds the production site. CI runs the same check and saves `dist/` as the `chaldea-site` artifact; it does not deploy it. No browser is installed or launched by the checks.

The library checker discovers new widgets automatically and validates preview script syntax and declared assets, settings, generated files and asset bytes, and the production catalog. Inspect changed layouts and interactions in `make dev`; inspect changed native exports in an isolated Quickshell configuration.

## Project structure

| Path | Contents |
| --- | --- |
| `backend/` | Rust source discovery, validation, and content packaging. |
| `frontend/` | Svelte 5 and TypeScript site, development workbench, shared QML generator, authoring scripts, and unit tests. |
| `widgets/` | Widget definitions, browser previews, native components, assets, and usage guides. |
| `schemas/` | Shared JSON contracts and cross-language fixtures. |
| `docs/` | Architecture, development, authoring, publication, and provenance records. |

Rust reads widget sources and packages revisions for the frontend. The browser and export scripts use the same QML generator. Widget folders declare the files they need; byte-identical helpers can resolve from a parent group's `_shared/` folder.

Generated content, build output, caches, and dependencies are ignored by Git. Keep `build/`, `dist/`, `backend/target/`, and `frontend/node_modules/` out of commits; change their sources and rebuild.

## Contributing

Follow the [roadmap](docs/roadmap.md) for planned work and the [widget authoring guide](docs/widget-guide.md) for adding designs or settings. Use the [development guide](docs/repair.md) for troubleshooting and manual export commands, and the [architecture guide](docs/architecture.md) for the packaging and preview contracts.

Before the first public deployment, follow the [publication requirements](docs/publishing.md), including retaining published revision URLs and verifying rollback.

## License

The application is licensed under [Apache 2.0](LICENSE). Original widget code and assets use [0BSD](widgets/LICENSE). Third-party material retains its own terms. See [licensing](docs/licensing.md) for details.
