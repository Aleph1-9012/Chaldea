// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick

Rectangle {
    id: root
    property int transitionTime: 100
    property int emphasis: 100
    property bool animationEnabled: true
    readonly property bool narrow: width <= 672
    readonly property bool medium: width <= 802
    readonly property int inputLength: controller.length
    readonly property real phase: controller.phase
    readonly property bool previewing: controller.previewing
    readonly property string powerAction: controller.powerAction
    readonly property string statusText: controller.status
    signal previewRequested(int length)
    signal powerRequested(string action)
    implicitWidth: 1000
    implicitHeight: Math.max(600, header.y + header.height + 64 + composition.height + footer.height + 24)
    color: "#090909"
    border.color: "#282726"
    clip: true

    function focusInput(): void { controller.focusInput(); }
    function setInputLength(length: int): void { controller.setInputLength(length); }
    function replay(): void { controller.replay(); }

    LockSession {
        id: controller
        input: auth.input
        reactive: true
        transitionTime: root.transitionTime
        animationEnabled: root.animationEnabled
        onPreviewRequested: length => root.previewRequested(length)
        onPowerRequested: action => root.powerRequested(action)
    }
    Canvas {
        anchors.fill: parent
        opacity: .12
        onWidthChanged: requestPaint()
        onHeightChanged: requestPaint()
        onPaint: {
            const ctx = getContext("2d");
            ctx.reset();
            const fade = ctx.createLinearGradient(0, 0, width * .42, 0);
            fade.addColorStop(0, "#ad1a20");
            fade.addColorStop(1, "transparent");
            ctx.strokeStyle = fade;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = .5; x <= width * .42; x += 24) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for (let y = .5; y < height; y += 24) { ctx.moveTo(0, y); ctx.lineTo(width * .42, y); }
            ctx.stroke();
        }
    }
    Item {
        x: 13; y: 13; width: 20; height: 20
        Rectangle { width: 20; height: 1; color: "#d1161c" }
        Rectangle { width: 1; height: 20; color: "#d1161c" }
    }
    Item {
        x: parent.width - 33; y: parent.height - 33; width: 20; height: 20
        Rectangle { y: 19; width: 20; height: 1; color: "#d1161c" }
        Rectangle { x: 19; width: 1; height: 20; color: "#d1161c" }
    }
    Item {
        anchors.fill: parent
        enabled: !controller.powerAction
        LockHeader {
            id: header
            x: root.narrow ? 23 : 33
            y: root.narrow ? 25 : 27
            width: parent.width - x * 2
            height: implicitHeight
            reactive: true
            compact: root.narrow
            muted: "#93918b"
        }
        Item {
            id: composition
            x: (root.width - width) / 2
            y: header.y + header.height + 32 + Math.max(0, (footer.y - header.y - header.height - 64 - height) / 2)
            width: Math.max(0, Math.min(root.narrow ? 380 : 650, root.width - 2 - (root.narrow ? 44 : root.medium ? 68 : 120)))
            height: root.narrow ? clock.height + bay.height + auth.height + 52 : Math.max(clock.height + auth.height + 24, bay.height)
            readonly property real leftWidth: root.narrow ? width : Math.min(root.medium ? 265 : 285, width - 277 - (root.medium ? 36 : 40))
            Item {
                id: clock
                width: composition.leftWidth
                height: 49 + time.height
                Row {
                    anchors.horizontalCenter: root.narrow ? parent.horizontalCenter : undefined
                    spacing: 9
                    Rectangle { width: 6; height: 6; anchors.verticalCenter: parent.verticalCenter; color: "#d1161c" }
                    LockText { text: "SESSION LOCKED"; font.letterSpacing: 1.7; color: "#93918b" }
                }
                Row {
                    id: time
                    anchors.horizontalCenter: root.narrow ? parent.horizontalCenter : undefined
                    y: 24.5
                    property real fontSize: root.narrow ? 76 : Math.max(64, Math.min(90, (root.width - 2) * .09))
                    height: fontSize * 1.2
                    Repeater {
                        model: ["21", ":", "04"]
                        LockText {
                            required property string modelData
                            text: modelData
                            font.pixelSize: time.fontSize
                            font.letterSpacing: -6
                            color: text === ":" ? "#d1161c" : "#e4e2dc"
                            height: time.height
                            verticalAlignment: Text.AlignVCenter
                        }
                    }
                }
                Row {
                    y: time.y + time.height + 8
                    anchors.horizontalCenter: root.narrow ? parent.horizontalCenter : undefined
                    spacing: 8
                    LockText { text: "SAT"; font.letterSpacing: .3; color: "#93918b" }
                    LockText { text: "//"; color: "#d1161c" }
                    LockText { text: "12 SEPTEMBER 2026"; font.letterSpacing: .3; color: "#93918b" }
                }
            }
            LockAuth {
                id: auth
                session: controller
                reactive: true
                muted: "#93918b"
                line: "#343330"
                width: composition.leftWidth
                y: root.narrow ? bay.y + bay.height + 26 : clock.height + 24
                height: implicitHeight
            }
            Item {
                id: bay
                width: root.narrow ? 252 : 277
                height: 357.5
                x: root.narrow ? (composition.width - width) / 2 : composition.width - width
                y: root.narrow ? clock.height + 26 : (composition.height - height) / 2
                Rectangle { visible: !root.narrow; width: 1; height: parent.height; color: "#343330" }
                Item {
                    x: root.narrow ? 0 : 25
                    width: 252; height: parent.height
                    LockText {
                        text: "継衛"; font.family: "Noto Sans CJK JP"; font.pixelSize: 28; font.letterSpacing: 7
                        color: "#e4e2dc"; height: 42; verticalAlignment: Text.AlignVCenter
                    }
                    LockText {
                        anchors.right: parent.right; y: 21
                        text: "一七式衛人"; font.family: "Noto Sans CJK JP"; font.pixelSize: 12; font.letterSpacing: 3
                        color: "#93918b"
                    }
                    Rectangle { y: 60; width: 252; height: 252; color: "#090909" }
                    LockArtwork {
                        objectName: "glyphArtwork"
                        y: 60; width: 252; height: 252
                        phase: root.phase
                        emphasis: root.emphasis
                    }
                    Row {
                        y: 330; spacing: 14
                        Repeater {
                            model: 4
                            Item {
                                required property int index
                                width: 52.5; height: 27.5
                                Rectangle { width: parent.width; height: 1; color: parent.index === 3 ? "#d1161c" : "#343330" }
                                LockText { y: 11; text: "0" + (parent.index + 1) + (parent.index === 3 ? " ◆" : ""); color: parent.index === 3 ? "#e53136" : "#93918b" }
                            }
                        }
                    }
                }
            }
        }
        LockFooter {
            id: footer
            session: controller
            reactive: true
            x: root.narrow ? 23 : 33
            y: root.height - height - 24
            width: root.width - x * 2
            height: implicitHeight
            muted: "#93918b"
            line: "#343330"
        }
    }
    LockOverlay {
        anchors.fill: parent
        session: controller
        reactive: true
        muted: "#93918b"
        line: "#343330"
    }
}
