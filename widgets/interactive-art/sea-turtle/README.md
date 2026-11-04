# Sea turtle

A painted sea turtle swims across a solid cream or white background. The native Quickshell component and browser preview share the same skeleton, stroke cycle, swimming logic, and roughly 53,000 vector marks. The artwork is drawn in code, with no source bitmap stored or loaded. Marks are repainted at their displayed size when the widget or turtle size changes.

Native export is available, and the widget is included in production builds. The earlier Tidal turtle and Skeleton studies remain archived outside this repository.

## Run the native widget

Save every exported file into one folder, retaining the `shaders/` subfolder, then run:

```sh
qs -p /path/to/sea-turtle/shell.qml
```

The included shell opens a resizable 640 × 400 window. To embed the component in another Quickshell layout:

```qml
Widget {
    width: 640
    height: 400
    speed: 1
    turtleSize: 1
    background: "Cream"
    paused: false
}
```

`speed` ranges from 0.5 to 2, `turtleSize` from 0.6 to 1.4, and `background` accepts `Cream` or `White`. `paused` can follow the host's reduced-motion preference. Native animation stops when the item or window is hidden or minimized. Nothing is saved between sessions.

Use the repository's Quickshell and Qt baseline with an accelerated Qt Quick backend. The component uses Qt ShaderEffect; the Qt Quick software backend does not render those effects. The precompiled `.qsb` shader files are included, so no shader compiler is required to run the widget. This is a contained widget, not a desktop overlay.

## Interact

- Click or tap a spot to call the turtle there.
- Drag the turtle to move it; release speed carries into its swimming.
- Tap the turtle to make it dart.
- Press Space to pause or resume, arrow keys to steer, and R to recenter.

For the browser preview, run `make dev`, then open `/?widget=interactive-art-sea-turtle`. The canvas fills the entire preview area for swimming, clicking, and dragging. Turtle size uses the previous 640 × 400 reference area, shrinking on narrow screens with a 300-pixel minimum height, so a larger swimming area does not enlarge the turtle. Its controls customize speed, size, and background, and it starts paused when reduced motion is enabled. A paused click places the turtle at that spot. Without WebGL2 the browser shows the painted turtle still.

Drawing stops while the canvas is off-screen or the tab is hidden. Returning to the preview resumes from the current position without changing the user's Play/Pause setting or advancing through time spent away.

## Motion and rendering

The existing swim cycle is preserved. Foreflipper downstrokes supply thrust, recovery feathers the flippers, and runs of strokes alternate with glides. Rear flippers steer, the body banks, and the head leads turns. Once the turtle moves fully beyond the stage, it enters from another edge.

`TurtleMotion.js` owns the simulation, skeleton, and vector contour decoder. `Pigment.js` stores the reference-derived marks. The browser's `preview/turtle.js` uses WebGL2; `TurtlePart.qml` uses Qt meshes and shaders to deform the same painted body parts. Both composite the parts before one finishing pass removes the reference paper color and applies the selected background.

The GLSL sources accompany the compiled shaders. After editing a shader, rebuild its package with Qt Shader Tools and package the changed source and binary together:

```sh
qsb --qt6 --qsbversion 64 -o shaders/turtle.vert.qsb shaders/turtle.vert
qsb --qt6 --qsbversion 64 -o shaders/turtle.frag.qsb shaders/turtle.frag
qsb --qt6 --qsbversion 64 -o shaders/finish.frag.qsb shaders/finish.frag
```

For an artwork comparison, the packaged browser preview accepts `?still` or `?phase=0.25`. These freeze the shared renderer at the reference layout or a stroke phase. Normal views start without diagnostic overlays.

## License

Original code uses the repository's 0BSD widget license. `Pigment.js` is derived from the owner-supplied reference and is not covered by that license. Keep `ARTWORK_NOTICE.txt` with it. The code license does not relicense the reference-derived artwork.
