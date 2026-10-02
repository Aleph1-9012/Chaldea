# Stochastic ink

Ink threads follow a strict rule, a strange attractor, while chaos frays them loose. A dense knot of bound ink sits at the center. Loose threads travel in ribbons that fan out, loop, and get reeled back in. Depth of field blurs threads that leave the focal plane. The browser preview and the native QML export share the same simulation and drawing rules in `ArtEngine.js`.

## Run

Download and extract the complete ZIP. Keep `Widget.qml`, its QML helpers, and `ArtEngine.js` together. With Quickshell 0.3.0 and Qt 6.11.2 installed, run:

```sh
qs -p /absolute/path/to/the/extracted-folder/shell.qml
```

The launcher opens a regular, resizable window in the paper color and scrolls when the controls need more room. It uses Qt Quick, Qt Quick Controls Basic, and Qt Quick Layouts. To embed the component in a QML layout:

```qml
import "./stochastic-ink" as Ink

Ink.Widget {
    width: 740
}
```

The artwork adapts to the component width. Font families use installed fonts with system fallback. No remote assets are requested.

## Interaction and settings

- Drag through the ink to draw threads out toward the pointer. They drift back under the rule when released.
- Tap or click to release a burst of ribbons from that point.
- Arrow keys turn the view while the canvas has focus. Enter or Space releases a burst at the center, and Escape lets go of a drag.
- Rule picks the attractor: Lattice (Thomas), Bloom (Aizawa), or Knot (Halvorsen). Threads morph into the new rule without restarting.
- Chaos sets how much noise and ejection the threads get. At 0 the motion is fully deterministic: clean ribbons and a calm core.
- Focus moves the focal plane from the near side to the far side of the scene.
- Orbit sets how fast the view turns. At 0 the view holds still.
- Burst releases ribbons from the center. Reseed regrows the scene from a new seed under the same rule.

Paper and Ink color the artwork and its controls. Thread count trades detail for speed: Sparse draws 150 threads, Fine 260, and Dense 420. Use Sparse on slower machines, where native Canvas painting is the main cost. Compact canvas shortens the scene.

Pause freezes motion and leaves the controls usable, and paused scenes still redraw when controls change. The browser starts paused when reduced motion is preferred. In native QML, set `paused: true` or use the pause control. Hiding a native component stops its animation and releases any drag.

Appearance changes preserve the current scene. All interaction state stays in memory for the component's lifetime. Leaving the browser preview or closing the native component resets it. Copied QML and ZIP downloads contain the same settings snapshot, not the current scene.

## Host integration

`paused`, `running`, and `statusText` expose the component's current state. The native template binds Chaldea settings to `paperColor`, `inkColor`, `threadDetail`, and `compactCanvas`. Unlike the other Interactive art designs, this widget keeps its own paper-and-ink QML host instead of the shared dark frame. Chaldea's frontend generator creates the QML template output.

## Source and license

Original design, drawn from an owner-supplied video study of precise rules meeting stochastic chaos. The video itself is not part of this repository. Simulation, drawing rules, preview code, and native implementation use 0BSD. The download includes `LICENSE`.
