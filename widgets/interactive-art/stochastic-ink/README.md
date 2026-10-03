# Stochastic ink

Precise rules meet stochastic chaos. Smooth rays and combed fans leave a dark core, closed loops (rose curves, Lissajous figures, torus knots) and sheets of parallel strands form around it, and pale shells sweep past out of focus. On each beat the lines are drawn clean. Within a fraction of a second, noise frays them into beaded, crinkled chains, and then they fade. A shallow depth of field keeps one thin plane sharp and blurs everything else into smoke.

Everything is drawn as a cloud of about 250,000 points of ink on the GPU. Each point is placed along its curve, pushed by the noise, and blurred by its own distance from the focal plane. Where points overlap, the ink adds up.

## Run

Download and extract the complete ZIP. Keep `Widget.qml`, its QML helpers, `ink.vert`, `ink.frag`, and `ArtEngine.js` together. With Quickshell 0.3.0 and Qt 6.11.2 installed, along with the Qt Quick 3D module (`qt6-quick3d` on Arch), run:

```sh
qs -p /absolute/path/to/the/extracted-folder/shell.qml
```

The launcher opens a regular, resizable window in the paper color and scrolls when the controls need more room. It uses Qt Quick, Qt Quick Controls Basic, Qt Quick Layouts, Qt Quick 3D, and Qt Quick 3D Helpers. To embed the component in a QML layout:

```qml
import "./stochastic-ink" as Ink

Ink.Widget {
    width: 740
}
```

The artwork adapts to the component width. Font families use installed fonts with system fallback. No remote assets are requested.

## Interaction and settings

- Drag to turn the view.
- Tap or click to strike a beat. Every line on screen is drawn clean, new loops, fans, and sheets appear, and chaos takes them apart again.
- Arrow keys turn the view while the canvas has focus. Enter or Space strikes a beat, and Escape lets go of a drag.
- Rule picks the loop family for new loops: Rose, Lissajous, or Knot.
- Chaos sets how hard and how fast the noise frays each line. At 0 the lines keep their precise shapes.
- Focus moves the focal plane from the near side of the scene to the far side.
- Pulse sets how often beats happen on their own. At 0 beats come only when you strike them.
- Beat and Reseed trigger those events directly.

Paper and Ink color the artwork and its controls. Thread count trades detail for speed by drawing a share of the points: Sparse draws about half, Fine most, Dense all of them. Compact canvas shortens the scene.

Pause freezes motion and leaves the controls usable, and paused scenes still redraw when controls change. The browser starts paused when reduced motion is preferred. In native QML, set `paused: true` or use the pause control. Hiding a native component stops its animation and releases any drag.

Appearance changes preserve the current scene. All interaction state stays in memory for the component's lifetime. Leaving the browser preview or closing the native component resets it. Copied QML and ZIP downloads contain the same settings snapshot, not the current scene.

## How it is built

`ArtEngine.js` runs the scene in both hosts: which lines exist, their shapes, the beat, the chaos envelope of each line, and the camera. Each frame it writes a small table, one row per line, and the GPU does the rest. `INK_SHADER_CORE` in the same file holds the shared GPU math: noise, the curve shapes, and the displacement.

- In the browser, `preview/InkGL.js` draws with WebGL 2. It adds ink density into a floating-point buffer and then maps density to paper and ink colors.
- In native QML, `InkWidget.qml` draws with Qt Quick 3D. `ink.vert` repeats `INK_SHADER_CORE` verbatim between its CORE markers and hard-codes the point layout of `INK_GROUPS`. Change those together; the component warns on the console if the layouts disagree. Points blend "over" in a single ink color, with a little dithering so faint, defocused ink survives 8-bit rounding.

`paused`, `running`, and `statusText` expose the component's current state. The native template binds Chaldea settings to `paperColor`, `inkColor`, `threadDetail`, and `compactCanvas`. Unlike the other Interactive art designs, this widget keeps its own paper-and-ink QML host instead of the shared dark frame.

## Status

The browser preview has been run and checked. The native QML version has not yet been launched in Quickshell. Its shaders were compiled and rendered through WebGL with Qt's built-in names mapped across, and that output matches the browser preview, but the Qt Quick 3D wiring (instancing, the line texture, and blending) still needs a real run before this widget is published.

## Source and license

Original design, drawn from an owner-supplied video study of precise rules meeting stochastic chaos. The video itself is not part of this repository. Simulation, shaders, preview code, and native implementation use 0BSD. The download includes `LICENSE`.
