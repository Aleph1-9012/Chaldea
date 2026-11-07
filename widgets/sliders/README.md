# Sliders

Comb, Slats, Stipple Blade, Weave, Louvers, Membrane, Braid, Fuse, Lattice, Field, and Interference are independent percentage controls. They preserve the designs supplied in `Lib-assests/chaldea assets/`, including their default levels, compact proportions, track patterns, and handles.

| Widget | ID | Design adjustment |
| --- | --- | --- |
| [Comb](comb/README.md) | `sliders-comb` | Pattern spacing |
| [Slats](slats/README.md) | `sliders-slats` | Pattern spacing |
| [Stipple Blade](stipple-blade/README.md) | `sliders-stipple-blade` | Handle height |
| [Weave](weave/README.md) | `sliders-weave` | Colors and width |
| [Louvers](louvers/README.md) | `sliders-louvers` | Contact deformation |
| [Membrane](membrane/README.md) | `sliders-membrane` | Contact deformation |
| [Braid](braid/README.md) | `sliders-braid` | Contact response |
| [Fuse](fuse/README.md) | `sliders-fuse` | Contact response |
| [Lattice](lattice/README.md) | `sliders-lattice` | Contact response |
| [Field](field/README.md) | `sliders-field` | Contact response |
| [Interference](interference/README.md) | `sliders-interference` | Contact response |

Each entry includes its own browser preview, QML template, launcher, font, thumbnail, and usage guide. There is no design selector. Label, initial level, colors, and width remain settings. Browser previews keep direct range input and keyboard controls; appearance edits preserve the level until Initial level changes. The live preview fills the available panel and magnifies the control up to 2.5×, including its text, track, and handle. Narrow screens constrain its width. This magnification does not change the exported dimensions.

The native `Widget.qml` exposes a `value` property and `moved(value)` signal for a host model. The supplied `shell.qml` is an in-memory demonstration. Applications choose whether to connect a slider to audio, brightness, or another percentage value.

The browser uses an embedded Latin WOFF2 font so sandboxed previews need no cross-origin font requests. Native exports include JetBrains Mono Regular as TTF. Both use the SIL Open Font License in `assets/OFL.txt`; widget code uses 0BSD.

Comb and Stipple Blade lay out complete vector marks with equal edge margins. Stipple uses three full rows at consistent spacing. Columns that would intersect the handle are hidden as a unit, so dragging never exposes a sliced dot or tick. Browser previews, QML exports, and SVG thumbnails follow the same placement rules. Weave preserves its continuous five-pixel lattice, 30-pixel track, and tall blade handle. Its default control is 344 × 76 pixels with a starting value of 13.

Louvers and Membrane preserve the supplied 344 × 84 controls, starting at 61% and 43%. Their tracks deform around the handle while pressed or keyboard-focused. Each entry keeps its own `assets/Track.js`, shared only between that widget's browser SVG and native Qt Quick vector drawing. Geometry changes retain existing path objects during the animation. No cached bitmap or canvas texture is enlarged. Contact deformation is configurable from 0.4 to 1.

Braid and Fuse also retain the supplied 344 × 84 proportions, with starting levels of 61% and 47%. Braid uses three strands with the supplied alternating crossing order, relaxing into separate rails after the handle. Fuse merges four rows of small fragments into a solid level. Their widget-local `Track.js` files define full-track and active-level clipping for both browser SVG and native vector paths. The blade remains unclipped at 0% and 100%. Contact response ranges from 0.4 to 1.

Lattice, Field, and Interference retain the same 344 × 84 layout, starting at 55%, 47%, and 66%. Lattice rotates connected tiles around the handle. Field bends five rows of needles. Interference shifts two crossing gratings without changing its blade height. Each has independent geometry shared between its SVG preview and native export, with vector-only thumbnails.

## Verification

Export with the normal Bun export command and load those exact files in an isolated Quickshell configuration. The controls use Qt Quick Controls Basic, with keyboard focus, dragging, snapping, and a 0–100 range. Home and End select the endpoints; Page Up and Page Down move by ten.

Library thumbnails are SVG artwork in a 3:1 frame with 24 pixels of padding around the default widget. Tracks, handles, and JetBrains Mono letter outlines stay sharp at every display density. The SVGs contain no raster images or external font requests. Weave draws its lattice as explicit vector strokes in both the thumbnail and live preview, avoiding a small pattern tile that can soften when magnified. Its preview rebuilds that geometry only when the track width changes. Update thumbnails alongside any design changes; `frontend/scripts/thumbnails.ts` preserves SVG thumbnails when refreshing the library's raster captures.

On 2026-10-30, the generated exports passed `qmllint` and offscreen Qt 6.12.0 checks for rendering, pointer dragging, keyboard endpoints and steps, value binding, and the `moved` signal. The standalone launchers loaded under Quickshell 0.3.2 in a private session bus with temporary configuration and cache directories. These checks did not change desktop settings or verify integration with an audio or brightness service. The documented minimum Qt 6.11.2 was not the installed test version.

On 2026-10-31, Weave's exact generated export passed Qt 6.12.0 `qmllint` and offscreen checks for default rendering, long labels, pointer dragging, all arrow keys, Home/End/Page keys, initial value changes, host value binding, the `moved` signal, resizing, and recoloring. Its launcher loaded under Quickshell 0.3.2 with a private session bus and temporary XDG directories. Browser checks covered dragging, keyboard controls, customization, downloaded settings, and a 390-pixel viewport without horizontal overflow. Weave's custom keyboard steps use native slider methods so they preserve a host's value binding. These checks did not exercise a real touch device or connect a system service; Qt 6.11.2 remains untested.

On 2026-11-07, Louvers and Membrane passed `make check`, Qt 6.12.0 `qmllint`, and offscreen Qt interaction checks on their exact generated files. The checks covered dragging, keyboard endpoints and steps, initial-level changes, host value binding, the `moved` signal, width, colors, and contact response. Both launchers loaded in isolated Quickshell 0.3.2 sessions with a private bus and temporary XDG directories. Native rendering was inspected with the software backend; real desktop integration and the minimum Qt 6.11.2 were not tested. Chromium checks covered desktop previews at 2× density, 390-pixel mobile previews at 3× density, touch input, contact animation, customization, and downloaded QML settings. Pixel density was verified inside the sandboxed preview frame as well as in the host. The thumbnails are SVG paths with outlined text and no embedded raster data.

On 2026-11-07, Braid, Fuse, Lattice, Field, and Interference passed `make check`, Qt 6.12.0 `qmllint`, and offscreen interaction checks on their exact generated exports. All five launchers loaded in isolated Quickshell 0.3.2 sessions. Native checks covered pointer and keyboard input, host value bindings, resizing, colors, and contact response. Chromium checks covered desktop previews at 2× density and mobile previews at 3× density, including touch input, customization, and downloaded settings. Track captures were compared with the supplied HTML at rest, while pressed, and at both endpoints. All five thumbnails contain vector paths and outlined text. The native checks used software rendering and did not verify real desktop service integration or Qt 6.11.2.
