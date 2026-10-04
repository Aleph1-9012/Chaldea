// SPDX-License-Identifier: 0BSD
import QtQuick

Item {
    id: layout
    required property LockScreen screen
    property alias auth: login
    readonly property real rightWidth: Math.min(310, Math.max(0, width - 160 - (screen.medium ? 50 : 90)))
    readonly property real rightX: width - rightWidth
    implicitWidth: screen.narrow ? 350 : 630
    implicitHeight: entry.y + entry.height
    LockClock {
        id: clock
        screen: layout.screen
        x: layout.screen.narrow ? 0 : layout.rightX
        y: layout.screen.narrow ? 0 : art.height + 28 + 13
        width: layout.screen.narrow ? layout.width : layout.rightWidth
        size: layout.screen.narrow ? 32 : 42
        tracking: layout.screen.narrow ? -1 : -2
        bottomGap: 8
    }
    Rectangle { visible: !layout.screen.narrow; x: layout.rightX; y: art.height + 28; width: layout.rightWidth; height: 1; color: layout.screen.lineColor }
    Item {
        id: title
        x: 0
        y: layout.screen.narrow ? clock.implicitHeight + 38 : 0
        width: layout.screen.narrow ? layout.width : 160
        height: layout.screen.narrow ? 64.8 : 351.5
        Rectangle { visible: !layout.screen.narrow; width: parent.width; height: 5; color: "#d1161c" }
        LockText {
            x: layout.screen.narrow ? (parent.width - implicitWidth) / 2 : 0
            y: layout.screen.narrow ? 0 : 19
            text: layout.screen.narrow ? "継 衛" : "継\n衛"
            font.family: "Noto Sans CJK JP"
            font.pixelSize: layout.screen.narrow ? 54 : 140
            height: layout.screen.narrow ? 64.8 : 294
            verticalAlignment: Text.AlignVCenter
            font.weight: Font.Medium
            lineHeightMode: Text.FixedHeight
            lineHeight: font.pixelSize * (layout.screen.narrow ? 1.2 : 1.05)
            color: layout.screen.paperColor
        }
        LockText { visible: !layout.screen.narrow; y: 335; width: parent.width; text: "東亜重工 // 一七式"; font.family: "Noto Sans CJK JP"; font.letterSpacing: 1; color: layout.screen.mutedColor }
    }
    LockArtwork {
        id: art
        objectName: "glyphArtwork"
        x: layout.screen.narrow ? (layout.width - width) / 2 : layout.rightX
        y: layout.screen.narrow ? title.y + title.height + 22 : 0
        width: Math.min(252, layout.width)
        height: width
        phase: layout.screen.phase
    }
    Item {
        id: entry
        y: layout.screen.narrow ? art.y + art.height + 22 : Math.max(title.height, clock.y + clock.implicitHeight) + 28
        width: parent.width
        height: layout.screen.narrow ? login.y + login.height : 89
        Rectangle { width: parent.width; height: 1; color: layout.screen.lineColor }
        LockIdentity {
            id: identity
            screen: layout.screen
            y: layout.screen.narrow ? 19 : 23 + (66 - implicitHeight) / 2
            width: layout.screen.narrow ? parent.width : 160
        }
        LockAuth {
            id: login
            screen: layout.screen
            x: layout.screen.narrow ? 0 : 160 + (layout.screen.medium ? 50 : 90)
            y: layout.screen.narrow ? identity.y + identity.implicitHeight + 16 : 23
            width: parent.width - x
            height: implicitHeight
        }
    }
}
