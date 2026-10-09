# Widget sources

Source folders use short names grouped by category. Larger collections group by study and design. Public widget IDs stay in each `widget.json`; moving a folder does not change the ID, URL, or exported file names.

```text
widgets/
  _shared/                  LICENSE and preview/support.js for the whole library
  glyphs/
    _shared/qml/            helpers every Glyph design uses unchanged
    branch-grammar/
  interactive-art/
    fish-in-space/
  lockscreens/
    phase-lock/formation/
    editorial/assembly-mark/compound-glyph/
  player/
    README.md               family notes
    matrix/
  quick-notes/
    refined/
```

Each widget owns its `widget.json`, `preview/`, thumbnail, and README, plus `qml/` where implemented. Category and study folders organize sources. The packager stops descending once it finds `widget.json`.

A group's `_shared/` folder supplies files that its widgets use unchanged. A declared source is taken from the widget folder when present, otherwise from the nearest parent `_shared/`. Editing a shared file changes every widget that uses it; copy it into one widget folder to change that widget alone. Each widget's output file list still provides its own copy. `widgets/LICENSE` states the terms for this folder, and `widgets/_shared/LICENSE` is the identical copy included in each widget's output file list.

Run `make check` to validate all widget entries automatically. No per-widget test registration or scope flags are needed. Use `make test` for quick unit reruns. See the [widget inventory](../docs/widget-inventory.md) for all entries and the [authoring guide](../docs/widget-guide.md) for content rules.
