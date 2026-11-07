# Fuse

Fine square fragments merge into a solid track as the percentage rises, with a local response to contact. Adapted from the owner's `Lib-assests/chaldea assets/fuse.html` as its own browser and native QML control.

## Use

Save all exported files together, including `Track.js`, the font, README, and licenses. Run `qs -p /path/to/export/shell.qml` with Quickshell 0.3.0 or newer and Qt 6.11.2 or newer.

The control exposes `value` from 0 to 100 and emits `moved(value)` for user edits. Bind it to a host model when connecting audio, brightness, or another percentage. The supplied launcher keeps its value in memory and does not change desktop settings.

```qml
Widget {
    value: model.level
    onMoved: value => model.level = value
}
```

The default is 47% in a 344 × 84 pixel control. Customize label, initial level, colors, width, and contact response. Appearance changes preserve the browser's live level; editing Initial level resets it. Drag or use arrows, Home, End, Page Up, and Page Down. Pressing or keyboard focus activates the contact response, which relaxes when released or unfocused.

Browser SVG and native Qt Quick vector paths use the same geometry in `Track.js`. Tracks are clipped to their bounds while the blade remains visible at both endpoints. The live preview magnifies up to 2.5× without enlarging a cached bitmap. The SVG library thumbnail has outlined lettering and no raster image or external font dependency. Native exports retain their configured dimensions.

Original widget code is 0BSD. JetBrains Mono uses the SIL Open Font License in `assets/OFL.txt`.
