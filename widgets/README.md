# Widget sources

Source folders use short names grouped by category. Larger collections group by study and design. Public widget IDs stay in each `widget.json`; moving a folder does not change the ID, URL, or download name.

```text
widgets/
  clipboard/
    flow/
    controls/black-bands/
  curtains/
    red-field/
  glyphs/
    branch-grammar/
  interactive-art/
    fish-in-space/
  lockscreens/
    phase-lock/formation/
    layouts/aperture/compound-glyph/
  player/
    matrix/
  quick-notes/
    refined/
```

Each widget owns its `widget.json`, `preview/`, thumbnail, README, and license, plus `qml/` and `native/` where implemented. Category and study folders only organize sources. The packager stops descending once it finds `widget.json`.

Use `make check WIDGET=glyphs/branch-grammar` for one design or `make check GROUP=glyphs` for a category. Existing IDs also work. See the [widget inventory](../docs/widget-inventory.md) for all entries and the [authoring guide](../docs/widget-guide.md) for content rules.
