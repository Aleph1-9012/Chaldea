// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick

FocusScope {
    id: root
    property alias noteStore: store
    readonly property int noteCount: store.count
    readonly property int selectedIndex: store.selected
    property string paletteName: "Original"
    property color customBackground: "#0a0a0a"
    property color customText: "#e8e8e8"
    property color customAccent: "#cc1515"
    property color originalInk: "#e8e8e8"
    property color originalMuted: "#909090"
    property color originalPaper: "#0a0a0a"
    property color originalRule: "#663030"
    readonly property bool customPalette: paletteName !== "Original" && paletteName !== "Bone" && paletteName !== "Red"
    readonly property var paletteColors: paletteName === "Cobalt" ? ["#101827", "#e5edfa", "#82afff"]
        : paletteName === "Forest" ? ["#121e19", "#e4eee7", "#8abb9c"]
        : paletteName === "Paper" ? ["#f4ecdd", "#2d2923", "#9a4824"]
        : [customBackground, customText, customAccent]
    property color ink: customPalette ? paletteColors[1] : originalInk
    property color paper: customPalette ? paletteColors[0] : originalPaper
    property color accent: customPalette ? paletteColors[2] : "#cc1515"
    property color muted: customPalette ? blend(paper, ink, 0.65) : originalMuted
    property color rule: customPalette ? blend(paper, accent, 0.45) : originalRule
    readonly property color accentInk: customPalette ? contrastingInk(accent) : paper
    readonly property color softFill: blend(paper, ink, 0.10)
    property string monoFont: "Share Tech Mono"
    property string sansFont: "Inter"
    property int writingHeight: 130
    property int headingSize: 18
    property string density: "Comfortable"
    property int listRows: 4
    property bool prependNewNotes: false
    property string counterMode: "Off"
    property bool numbered: true
    property int defaultRowHeight: 40
    property int defaultRowGap: 7
    readonly property int noteRowHeight: defaultRowHeight + (density === "Compact" ? -8 : density === "Spacious" ? 8 : 0)
    readonly property int noteRowGap: Math.max(0, defaultRowGap + (density === "Compact" ? -3 : density === "Spacious" ? 3 : 0))
    readonly property int noteListHeight: listRows * noteRowHeight + (listRows - 1) * noteRowGap
    signal notesEdited()
    NoteStore { id: store; onContentEdited: root.notesEdited() }
    function blend(a: color, b: color, amount: real): color {
        return Qt.rgba(a.r + (b.r - a.r) * amount, a.g + (b.g - a.g) * amount, a.b + (b.b - a.b) * amount, 1);
    }
    function linear(channel: real): real { return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4); }
    function contrastingInk(background: color): color {
        return 0.2126 * linear(background.r) + 0.7152 * linear(background.g) + 0.0722 * linear(background.b) > 0.179 ? Qt.rgba(10 / 255, 10 / 255, 10 / 255, 1) : Qt.rgba(245 / 255, 245 / 255, 240 / 255, 1);
    }
    function snapshot(): var { return store.snapshot(); }
    function selectNote(index: int): void { store.select(index); }
}
