# Roadmap

Where the library stands, what gets added next, and how to add it. Update this file when a step finishes or the order changes. [Architecture](architecture.md) describes how the system works today; [the authoring guide](widget-guide.md) has the file-level rules.

## Where things stand

The tooling is complete for anonymous browsing, customization, copying, and downloading: one Rust packager, one QML generator, and a browser-free `make check` that discovers every widget.

Four families have native QML exports: Quick notes, Player, Glyphs, and Interactive art. Clipboard, Curtains and buttons, and Lockscreens are HTML drafts. [The inventory](widget-inventory.md) has the counts.

Nothing is published. No host, deploy workflow, or rollback drill exists yet.

## Next, in order

1. **Settle source layout before the first publication.** Revision URLs become permanent once published, and a format change after that needs a migration. Until then, moving files, changing `chaldea.toml`, or changing packaging costs nothing.
2. **Publish the native families.** Choose a host that keeps old revision URLs, add `.github/workflows/deploy.yml`, and follow [the publication requirements](publishing.md) through a practiced rollback and a performance measurement.
3. **Port drafts to native QML one family at a time.** A family is done when every design in it exports, its README is written, and its native inspection is recorded. Lockscreen exports are visual components until native authentication is designed as its own piece of work.
4. **Add new designs** only on the owner's request, each as its own widget entry.

## Adding to the library

| Addition | What to do |
| --- | --- |
| A design in an existing family | Create its folder with `widget.json`, preview, thumbnail, README, and the files unique to it. Declare the family helpers it uses; they resolve from the category's `_shared/`. |
| The first native export in a family | Keep every file in the widget folder. Write the category `README.md`. |
| The second export needing the same file | Move the file to the category's `_shared/` once it is byte-identical in both. Never share a file that differs. |
| A refinement to a shared component | Copy the file into `quick-notes/refined/` (or the widget being refined) and change the copy. Move it back to `_shared/` only when the owner approves the rollout. |
| A setting | Use the five existing types. Bind it in the preview and in a QML template. Use a plain camelCase key; the `s0…` prefixes on imported settings stay as they are. |
| A setting type or definition field | Change `schemas/`, `backend/src/content.rs` and `validate.rs`, the frontend `catalog/contracts.ts`, `customizer/settings.ts`, and `generator/index.ts`, and `schemas/fixtures/` together, so Rust and the browser keep agreeing. Keep `shared_inputs` in `chaldea.toml` current if generator dependencies move. |
| A source-layout convenience | Implement it in `backend/src/content.rs`. Frontend scripts read packaged revisions; only the folder discovery in `frontend/scripts/widget-sources.ts` mirrors Rust and changes if the rule for finding widget folders does. |

A widget's ID is its folder path under `widgets/` with each `/` replaced by `-`: `widgets/player/matrix/` is `player-matrix`. Choose it when the widget is created and keep it if the folder later moves. The four native families follow this rule. Draft IDs from the archive import keep their old form until the drafts that stay are decided; give a draft its path-derived ID when it is ported. Once published, IDs and setting keys are public identities and do not change.

After any change, `make check` must pass. Inspect a changed preview in `make dev`, and a changed export in an isolated Quickshell configuration, before calling it done.

## Deferred, and what would start each

| Deferred | Start when |
| --- | --- |
| Accounts, saved presets, creator uploads | The owner requests them. Uploads also need a separate credential-free preview origin. |
| Watching widget sources | Rerunning `make content` by hand becomes disruptive. |
| Incremental packaging or server-side search | A measurement shows the full rebuild or the catalog is too slow. |
| Sharing a study's `preview/demo.js` | A study is next ported. In several studies, sibling designs differ only in the line that selects the design; that line would move to a per-widget file first, with the owner's approval. |
