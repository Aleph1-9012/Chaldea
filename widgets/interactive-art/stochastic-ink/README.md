# Stochastic ink

Precise rules meet stochastic chaos. Crisp geometric loops (rose curves, Lissajous figures, and torus knots) are drawn on a pulse, spin rigidly for a moment, and are then taken apart by a chaotic flow field. Around them, ink pools in a black core, feathers outward, and stretches into lace, combed ribbons, and pale smoke. A shallow depth of field keeps one thin plane sharp and blurs the rest. The browser preview and the native QML export share the same simulation and renderer in `ArtEngine.js`.

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

- Drag to stir the ink. Ink near the pointer takes its motion and swirls around it.
- Tap or click to draw a rule where you tapped. It holds its shape briefly before chaos takes it apart.
- Arrow keys turn the view while the canvas has focus. Enter or Space draws a rule at the center, and Escape lets go of a drag.
- Rule picks the loop family for new rules: Rose, Lissajous, or Knot.
- Chaos sets how hard the flow pulls rules apart and how crumpled the lace becomes. At 0 the motion is deterministic and loops keep their shape.
- Focus moves the focal plane from the near side to the far side of the scene.
- Pulse sets how often rules, bursts, and shifts of the flow happen on their own. At 0 nothing happens unless you act.
- Draw rule, Burst, and Reseed trigger those events directly.

Paper and Ink color the artwork and its controls. Thread count trades detail for speed. Compact canvas shortens the scene.

The ink is accumulated as density in four depth-of-field layers, blurred, and written to the canvas pixel by pixel. In native QML the `pixelScale` property sets the buffer resolution relative to the component; it defaults to `0.5`, which the Canvas scales up smoothly. Raise it for sharper lines on a fast machine, or lower it and choose Sparse if frames drop.

Pause freezes motion and leaves the controls usable, and paused scenes still redraw when controls change. The browser starts paused when reduced motion is preferred. In native QML, set `paused: true` or use the pause control. Hiding a native component stops its animation and releases any drag.

Appearance changes preserve the current scene, except Thread count, which regrows it. All interaction state stays in memory for the component's lifetime. Leaving the browser preview or closing the native component resets it. Copied QML and ZIP downloads contain the same settings snapshot, not the current scene.

## Host integration

`paused`, `pixelScale`, `running`, and `statusText` expose the component's current state. The native template binds Chaldea settings to `paperColor`, `inkColor`, `threadDetail`, and `compactCanvas`. Unlike the other Interactive art designs, this widget keeps its own paper-and-ink QML host instead of the shared dark frame. Chaldea's frontend generator creates the QML template output.

## Source and license

Original design, drawn from an owner-supplied video study of precise rules meeting stochastic chaos. The video itself is not part of this repository. Simulation, drawing rules, preview code, and native implementation use 0BSD. The download includes `LICENSE`.
