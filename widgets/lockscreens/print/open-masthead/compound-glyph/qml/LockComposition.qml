// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick

Item {
    id: composition
    required property LockScreen screen
    property alias auth: authentication
    readonly property real glyphSize: Math.min(width, screen.medium ? 280 : 306)
    readonly property real columnGap: screen.medium ? 42 : 64
    readonly property real leftWidth: screen.narrow ? width : Math.max(0, width - glyphSize - columnGap)
    readonly property real titleHeight: (screen.narrow ? 32 : 42) * 1.15
    readonly property real rowExtra: Math.max(0, glyphSize - titleHeight - clock.implicitHeight - 6 - 26) / 2
    implicitWidth: screen.narrow ? 350 : 820
    implicitHeight: entry.y + entry.height

    Item {
        id: wordmark
        width: parent.width
        height: letters.fontSize + (composition.screen.narrow ? 16 : 20)
        Rectangle { width: parent.width; height: 4; color: "#d1161c" }
        Row {
            id: letters
            property real fontSize: composition.screen.narrow ? Math.max(54, Math.min(76, composition.screen.width * .13)) : Math.max(62, Math.min(154, composition.screen.width * .15))
            y: composition.screen.narrow ? 16 : 20
            height: fontSize
            Repeater {
                model: 7
                LockText {
                    required property int index
                    text: "SID0NIA"[index]
                    color: text === "0" ? "#d1161c" : composition.screen.paperColor
                    font.pixelSize: letters.fontSize
                    font.weight: Font.Medium
                    font.letterSpacing: composition.screen.narrow ? -4 : -7
                    height: letters.fontSize
                    verticalAlignment: Text.AlignVCenter
                    lineHeightMode: Text.FixedHeight
                    lineHeight: letters.fontSize
                    wrapMode: Text.NoWrap
                }
            }
        }
    }
    Row {
        id: title
        y: wordmark.height + (composition.screen.narrow ? 24 : 36 + composition.rowExtra)
        height: composition.titleHeight
        spacing: 6
        Repeater {
            model: ["継", "衛"]
            LockText {
                required property string modelData
                text: modelData
                color: composition.screen.paperColor
                font.family: "Noto Sans CJK JP"
                font.weight: Font.Medium
                font.pixelSize: composition.screen.narrow ? 32 : 42
                font.letterSpacing: composition.screen.narrow ? 2 : 4
                height: composition.titleHeight
                verticalAlignment: Text.AlignVCenter
                lineHeightMode: Text.FixedHeight
                lineHeight: composition.titleHeight
                wrapMode: Text.NoWrap
            }
        }
    }
    LockArtwork {
        id: artwork
        objectName: "mastheadArtwork"
        x: composition.screen.narrow ? (composition.width - width) / 2 : composition.width - width
        y: wordmark.height + (composition.screen.narrow ? composition.titleHeight + 48 : 36)
        width: composition.glyphSize
        height: width
        phase: composition.screen.phase
    }
    LockClock {
        id: clock
        screen: composition.screen
        y: composition.screen.narrow ? artwork.y + artwork.height + 24 : artwork.y + artwork.height - implicitHeight - 6
        width: composition.leftWidth
        height: implicitHeight
        size: screen.narrow ? 44 : screen.medium ? 64 : 80
        tracking: screen.narrow ? -2 : -4
        caption: !screen.narrow
        japaneseCaption: false
        topGap: screen.narrow ? 0 : 12
        bottomGap: screen.narrow ? 10 : 16
    }
    Item {
        id: entry
        y: composition.screen.narrow ? clock.y + clock.height + 24 : artwork.y + artwork.height + 26
        width: parent.width
        height: authentication.y + authentication.height
        Rectangle { width: parent.width; height: 1; color: composition.screen.lineColor }
        LockIdentity {
            id: identity
            screen: composition.screen
            y: composition.screen.narrow ? 23 : 29
            width: composition.leftWidth
            height: implicitHeight
        }
        LockAuth {
            id: authentication
            screen: composition.screen
            x: screen.narrow ? 0 : composition.width - width
            y: screen.narrow ? identity.y + identity.height + 16 : 25
            width: screen.narrow ? composition.width : composition.glyphSize
            height: implicitHeight
        }
    }
}
