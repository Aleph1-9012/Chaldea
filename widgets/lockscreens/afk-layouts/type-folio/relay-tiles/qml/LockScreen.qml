// SPDX-License-Identifier: 0BSD
import QtQuick

Rectangle {
    id: root
    property int transitionTime: 180
    property int emphasis: 100
    property bool animationEnabled: true
    readonly property bool compact: width <= 670
    readonly property bool medium: width <= 850
    readonly property color paper: "#171714"
    readonly property color muted: "#5b584e"
    readonly property color line: "#aaa496"
    readonly property int inputLength: controller.length
    readonly property real phase: controller.phase
    readonly property bool previewing: controller.previewing
    signal previewRequested(int length)
    signal powerRequested(string action)
    implicitWidth: 1000
    implicitHeight: compact ? header.y + header.height + 60 + composition.height + footer.implicitHeight + 24 : 840
    color: "#d1cdbf"
    clip: true

    function focusInput(): void { controller.focusInput(); }
    function setInputLength(length: int): void { controller.setInputLength(length); }
    function replay(): void { controller.replay(); }

    LockSession {
        id: controller
        input: auth.input
        initialLength: 12
        transitionTime: root.transitionTime
        animationEnabled: root.animationEnabled
        onPreviewRequested: length => root.previewRequested(length)
        onPowerRequested: action => root.powerRequested(action)
    }

    Item {
        anchors.fill: parent
        enabled: !controller.powerAction

        LockHeader {
            id: header
            x: root.compact ? 20 : 32
            y: root.compact ? 22 : 27
            width: parent.width - x * 2
            height: implicitHeight
            paper: root.paper
            muted: root.muted
            compact: root.compact
        }

        Item {
            id: composition
            objectName: "folioComposition"
            width: root.compact ? Math.min(370, root.width - 40) : Math.min(920, root.width - (root.medium ? 48 : 64))
            height: root.compact ? entry.y + entry.height : root.medium ? 480 : 500
            x: (parent.width - width) / 2
            y: root.compact ? header.y + header.height + 30 : header.y + header.height + (footer.y - header.y - header.height - height) / 2
            readonly property real middleWidth: width - 210 - (root.medium ? 32 : 304)

            Item {
                id: title
                objectName: "folioTitle"
                width: root.compact ? parent.width : 210
                height: root.compact ? 151.6 : root.medium ? 166.2 : 199.2
                y: root.compact ? 0 : root.medium ? 130 + (180 - height) / 2 : parent.height - height

                LockText {
                    id: latin
                    text: "Type 17"
                    color: root.paper
                    font.family: "EB Garamond"
                    font.pixelSize: root.compact ? 52 : root.medium ? 54 : 62
                    font.letterSpacing: root.compact ? 1 : -2
                    height: font.pixelSize
                    verticalAlignment: Text.AlignVCenter
                }
                LockText {
                    id: japanese
                    y: latin.height + (root.compact ? 12 : 20)
                    text: "継衛"
                    color: root.paper
                    font.family: "Noto Serif CJK JP"
                    font.pixelSize: root.compact ? 30 : 42
                    font.letterSpacing: root.compact ? 6 : 8
                    height: root.compact ? 39 : 54.6
                    verticalAlignment: Text.AlignVCenter
                }
                LockText {
                    y: japanese.y + japanese.height + (root.compact ? 12 : 20)
                    text: "SID0NIA / 15"
                    color: root.muted
                    font.letterSpacing: 1
                    height: 17.6
                    verticalAlignment: Text.AlignVCenter
                }
                Rectangle {
                    visible: root.compact
                    width: parent.width
                    height: 1
                    anchors.bottom: parent.bottom
                    color: root.line
                }
            }

            Item {
                id: bay
                objectName: "folioBay"
                width: root.compact ? parent.width : Math.min(360, composition.middleWidth)
                height: width + (root.compact ? 36.4 : 40.4)
                x: root.compact ? 0 : 242 + (composition.middleWidth - width) / 2
                y: root.compact ? title.height + 24 : (composition.height - height) / 2

                LockArtwork {
                    objectName: "glyphArtwork"
                    width: parent.width
                    height: width
                    phase: root.phase
                    emphasis: root.emphasis
                }
                Rectangle {
                    width: parent.width
                    height: 1
                    y: parent.width + (root.compact ? 8 : 12)
                    color: root.line
                }
                LockText {
                    y: parent.width + (root.compact ? 21 : 25)
                    text: "A"
                    color: "#d1161c"
                    font.letterSpacing: 1
                }
                LockText {
                    anchors.right: parent.right
                    y: parent.width + (root.compact ? 21 : 25)
                    text: "RELAY TILES"
                    color: root.muted
                    font.letterSpacing: 1
                }
            }

            LockClock {
                id: clock
                objectName: "folioClock"
                y: root.compact ? bay.y + bay.height + 24 : 0
                width: root.compact ? parent.width : 210
                height: implicitHeight
                folio: true
                compact: root.compact
                size: root.compact ? 48 : 76
                paper: root.paper
                muted: root.muted
            }

            Item {
                id: entry
                objectName: "folioEntry"
                x: root.compact || root.medium ? 0 : parent.width - width
                y: root.compact ? clock.y + clock.height + 24 : parent.height - height
                width: root.compact ? parent.width : root.medium ? 210 : 240
                height: auth.y + auth.height

                Rectangle {
                    width: root.compact || root.medium ? parent.width : 1
                    height: root.compact || root.medium ? 1 : parent.height
                    color: root.line
                }
                LockAuth {
                    id: auth
                compact: root.compact
                    x: root.compact || root.medium ? 0 : 19
                    y: root.compact ? 19 : root.medium ? 17 : 18
                    width: parent.width - x
                    height: implicitHeight
                    session: controller
                    paperLayout: true
                    paper: root.paper
                    muted: root.muted
                    line: root.line
                    ground: root.color
                }
            }
        }

        LockFooter {
            id: footer
            session: controller
            x: root.compact ? 20 : 32
            y: parent.height - height - 24
            width: parent.width - x * 2
            height: implicitHeight
            paper: root.paper
            muted: root.muted
            line: root.line
        }
    }

    LockOverlay {
        anchors.fill: parent
        session: controller
        paper: root.paper
        muted: root.muted
        line: root.line
        ground: root.color
    }
}
