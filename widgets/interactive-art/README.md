# Interactive art

Fish in space, Magnetic powder, Mechanical rhythm, Specimen chamber, Orbital playground, Resonance sculpture, Signal hunting, Gravity sandbox, and Session fossils each have an independent QML export and are included in production builds. Each preserves its original drawing and direct controls. Collections remain in memory. Mechanical rhythm includes optional native sound; the other eight designs are silent.

Stochastic ink is an original design with a verified native export and is also included in production builds. It draws a GPU point cloud: WebGL 2 in the browser and Qt Quick 3D natively, so its native version also needs the Qt Quick 3D module and a compatible graphics renderer. It keeps its own paper-and-ink host (`InkWidget.qml`, `InkField.qml`, `InkButton.qml`, `InkText.qml`, the shaders `ink.vert` and `ink.frag`, and its own `shell.qml`). None of the shared files below apply to it. Its README records the native inspection environment and limits.

## Shared files

`_shared/qml/` holds `ArtWidget.qml`, `ArtField.qml`, `ArtButton.qml`, `ArtText.qml`, and the `shell.qml` launcher, which all nine designs use unchanged. Each widget folder keeps its own `assets/ArtEngine.js`, `Widget.qml.tmpl`, preview, thumbnail, and README. Mechanical rhythm also keeps `qml/ArtAudio.qml` and its six original PCM files under `assets/sounds/`.

## Components

In the library, live controls and collections appear in the customization sidebar beside appearance settings. They operate the existing preview engine, while pointer and keyboard gestures remain on the canvas. Appearance changes and Reset preserve scene state and collections. A standalone preview keeps its local controls until an embedding host acknowledges the sidebar controls. Native exports retain their own controls.

Hosted previews hide their study mastheads, decorative footers, and local control panels. Artwork titles and gesture hints remain beside the canvas, as in Fish in space. Standalone previews restore their original panels when no sidebar host is present.

Each design’s `ArtEngine.js` drives both its browser preview and its native component. QML hosts the original drawing rules, pointer gestures, controls, and in-memory collections. Keep each exported `ArtEngine.js` with its QML helpers. Preserve the original drawing rules and interactions when changing either host. Settings change appearance and must leave scene state and collections intact. Native components stop animation when hidden.

Shared JavaScript must work in Qt’s JavaScript engine as well as the browser. The engines use ES2016-compatible syntax, including `Object.assign` instead of object spread. Browser and Qt Canvas APIs differ; the shared drawing code uses a Bezier ellipse helper to preserve the same geometry in both.

Mechanical rhythm additionally needs Qt Multimedia. Sound starts off, requires an available output, and stops on pause or hiding. Orbital playground uses sample workspace labels, Resonance sculpture uses a silent simulated beat, and Session fossils uses fixed sample sessions.

## Inspect a change

Use the documented Bun export command and an isolated launcher. Check pointer gestures, keyboard controls, collection recall, pause/resume, settings, and narrow layouts. A muted audio check establishes sample loading and control behavior, not audible output quality. The generic library checker discovers these exports and assets automatically; no new test command or registration is needed.
