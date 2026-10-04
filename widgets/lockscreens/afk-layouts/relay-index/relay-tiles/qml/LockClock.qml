// SPDX-License-Identifier: 0BSD
import QtQuick

Item {
    id: clock
    property bool reactive: false
    property bool folio: false
    property bool spine: false
    property bool compact: false
    property real size: 64
    property color paper: "#e4e2dc"
    property color muted: "#99958b"
    readonly property real timeY: spine && !compact ? 58.4 : folio && !compact ? 29 : compact ? 0 : reactive ? 24.5 : 26.8
    readonly property real timeHeight: spine && !compact ? size * 1.92 : reactive ? size * 1.2 : spine ? size * 1.1 : size
    implicitHeight: timeY + timeHeight + (spine && !compact ? 24 : reactive ? 8 : folio && !compact ? 12 : 10) + (reactive ? 16.5 : spine ? 19.8 : 18.7)
    Rectangle { visible: clock.folio && !clock.compact || clock.spine && !clock.compact; width: parent.width; height: clock.spine ? 3 : 2; color: clock.spine ? "#d1161c" : clock.paper }
    Row {
        visible: !clock.compact && !clock.folio
        y: clock.spine ? 15 : 0
        spacing: 8
        Rectangle { visible: clock.reactive; width: 6; height: 6; y: 5; color: "#d1161c" }
        LockText { text: "SESSION LOCKED"; color: clock.muted; font.letterSpacing: 1.5 }
    }
    Row {
        visible: !clock.spine || clock.compact
        y: clock.timeY
        LockText {
            text: clock.reactive ? "21" : "00"
            height: clock.timeHeight
            font.family: clock.folio ? "EB Garamond" : clock.reactive || clock.spine ? "JetBrains Mono" : "Oswald"
            font.pixelSize: clock.size; color: clock.paper
            font.letterSpacing: clock.folio ? -2 : clock.reactive ? -5 : 0
            verticalAlignment: Text.AlignVCenter
        }
        LockText {
            text: ":"; height: clock.timeHeight; color: "#d1161c"
            font.family: clock.folio ? "EB Garamond" : clock.reactive || clock.spine ? "JetBrains Mono" : "Oswald"
            font.pixelSize: clock.size; font.letterSpacing: clock.folio ? -2 : clock.reactive ? -5 : 0
            verticalAlignment: Text.AlignVCenter
        }
        LockText {
            text: clock.reactive ? "04" : "14"; height: clock.timeHeight; color: clock.spine ? "#77746c" : clock.paper
            font.family: clock.folio ? "EB Garamond" : clock.reactive || clock.spine ? "JetBrains Mono" : "Oswald"
            font.pixelSize: clock.size; font.letterSpacing: clock.folio ? -2 : clock.reactive ? -5 : 0
            verticalAlignment: Text.AlignVCenter
        }
    }
    Column {
        visible: clock.spine && !clock.compact
        x: -7; y: clock.timeY
        LockText { text: "00"; height: clock.size * .96; color: clock.paper; font.pixelSize: clock.size; font.letterSpacing: -9; verticalAlignment: Text.AlignVCenter }
        LockText { text: "14"; height: clock.size * .96; color: "#77746c"; font.pixelSize: clock.size; font.letterSpacing: -9; verticalAlignment: Text.AlignVCenter }
    }
    Row {
        y: clock.timeY + clock.timeHeight + (clock.spine && !clock.compact ? 24 : clock.reactive ? 8 : clock.folio && !clock.compact ? 12 : 10)
        spacing: 12
        LockText { text: clock.reactive ? "SAT" : "SUN"; color: clock.muted; font.pixelSize: clock.spine && clock.compact ? 13 : 11 }
        LockText { text: "//"; color: "#d1161c"; font.pixelSize: clock.spine && clock.compact ? 13 : 11 }
        LockText { text: clock.reactive ? "12 SEPTEMBER 2026" : "13 SEPTEMBER 2026"; color: clock.muted; font.pixelSize: clock.spine && clock.compact ? 13 : 11 }
    }
}
