# XLR8

A widget library for Quickshell. Browse interactive previews, customize a widget, then copy its QML or download a complete ZIP.

Seven Quick notes widgets have native QML exports. Another 238 designs are available as HTML previews in development. Production builds include only the seven native widgets. No account is required, and customization stays in the current browser tab.

## Quick notes

| Widget | Layout and interactions |
| --- | --- |
| [Cassette](widgets/notes-notes-a-cassette/README.md) | Framed drawer with Bone and Red palettes |
| [Index](widgets/notes-notes-b-index/README.md) | Side index with adjustable width and row height |
| [Console](widgets/notes-notes-c-console/README.md) | Compact editor with a collapsible note list |
| [Ash](widgets/notes-notes-d-ash/README.md) | Expandable memo cards with summaries and line counts |
| [Numbered](widgets/notes-notes-numbered/README.md) | Red drawer with numbered notes |
| [Preview](widgets/notes-notes-preview/README.md) | Drawer with adjustable width and header marker |
| [Refined](widgets/notes-notes-refined/README.md) | Note deletion, empty state, and Undo |

All seven support writing-area height, title size, list spacing, visible rows, note numbering, text counts, and Top/Bottom insertion. Palette presets and custom colors are available. Notes stay in memory until the preview or native component closes; changing appearance or collapsing a drawer preserves them.

Each ZIP includes the QML component, helpers, a `shell.qml` launcher, usage instructions, and its license. Extract the whole ZIP, then run:

```sh
qs -p /absolute/path/to/extracted-widget/shell.qml
```

The tested native baseline is Quickshell 0.3.0 with Qt 6.11.2. The launcher opens a regular window. Desktop placement and integration into an existing shell are up to the host configuration.

## Run locally

Use Linux with a C compiler, GNU Make, and the versions of Rust and Bun pinned in [`rust-toolchain.toml`](rust-toolchain.toml) and [`.bun-version`](.bun-version). Install Rust's `rustfmt` and `clippy` components. Node.js is not required.

```sh
git clone https://github.com/Aleph1-9012/XLR8.git
cd XLR8
make setup
make dev
```

Open <http://127.0.0.1:5175/>. Frontend changes reload through Vite. After editing widget sources, run `make content` in another terminal and reload the page.

`make setup` checks tool versions and installs frontend dependencies with the frozen Bun lockfile. The development catalog includes all 245 designs across notes, players, clipboards, lockscreens, control centers, menus, curtains, glyphs, and interactive art. See the [widget inventory](docs/widget-inventory.md).

HTML drafts have export disabled. Their playback, power, clipboard-history, and unlock actions use sample state. Lockscreen previews do not provide native authentication; use dummy text when trying them.

## Commands

| Command | Result |
| --- | --- |
| `make setup` | Check prerequisites and install frozen dependencies |
| `make content` | Validate and package content, including drafts |
| `make dev` | Build development content and start Vite on port 5175 |
| `make check` | Run Rust, content, TypeScript, unit, and Chromium browser checks |
| `make build` | Build the static site in `dist/`, excluding drafts |
| `make preview` | Serve the production build on port 4173 |
| `make native-check WIDGET=<id>` | Export defaults and limits, lint QML, render, test behavior, and load Quickshell in isolation |

Browser checks use `/usr/bin/chromium` when available. Otherwise, install Playwright's Chromium once:

```sh
cd frontend
bunx --bun playwright install --with-deps chromium
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use another Chromium binary. Native checks also require Quickshell and Qt 6's `qmllint` and `qmltestrunner`. They use offscreen software rendering and never change live desktop configuration.

CI runs the checks and builds a downloadable site artifact. Hosting and automatic deployment are not configured.

## Project structure

- `backend/`: one Rust package for content validation and assembly.
- `frontend/`: one vanilla TypeScript application, QML generator, tests, and export scripts, managed by Bun.
- `widgets/`: widget definitions, previews, QML templates, assets, and licenses.
- `schemas/`: shared JSON schemas and validation fixtures.
- `docs/`: [architecture](docs/architecture.md), [widget authoring](docs/widget-guide.md), [troubleshooting](docs/repair.md), and [publishing](docs/publishing.md).

Keep both lockfiles in version control. Generated output, dependencies, and local test evidence are ignored. A fresh clone builds from the checked-in sources.

The application has no accounts, telemetry, saved visitor state, or creator uploads. A deployed host may keep its own request logs.

## License

The application is licensed under [Apache 2.0](LICENSE). Original widget code and original widget assets use [0BSD](widgets/LICENSE). Third-party material retains its own terms. See [licensing](docs/licensing.md) for the scope and distribution notices.
