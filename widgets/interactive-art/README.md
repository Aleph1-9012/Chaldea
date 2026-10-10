# Interactive art

Fish in space, Magnetic powder, Specimen chamber, Orbital playground, Resonance sculpture, Signal hunting, and Gravity sandbox each have an independent QML export and are included in production builds. Each preserves its original drawing and direct controls. Collections remain in memory. All seven designs are silent.

## Shared files

`_shared/qml/` holds `ArtWidget.qml`, `ArtField.qml`, `ArtButton.qml`, `ArtText.qml`, and the `shell.qml` launcher, which all seven designs use unchanged. Each widget folder keeps its own `assets/ArtEngine.js`, `Widget.qml.tmpl`, preview, thumbnail, and README.

## Components

In the library, live controls and collections appear in the customization sidebar beside appearance settings. They operate the existing preview engine, while pointer and keyboard gestures remain on the canvas. Appearance changes and Reset preserve scene state and collections. A standalone preview keeps its local controls until an embedding host acknowledges the sidebar controls. Native exports retain their own controls.

Play/Pause stays at the top of the sidebar. Live controls appear before appearance settings in the scrollable area below, so long panels fit beside the artwork without hiding playback. On narrow screens the panel flows below the preview.

Hosted previews fill the preview column and use the canvas height for the panel, without wrapper padding, study mastheads, duplicate titles, gesture instructions, decorative footers, or local control panels. Actions remain available in the customization sidebar, and canvas accessibility labels retain interaction instructions. Standalone previews restore their original panels when no sidebar host is present. Library thumbnails use the hosted view and center the complete canvas within the card proportions.

Each design’s `ArtEngine.js` drives both its browser preview and its native component. QML hosts the original drawing rules, pointer gestures, controls, and in-memory collections. Keep each exported `ArtEngine.js` with its QML helpers. Preserve the original drawing rules and interactions when changing either host. Settings change appearance and must leave scene state and collections intact. Native components stop animation when hidden.

Shared JavaScript must work in Qt’s JavaScript engine as well as the browser. The engines use ES2016-compatible syntax, including `Object.assign` instead of object spread. Browser and Qt Canvas APIs differ; the shared drawing code uses a Bezier ellipse helper to preserve the same geometry in both.

Orbital playground uses sample workspace labels, and Resonance sculpture uses a silent simulated beat.

## Inspect a change

Use the documented Bun export command and an isolated launcher. Check pointer gestures, keyboard controls, collection recall, pause/resume, settings, and narrow layouts. The generic library checker discovers these exports and assets automatically; no new test command or registration is needed.
