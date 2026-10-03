// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Layouts
import "ArtEngine.js" as Art

Item {
    id: root
    property color paperColor: "#ffffff"
    property color inkColor: "#0c0c0f"
    property string threadDetail: "Fine"
    property bool compactCanvas: false
    property bool paused: false
    // Buffer pixels per logical pixel. The ink is drawn pixel by pixel in JavaScript, so lower is faster.
    property real pixelScale: .5
    readonly property var engine: session.engine
    readonly property bool running: visible && !!engine && !paused
    readonly property string statusText: session.status
    readonly property color dimColor: Qt.rgba(inkColor.r, inkColor.g, inkColor.b, .6)
    readonly property color lineColor: Qt.rgba(inkColor.r, inkColor.g, inkColor.b, .16)
    readonly property string monoFamily: "JetBrains Mono"
    readonly property string serifFamily: "Palatino"
    implicitWidth: 740
    implicitHeight: frame.height

    QtObject {
        id: session
        property var engine: null
        property int revision: 0
        property var fieldKeys: []
        property var buttonKeys: []
        property string status: ""
        property real elapsed: 0
        property real lastTick: 0
    }

    function descriptor(key: string): var {
        const update = session.revision;
        return Object.assign({}, engine.controls().find(c => c.key === key) || {});
    }
    function refresh(): void {
        if (!engine) return;
        session.revision++;
        session.status = engine.status();
        drawing.requestPaint();
    }
    function configure(): void {
        if (!engine) return;
        engine.configure({paper: String(paperColor), ink: String(inkColor), detail: threadDetail});
        drawing.requestPaint();
    }
    function act(key: string, value: var): void {
        if (!engine) return;
        engine.action(key, value);
        refresh();
    }
    function point(kind: string, x: real, y: real): void {
        if (!engine) return;
        engine.pointer(kind, x, y, Date.now());
        if (engine.status() !== session.status) session.status = engine.status();
        if (!running) drawing.requestPaint();
    }
    function keyAction(name: string): void { if (engine) { engine.key(name); refresh(); } }

    onPaperColorChanged: configure()
    onInkColorChanged: configure()
    onThreadDetailChanged: configure()
    onPausedChanged: {
        if (!engine) return;
        engine.setPaused(paused);
        session.elapsed = 0;
        session.lastTick = Date.now();
        session.status = paused ? "Animation paused. Controls still redraw the ink." : "Animation playing.";
        drawing.requestPaint();
    }
    onVisibleChanged: {
        if (engine && !visible) { engine.suspend(); session.elapsed = 0; }
        session.lastTick = Date.now();
    }
    Component.onCompleted: {
        session.engine = Art.createArtEngine();
        engine.setPaused(paused);
        const fieldKeys = [];
        const buttonKeys = [];
        for (const control of engine.controls()) {
            if (control.type === "button") buttonKeys.push(control.key);
            else fieldKeys.push(control.key);
        }
        session.fieldKeys = fieldKeys;
        session.buttonKeys = buttonKeys;
        session.lastTick = Date.now();
        configure();
        refresh();
    }
    Component.onDestruction: { if (engine) engine.suspend(); }

    Timer {
        interval: 33
        repeat: true
        running: root.running
        onRunningChanged: session.lastTick = Date.now()
        onTriggered: {
            const now = Date.now();
            session.elapsed += Math.min(.06, Math.max(0, (now - session.lastTick) / 1000));
            session.lastTick = now;
            drawing.requestPaint();
        }
    }

    Rectangle {
        id: frame
        property int inset: root.width < 520 ? 14 : 22
        width: parent.width
        height: main.implicitHeight + inset * 2
        color: root.paperColor
        ColumnLayout {
            id: main
            x: frame.inset; y: frame.inset
            width: Math.max(0, parent.width - frame.inset * 2)
            spacing: 0
            RowLayout {
                Layout.fillWidth: true
                spacing: 12
                InkText { text: root.engine ? root.engine.meta.brand : ""; color: root.dimColor; font.family: root.monoFamily; font.pixelSize: 11; font.letterSpacing: root.width < 520 ? 1 : 2; Layout.fillWidth: true }
                InkText { text: "RULE × CHAOS"; color: root.dimColor; font.family: root.monoFamily; font.pixelSize: 11; font.letterSpacing: root.width < 520 ? 1 : 2 }
            }
            InkText {
                Layout.fillWidth: true
                Layout.topMargin: 14
                text: "Stochastic ink"
                color: root.inkColor
                font.family: root.serifFamily
                font.italic: true
                font.pixelSize: 26
            }
            InkText {
                Layout.fillWidth: true
                Layout.topMargin: 4
                Layout.bottomMargin: 12
                text: "Precise loops drawn on a pulse. Chaos takes them apart into ink."
                color: root.dimColor
                font.family: root.monoFamily
                font.pixelSize: 11
            }
            Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.lineColor }
            Item {
                id: scene
                objectName: "inkScene"
                Layout.fillWidth: true
                Layout.preferredHeight: root.compactCanvas ? 340 : root.width < 520 ? 400 : 460
                clip: true
                activeFocusOnTab: true
                Accessible.role: Accessible.Graphic
                Accessible.name: "Stochastic ink. " + (root.engine ? root.engine.meta.hint : "") + " Controls are below."
                onWidthChanged: drawing.requestPaint()
                onHeightChanged: drawing.requestPaint()
                Keys.onPressed: event => {
                    const names = {};
                    names[Qt.Key_Left] = "ArrowLeft";
                    names[Qt.Key_Right] = "ArrowRight";
                    names[Qt.Key_Up] = "ArrowUp";
                    names[Qt.Key_Down] = "ArrowDown";
                    names[Qt.Key_Return] = "Enter";
                    names[Qt.Key_Enter] = "Enter";
                    names[Qt.Key_Space] = " ";
                    names[Qt.Key_Escape] = "Escape";
                    if (names[event.key] === undefined) return;
                    root.keyAction(names[event.key]);
                    event.accepted = true;
                }
                Canvas {
                    id: drawing
                    width: Math.max(8, Math.round(scene.width * root.pixelScale))
                    height: Math.max(8, Math.round(scene.height * root.pixelScale))
                    scale: scene.width > 0 ? scene.width / width : 1
                    transformOrigin: Item.TopLeft
                    smooth: true
                    onPaint: {
                        if (!root.engine || scene.width < 1 || scene.height < 1) return;
                        const ctx = getContext("2d");
                        const elapsed = root.running ? session.elapsed : 0;
                        session.elapsed = 0;
                        root.engine.render(ctx, scene.width, scene.height, elapsed, width / scene.width);
                        if (root.engine.status() !== session.status) session.status = root.engine.status();
                    }
                }
                MouseArea {
                    anchors.fill: parent
                    preventStealing: true
                    cursorShape: Qt.CrossCursor
                    onPressed: mouse => { scene.forceActiveFocus(Qt.MouseFocusReason); root.point("down", mouse.x, mouse.y); }
                    onPositionChanged: mouse => root.point("move", mouse.x, mouse.y)
                    onReleased: mouse => root.point("up", mouse.x, mouse.y)
                    onCanceled: root.point("cancel", 0, 0)
                }
                Rectangle { anchors.fill: parent; visible: scene.activeFocus; color: "transparent"; border.color: root.inkColor; border.width: 2 }
            }
            Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.lineColor }
            GridLayout {
                Layout.fillWidth: true
                Layout.topMargin: 16
                uniformCellWidths: true
                columns: Math.max(1, Math.min(session.fieldKeys.length, Math.floor(main.width / 148)))
                columnSpacing: 16; rowSpacing: 12
                Repeater {
                    model: session.fieldKeys
                    delegate: InkField {
                        required property string modelData
                        Layout.fillWidth: true
                        Layout.minimumWidth: 0
                        Layout.preferredWidth: 1
                        control: { const revision = session.revision; return root.descriptor(modelData); }
                        ink: root.inkColor
                        paper: root.paperColor
                        fontFamily: root.monoFamily
                        onEdited: (key, value) => root.act(key, value)
                    }
                }
            }
            Flow {
                Layout.fillWidth: true
                Layout.topMargin: 14
                spacing: 8
                Repeater {
                    model: session.buttonKeys
                    delegate: InkButton {
                        required property string modelData
                        readonly property var control: { const revision = session.revision; return root.descriptor(modelData); }
                        objectName: "action-" + modelData
                        text: control.label || ""
                        ink: root.inkColor
                        paper: root.paperColor
                        font.family: root.monoFamily
                        onClicked: root.act(modelData, undefined)
                    }
                }
            }
            Rectangle { Layout.fillWidth: true; Layout.topMargin: 14; implicitHeight: 1; color: root.lineColor }
            RowLayout {
                Layout.fillWidth: true
                Layout.topMargin: 12
                spacing: 16
                InkText { objectName: "inkStatus"; Layout.fillWidth: true; text: root.statusText; color: root.inkColor; font.family: root.monoFamily; font.pixelSize: 11; Accessible.role: Accessible.StatusBar; Accessible.name: text }
                InkButton {
                    objectName: "pause"
                    text: root.paused ? "PLAY" : "PAUSE"
                    selected: root.paused
                    ink: root.inkColor
                    paper: root.paperColor
                    font.family: root.monoFamily
                    implicitWidth: Math.max(76, contentItem.implicitWidth + 28)
                    onClicked: root.paused = !root.paused
                }
            }
            InkText {
                Layout.fillWidth: true
                Layout.topMargin: 6
                text: root.engine ? root.engine.meta.hint : ""
                color: root.dimColor
                font.family: root.monoFamily
                font.pixelSize: 11
            }
        }
    }
}
