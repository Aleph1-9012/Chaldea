# Fish murmuration

White fish and dotted echoes circle clockwise on black. The browser and native Qt Canvas both draw the scene through the same `FishEngine.js` renderer. The runtime uses no video, audio, or static fish images.

Measured positions and motion from the video in [Ramin Nasibov's X post](https://x.com/RaminNasibov/status/2116201987146383447) are fitted to continuous elliptical orbits. Inner paths have faster angular motion. The renderer draws a curved, asymmetric fish profile and independent stippled echoes in every frame. It does not replay captured frames. This is a new implementation, not the source code behind that post or a claim of a pixel-exact match. The widget is included in the published catalog with native QML export.

## Preview

Run `make dev` from the repository root and open [Fish murmuration](http://127.0.0.1:5175/?widget=interactive-art-fish-murmuration).

Move the pointer through the school to part the fish. Focus the artwork and press Space to pause or resume; press R to restart. Chaldea's sidebar also provides Play/Pause and Restart. The browser starts paused when reduced motion is preferred. Interaction state stays in memory and resets when the preview closes.

The black canvas fills the live preview panel. The fish formation stays centered at its original 360 × 477 scale and shrinks to fit narrower screens. Pointer coordinates follow that centered formation, including when the panel resizes. Fish speed ranges from 0.25× to 3×, with 1× as the default. Speed changes preserve the current positions and pause state, and the exported QML uses the same selected speed. Pointer response stays the same at every speed.

Opening `preview/index.html` directly provides the same drawing, pointer interaction, and keyboard controls. The Chaldea sidebar connection is available in the packaged preview.

## Native export

Save all five exported files together: `Widget.qml`, `FishEngine.js`, `shell.qml`, `README.md`, and `LICENSE`. With Quickshell 0.3.0 and Qt 6.11.2 installed, run:

```sh
qs -p /absolute/path/to/the/widget-folder/shell.qml
```

The launcher opens a 360 × 477 window and keeps the artwork's portrait proportions when resized. Pointer interaction, Space, and R work in the native widget. The component exposes `paused`, `speed`, and `restart()` for a host. Set `paused: true` when embedding it if animation should start paused. Keep `FishEngine.js` beside `Widget.qml`; no media files are needed.

To generate the same files without a browser, run this from `frontend/`, choosing an output directory that does not already exist:

```sh
bun run export interactive-art-fish-murmuration /tmp/fish-murmuration-export
```

## Reference

The visual reference is the video attached to the linked post by Ramin Nasibov. This attribution identifies the post, not the video's original creator. The downloaded MP4 is kept outside the repository as a private authoring reference. It is not included in previews or exports, and the renderer never loads it. Its SHA-256 is `adddf15df31b0362f63128dc909b44c06f6a26bf2a14c6c01a3ad45d832fdb3a`.

The library thumbnail is captured from the code-rendered scene.

## License

The original renderer and its HTML, CSS, JavaScript, and QML code use 0BSD. The private reference MP4 is third-party media excluded from that grant. This repository does not claim ownership of the footage or grant a license to it. See the local `LICENSE` for the license scope.
