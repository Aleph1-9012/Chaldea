# Tsugumori / Afk layout previews / Type folio / Relay tiles

A native QML port of the selected Tsugumori lockscreen layout. The browser preview and native export use the original artwork, colors, input-length animation, and responsive arrangement.

## Run

Save each listed output file into a widget directory, preserving file names and subfolders, then run `qs -p /absolute/path/to/shell.qml` with Quickshell 0.3.0 and Qt 6.11.2. The launcher opens an ordinary window and scrolls when its contents exceed the window height. Install JetBrains Mono, EB Garamond, and Noto Sans CJK JP for the intended typography; Qt falls back to available fonts otherwise.

The output file list includes `Widget.qml`, its local QML helpers, the original glyph drawing rules, this README, and the 0BSD license. Keep these files together. To embed it, place `Widget` in an existing QML view and give it a width and at least its `implicitHeight`.

## Try it

The initial twelve masked characters match the browser preview. Type dummy text in the masked field. Only its length and placeholder characters are retained. Backspace reverses the artwork, and Enter or the unlock button runs the red preview curtain. Restart and Shutdown open a preview dialog; Back or Escape closes it and restores keyboard focus. The fixed clock, date, and username are part of the original design.

`s0Duration` controls the input transition. `s1Motion` enables input animation. Settings chosen in Chaldea are written into `Widget.qml` before copying or downloading.

## Integration

`previewRequested(int length)` fires when a nonempty dummy input starts the unlock preview. `powerRequested(string action)` fires when a power preview dialog opens, with `"restart"` or `"shutdown"`. The read-only properties `inputLength`, `phase`, and `previewing` expose the current demonstration state. `focusInput()`, `setInputLength(length)`, and `replay()` are available to a containing QML component.

This is a visual component. It does not authenticate, lock a session, or run power commands. The masked field accepts dummy text only. A real lockscreen requires a separate secure session-lock and authentication implementation; these preview signals do not authorize an unlock or power action.

## Source and license

This is one design from the owner-supplied `Lib-assests/lockscreen/tsugumori-afk-layout-previews.html`. Distinct designs have separate library entries. Appearance settings remain controls.

Source SHA-256: `838b648c2a5df70f6c71a75243523dbaff5561e438a362fcdb18c4644dc09142`. The source archive is unchanged.

Original widget code and artwork are available under the included 0BSD license.
