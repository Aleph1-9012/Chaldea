# Tsugumori / Fish in space

The owner-supplied design now has an interactive browser preview and a native QML export. Both use the same simulation and drawing rules in `ArtEngine.js`.

## Run

Save each file from the output selector into a widget folder, preserving the displayed file names and subfolders. Keep `Widget.qml`, its QML helpers, and `ArtEngine.js` together. With Quickshell 0.3.0 and Qt 6.11.2 installed, run:

```sh
qs -p /absolute/path/to/the/widget-folder/shell.qml
```

The launcher opens a regular, resizable window and scrolls when the controls need more room. It uses Qt Quick, Qt Quick Controls Basic, and Qt Quick Layouts. To embed the component in a QML layout:

```qml
import "./fish-in-space" as Art

Art.Widget {
    width: 740
}
```

The artwork adapts to the component width. Font families use installed fonts with system fallback. No remote assets are requested.

## Interaction and settings

Each fish swims along its own path with a separate pace and swimming rhythm. A wave passes through the front of the body and the fins before growing into the tail stroke. Turns begin at the head and reach the tail with a short delay. Click or tap the canvas to give both a brief burst toward that area. They approach separate spots beside the click, ease off, then resume independent swimming. Moving the pointer alone does not steer them.

The fish steer around each other with space for their fins and tails. Near an edge they ease their speed and curve along the wall, keeping room for the tail to swing through the turn. A fish has arrived when its head reaches the destination area, so it can turn away without pressing its whole body toward the edge. Narrow previews use smaller fish so both have room to swim.

Gather calls them toward the center; Release lets them roam. A new canvas click releases the gathered pair and chooses a destination. Focus the canvas and press Enter or Space to call them to the center. Pause freezes the scene, and reduced-motion preference starts it paused. Clicks while paused queue a destination for the next Play.

Fish particle trails adds a short wake behind each tail. Fish detail controls the density of the skeletal drawing.

Use the customization sidebar in the library, or the local controls in standalone previews and native QML. Pause freezes continuous motion while leaving controls usable. The browser starts paused when reduced motion is preferred. In native QML, set `paused: true` or use the pause control. Hiding a native component stops its animation and releases pointer drags.

Appearance changes and Reset preserve the current scene and collections. All interaction state stays in memory for the component’s lifetime. Leaving the browser preview or closing the native component resets it. Copied QML and individual file downloads contain the same settings snapshot; they do not include the current scene or collections.

## Host integration

`paused`, `running`, and `statusText` expose the component’s current state. The native template binds Chaldea settings to the component. `ArtEngine.js` contains this design’s original drawing and interaction logic, shared with the browser host. Chaldea’s frontend generator creates the QML template output.

## Source and license

The design is from `Lib-assests/interactive-art/tsugumori-drift-and-tsumugi.html`. It remains its own widget entry; the source archive is unchanged.

Source SHA-256: `7948dc2f2a16ee848de4592d1d9c58dcbf8d756b7ebdfb0594e077880cb95875`.

Original drawing rules, preview code, and native implementation use 0BSD. The output file list includes `LICENSE`.
