# Tsugumori / Mechanical rhythm

The owner-supplied design now has an interactive browser preview and a native QML export. Both use the same simulation and drawing rules in `ArtEngine.js`.

## Run

Download and extract the complete ZIP. Keep `Widget.qml`, its QML helpers, and `ArtEngine.js` together. With Quickshell 0.3.0 and Qt 6.11.2 installed, run:

```sh
qs -p /absolute/path/to/the/extracted-folder/shell.qml
```

The launcher opens a regular, resizable window and scrolls when the controls need more room. It uses Qt Quick, Qt Quick Controls Basic, and Qt Quick Layouts, plus Qt Multimedia. To embed the component in a QML layout:

```qml
import "./mechanical-rhythm" as Art

Art.Widget {
    width: 740
}
```

Keep `ArtAudio.qml` and the six files in `sounds/` with the widget. The original PCM samples reproduce the preview’s synthesized tones; they are included under 0BSD. Native playback needs an available audio output.

The artwork adapts to the component width. Font families use installed fonts with system fallback. No remote assets are requested.

## Interaction and settings

Click a pin on the wheel or select its number and use Set pin / Remove pin. Tempo controls the rotation speed. Compact canvas changes the scene height. Sound starts off; Sound on enables the optional tones. Pausing or hiding the component turns sound off, and resuming stays silent until Sound on is selected again. If an audio output or the samples are unavailable, the wheel remains usable silently.

Use the controls inside the artwork. Pause freezes continuous motion while leaving controls usable. The browser starts paused when reduced motion is preferred. In native QML, set `paused: true` or use the pause control. Hiding a native component stops its animation and releases pointer drags.

Appearance changes and Reset preserve the current scene and collections. All interaction state stays in memory for the component’s lifetime. Leaving the browser preview or closing the native component resets it. Copied QML and ZIP downloads contain the same settings snapshot; they do not include the current scene or collections.

## Host integration

`paused`, `running`, and `statusText` expose the component’s current state. The native template binds Chaldea settings to the component. `ArtEngine.js` contains this design’s original drawing and interaction logic, shared with the browser host. Chaldea’s frontend generator creates the QML template output.

## Source and license

The design is from `Lib-assests/interactive-art/tsugumori-eight-play-studies.html`. It remains its own widget entry; the source archive is unchanged.

Source SHA-256: `32346a91f1ca8662f70729f4684fc8bd49ef8958f4b1aa66ad85f31835aaca90`.

Original drawing rules, preview code, and native implementation use 0BSD. The download includes `LICENSE`.
