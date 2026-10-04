# Roadmap

Where the library stands, what gets added next, and how to add it. Update this file when a step finishes or the order changes. [Architecture](architecture.md) describes how the system works today; [the authoring guide](widget-guide.md) has the file-level rules.

## Where things stand

The tooling is complete for anonymous browsing, customization, copying, and downloading: one Rust packager, one QML generator, and a browser-free `make check` that discovers every widget. Rust owns source discovery and emits a local source index for frontend authoring tools; production output contains no source index.

All five families have native QML exports: Quick notes, Player, Glyphs, Interactive art, and Lockscreens. The five extracted Glyphs and nine Lockscreens now export native components with their existing IDs and settings keys. Lockscreens provide visual components and demo interactions, with authentication and desktop session locking left to a separate host. [The inventory](widget-inventory.md) has the counts.

Nothing is published. No host, deploy workflow, or rollback drill exists yet.

## Next, in order

1. **Settle source layout before the first publication.** Revision URLs become permanent once published, and a format change after that needs a migration. Until then, moving files, changing `chaldea.toml`, or changing packaging costs nothing.
2. **Publish the native families.** Choose a host that keeps old revision URLs, add `.github/workflows/deploy.yml`, and follow [the publication requirements](publishing.md) through a practiced rollback and a performance measurement.
3. **Build lockscreen authentication only on request.** The visual components are complete. A secure session lock, credential handling, and authentication need a separate design and integration review.
4. **Add new designs** only on the owner's request, each as its own widget entry.

## Adding to the library

Keep one entry per lockscreen layout. Artwork, glyph, background, and motion variations of that layout do not get separate entries. Preserve the retained preview's selected design; future variation controls belong in its settings when the owner requests them. [The lockscreen guide](../widgets/lockscreens/README.md) records the retained previews.

| Addition | What to do |
| --- | --- |
| A design in an existing family | Create its folder with `widget.json`, preview, thumbnail, README, and the files unique to it. Declare the family helpers it uses; they resolve from the category's `_shared/`. |
| The first native export in a family | Keep every file in the widget folder. Write the category `README.md`. |
| The second export needing the same file | Move the file to the category's `_shared/` once it is byte-identical in both. Never share a file that differs. |
| A refinement to a shared component | Copy the file into `quick-notes/refined/` (or the widget being refined) and change the copy. Move it back to `_shared/` only when the owner approves the rollout. |
| A setting | Use the five existing types. Bind it in the preview and in a QML template. Use a plain camelCase key; the `s0…` prefixes on imported settings stay as they are. |
| A setting type or definition field | Change `schemas/`, `backend/src/content.rs` and `validate.rs`, the frontend `catalog/contracts.ts`, `customizer/settings.ts`, and `generator/index.ts`, and `schemas/fixtures/` together, so Rust and the browser keep agreeing. Keep `shared_inputs` in `chaldea.toml` current if generator dependencies move. |
| A source-layout convenience | Implement discovery and resolution in `backend/src/content.rs`. Rust emits the local source index in `backend/src/build.rs`; keep `schemas/source-index.schema.json` and its frontend consumer in agreement if authoring metadata changes. Frontend scripts read that index and packaged revisions. |

A widget's ID is its folder path under `widgets/` with each `/` replaced by `-`: `widgets/player/matrix/` is `player-matrix`. Choose it when the widget is created and keep it if the folder later moves. Retained archive entries keep their existing IDs when ported, including entries moved from Lockscreens to Glyphs. IDs and setting keys are public identities and do not change.

After any change, `make check` must pass. Inspect a changed preview in `make dev`, and a changed export in an isolated Quickshell configuration, before calling it done.

## Deferred, and what would start each

| Deferred | Start when |
| --- | --- |
| Accounts, saved presets, creator uploads | The owner requests them. Uploads also need a separate credential-free preview origin. |
| Watching widget sources | Rerunning `make content` by hand becomes disruptive. |
| Incremental packaging or server-side search | A measurement shows the full rebuild or the catalog is too slow. |
| Sharing a study's `preview/demo.js` | A study is next ported. In several studies, sibling designs differ only in the line that selects the design; that line would move to a per-widget file first, with the owner's approval. |
