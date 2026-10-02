# Tsugumori / Magnetic powder

The owner-supplied design now has an interactive browser preview and a native QML export. Both use the same simulation and drawing rules in `ArtEngine.js`.

## Run

Download and extract the complete ZIP. Keep `Widget.qml`, its QML helpers, and `ArtEngine.js` together. With Quickshell 0.3.0 and Qt 6.11.2 installed, run:

```sh
qs -p /absolute/path/to/the/extracted-folder/shell.qml
```

The launcher opens a regular, resizable window and scrolls when the controls need more room. It uses Qt Quick, Qt Quick Controls Basic, and Qt Quick Layouts. To embed the component in a QML layout:

```qml
import "./magnetic-powder" as Art

Art.Widget {
    width: 740
}
```

The artwork adapts to the component width. Font families use installed fonts with system fallback. No remote assets are requested.

## Interaction and settings

Drag either pole across the plate or use Magnet, X position, and Y position to move it. Flip the selected pole, add or remove a third magnet, or Shake to disturb the powder. Compact canvas changes the scene height. Paused scenes still redraw when controls change.

Use the controls inside the artwork. Pause freezes continuous motion while leaving controls usable. The browser starts paused when reduced motion is preferred. In native QML, set `paused: true` or use the pause control. Hiding a native component stops its animation and releases pointer drags.

Appearance changes and Reset preserve the current scene and collections. All interaction state stays in memory for the component’s lifetime. Leaving the browser preview or closing the native component resets it. Copied QML and ZIP downloads contain the same settings snapshot; they do not include the current scene or collections.

## Host integration

`paused`, `running`, and `statusText` expose the component’s current state. The native template binds Chaldea settings to the component. `ArtEngine.js` contains this design’s original drawing and interaction logic, shared with the browser host. Chaldea’s frontend generator creates the QML template output.

## Source and license

The design is from `Lib-assests/interactive-art/tsugumori-eight-play-studies.html`. It remains its own widget entry; the source archive is unchanged.

Source SHA-256: `32346a91f1ca8662f70729f4684fc8bd49ef8958f4b1aa66ad85f31835aaca90`.

Original drawing rules, preview code, and native implementation use 0BSD. The download includes `LICENSE`.
