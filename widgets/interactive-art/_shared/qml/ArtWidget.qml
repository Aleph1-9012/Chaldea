// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Layouts
import "ArtEngine.js" as Art

Item {
    id: root
    property bool coordinateGrid: true
    property string pointDetail: "Fine"
    property color accentColor: "#cc1515"
    property bool compactCanvas: false
    property bool particleTrails: true
    property real fishDetail: 1
    property bool paused: false
    property var audioDriver: null
    readonly property var engine: session.engine
    readonly property string frameStyle: engine ? engine.meta.style : "lab"
    readonly property string heading: engine ? engine.meta.title : ""
    readonly property string fontFamily: frameStyle === "lab" ? "Share Tech Mono" : "JetBrains Mono"
    readonly property bool running: {
        const update = session.revision + session.frame;
        return visible && !!engine && !paused && engine.needsMotion();
    }
    readonly property string statusText: session.status
    implicitWidth: 740
    implicitHeight: frame.height + (footer.visible ? footer.implicitHeight + 8 : 0)
    QtObject {
        id: session
        property var engine: null
        property int revision: 0
        property int frame: 0
        property var fieldKeys: []
        property var buttonKeys: []
        property var archives: []
        property string status: ""
        property string hint: ""
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
        session.hint = engine.meta.hint;
        paused = engine.paused;
        const archive = engine.archives();
        if (archive.length !== session.archives.length) session.archives = archive;
        drawing.requestPaint();
    }
    function configure(): void {
        if (!engine) return;
        engine.configure({grid:coordinateGrid, density:pointDetail, accent:String(accentColor), compact:compactCanvas, trails:particleTrails, detail:fishDetail});
        drawing.requestPaint();
    }
    function act(key: string, value: var): void {
        if (!engine) return;
        const focus = engine.action(key, value);
        refresh();
        if (focus) {
            for (let i = 0; i < fields.count; i++) {
                const field = fields.itemAt(i) as ArtField;
                if (field.control.key === focus) field.focusInput();
            }
        }
    }
    function point(kind: string, x: real, y: real): void {
        if (!engine) return;
        engine.pointer(kind, x, y, Date.now()); refresh();
    }
    function keyAction(key: string): void { if (engine) { engine.key(key); refresh(); } }
    onCoordinateGridChanged: configure()
    onPointDetailChanged: configure()
    onAccentColorChanged: configure()
    onCompactCanvasChanged: configure()
    onParticleTrailsChanged: configure()
    onFishDetailChanged: configure()
    onPausedChanged: {
        if (engine) { engine.setPaused(paused); session.elapsed = 0; session.lastTick = Date.now(); refresh(); }
    }
    onVisibleChanged: {
        if (engine && !visible) { engine.suspend(); session.elapsed = 0; refresh(); }
        session.lastTick = Date.now();
    }
    Component.onCompleted: {
        session.engine = Art.createArtEngine(audioDriver);
        engine.setPaused(paused);
        const fieldKeys = [];
        const buttonKeys = [];

        for (const control of engine.controls()) {
            if (control.type !== "button") fieldKeys.push(control.key);
            else if (control.key !== engine.meta.inlineAction) buttonKeys.push(control.key);
        }

        session.fieldKeys = fieldKeys;
        session.buttonKeys = buttonKeys;
        session.lastTick = Date.now();
        configure(); refresh();
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
        property int inset: root.frameStyle === "lab" ? 6 : root.width < 520 ? 14 : 21
        width: parent.width
        height: main.implicitHeight + inset * 2
        color: root.frameStyle === "lab" ? "#0a0a0a" : "#080808"
        border.width: 0
        Rectangle { width: 7; height: 1; color: "#e8e8e8" }
        Rectangle { width: 1; height: 7; color: "#e8e8e8" }
        ColumnLayout {
            id: main
            x: frame.inset; y: frame.inset
            width: Math.max(0, parent.width - frame.inset * 2)
            spacing: 0
            RowLayout {
                visible: root.frameStyle !== "fish"
                Layout.fillWidth: true
                Layout.margins: root.frameStyle === "lab" ? 16 : 0
                Layout.bottomMargin: 15
                spacing: 8
                ArtText { text: root.engine ? root.engine.meta.brand : ""; font.family: root.fontFamily; font.pixelSize: root.frameStyle === "lab" ? 14 : 11; font.letterSpacing: 1.5; Layout.fillWidth: true }
                ArtText { text: root.frameStyle === "lab" ? "INTERACTIVE PREVIEW" : "704"; font.pixelSize: 11; color: "#a0a0a0" }
            }
            Rectangle { visible: root.frameStyle === "lab"; Layout.fillWidth: true; implicitHeight: 1; color: "#492020" }
            RowLayout {
                visible: root.frameStyle !== "fish"
                Layout.fillWidth: true
                Layout.leftMargin: root.frameStyle === "lab" ? 16 : 0
                Layout.rightMargin: root.frameStyle === "lab" ? 16 : 0
                Layout.topMargin: root.frameStyle === "lab" ? 14 : 20
                Layout.bottomMargin: 8
                ArtText { text: root.heading; font.family: root.fontFamily; font.pixelSize: root.frameStyle === "lab" ? 18 : 16; font.letterSpacing: root.frameStyle === "lab" ? .3 : 2; Layout.fillWidth: true }
                ArtButton {
                    visible: root.frameStyle === "lab"
                    objectName: "pauseTop"
                    text: root.paused ? "Resume motion" : "Pause motion"
                    implicitHeight: 32; font.pixelSize: 11
                    accent: root.accentColor
                    onClicked: root.paused = !root.paused
                }
            }
            Item {
                id: scene
                objectName: "artScene"
                Layout.fillWidth: true
                Layout.topMargin: root.frameStyle === "fish" ? 21 : 0
                Layout.preferredHeight: root.frameStyle === "lab" ? Math.max(300, Math.min(380, root.width * .52)) : root.compactCanvas ? 320 : root.width < 520 ? 390 : root.frameStyle === "fish" ? 414 : 410
                clip: true
                activeFocusOnTab: true
                Accessible.role: Accessible.Graphic
                Accessible.name: root.heading + ". " + session.hint + " Controls are below."
                onWidthChanged: drawing.requestPaint()
                onHeightChanged: drawing.requestPaint()
                Keys.onEscapePressed: root.keyAction("Escape")
                Keys.onReturnPressed: event => { if (root.frameStyle === "fish") root.keyAction("activate"); else event.accepted = false; }
                Keys.onSpacePressed: event => { if (root.frameStyle === "fish") root.keyAction("activate"); else event.accepted = false; }
                Canvas {
                    id: drawing
                    width: scene.width * 2; height: scene.height * 2
                    scale: .5; transformOrigin: Item.TopLeft
                    onPaint: {
                        if (!root.engine || scene.width < 1 || scene.height < 1) return;
                        const ctx = getContext("2d"); ctx.reset(); ctx.setTransform(2, 0, 0, 2, 0, 0);
                        const elapsed = root.running ? session.elapsed : 0;
                        session.elapsed = 0;
                        root.engine.render(ctx, scene.width, scene.height, elapsed);
                        session.frame = (session.frame + 1) % 1000000;
                        if (root.engine.status() !== session.status) root.refresh();
                    }
                }
                ArtText { visible: root.frameStyle === "lab"; x: 16; y: 4; width: parent.width - 32; text: session.hint; font.family: root.fontFamily; color: "#a0a0a0" }
                Row {
                    visible: root.frameStyle === "fish"
                    y: 1; spacing: 9
                    ArtText { text: "01"; color: root.accentColor; font.pixelSize: 11 }
                    ArtText { text: "DRIFT"; font.letterSpacing: 2.5 }
                }
                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: root.frameStyle !== "fish"
                    preventStealing: root.frameStyle !== "fish"
                    cursorShape: root.frameStyle === "fish" ? Qt.ArrowCursor : Qt.CrossCursor
                    onPressed: mouse => { scene.forceActiveFocus(Qt.MouseFocusReason); root.point("down", mouse.x, mouse.y); }
                    onPositionChanged: mouse => { if (root.frameStyle !== "fish") root.point("move", mouse.x, mouse.y); }
                    onReleased: mouse => root.point("up", mouse.x, mouse.y)
                    onClicked: mouse => { if (root.frameStyle === "fish") root.point("click", mouse.x, mouse.y); }
                    onCanceled: root.point("up", 0, 0)
                    onExited: root.point("leave", 0, 0)
                }
                Rectangle { anchors.fill: parent; visible: scene.activeFocus; color: "transparent"; border.color: "#969696" }
            }
            Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: "#372323" }
            ColumnLayout {
                Layout.fillWidth: true
                Layout.margins: root.frameStyle === "lab" ? 16 : 0
                Layout.topMargin: 14
                spacing: 12
                GridLayout {
                    uniformCellWidths: true
                    visible: session.fieldKeys.length > 0
                    Layout.fillWidth: true
                    columns: root.frameStyle === "plate" ? Math.max(1, Math.min(root.engine ? root.engine.meta.fields : 1, Math.floor(main.width / 130))) : root.width < 480 && root.engine && root.engine.meta.fields === 3 ? 1 : Math.max(1, root.engine ? root.engine.meta.fields : 1)
                    columnSpacing: 14; rowSpacing: 10
                    Repeater {
                        id: fields
                        model: session.fieldKeys
                        delegate: ArtField {
                            required property string modelData
                            Layout.fillWidth: true
                            Layout.minimumWidth: 0
                            Layout.preferredWidth: 1
                            control: { const revision = session.revision; return root.descriptor(modelData); }
                            accent: root.accentColor
                            fontFamily: root.fontFamily
                            onEdited: (key, value) => root.act(key, value)
                        }
                    }
                    ArtButton {
                        readonly property var control: { const revision = session.revision; return root.engine && root.engine.meta.inlineAction ? root.descriptor(root.engine.meta.inlineAction) : {}; }
                        visible: !!(root.engine && root.engine.meta.inlineAction)
                        objectName: "action-" + (root.engine ? root.engine.meta.inlineAction || "" : "")
                        Layout.alignment: Qt.AlignBottom
                        text: control.label || ""
                        enabled: !control.disabled
                        accent: root.accentColor
                        onClicked: root.act(control.key, undefined)
                    }
                }
                RowLayout {
                    visible: session.buttonKeys.length > 0
                    Layout.fillWidth: true
                    Flow {
                        Layout.fillWidth: true
                        spacing: 8
                        Repeater {
                            model: session.buttonKeys
                            delegate: ArtButton {
                                required property string modelData
                                readonly property var control: { const revision = session.revision; return root.descriptor(modelData); }
                                objectName: "action-" + modelData
                                text: control.label
                                visible: !control.hidden
                                enabled: !control.disabled
                                selected: !!control.pressed
                                accent: root.accentColor
                                font.family: root.fontFamily
                                width: Math.min(implicitWidth, parent.width)
                                onClicked: root.act(modelData, undefined)
                            }
                        }
                    }
                    ArtButton { visible: root.frameStyle === "fish"; objectName: "pauseFish"; text: root.paused ? "PLAY" : "PAUSE"; onClicked: root.paused = !root.paused }
                }
                Flow {
                    visible: session.archives.length > 0
                    Layout.fillWidth: true
                    spacing: 6
                    Repeater {
                        model: session.archives
                        delegate: ArtButton {
                            required property var modelData
                            text: modelData.label
                            objectName: modelData.key
                            width: Math.min(implicitWidth, parent.width)
                            implicitHeight: Math.max(32, contentItem.implicitHeight + 16)
                            accent: root.accentColor
                            onClicked: root.act(modelData.key, undefined)
                        }
                    }
                }
            }
            Rectangle { visible: root.frameStyle === "lab"; Layout.fillWidth: true; implicitHeight: 1; color: "#492020" }
            RowLayout {
                Layout.fillWidth: true
                Layout.margins: root.frameStyle === "lab" ? 12 : 0
                Layout.topMargin: 13
                spacing: 10
                Rectangle { visible: root.frameStyle === "lab"; implicitWidth: 5; implicitHeight: 5; Layout.alignment: Qt.AlignTop; Layout.topMargin: 5; color: root.accentColor }
                ArtText { objectName: "artStatus"; Layout.fillWidth: true; text: root.statusText; color: "#bdb8ad"; font.family: root.fontFamily; font.pixelSize: root.frameStyle === "lab" ? 12 : 11; Accessible.name: text }
                ArtButton { visible: root.frameStyle === "plate"; objectName: "pausePlate"; text: root.paused ? "PLAY" : "PAUSE"; onClicked: root.paused = !root.paused }
                ArtText { visible: root.frameStyle === "fish"; text: "NO. 704"; color: root.accentColor; font.pixelSize: 11 }
            }
            ArtText { visible: root.frameStyle !== "lab"; Layout.fillWidth: true; Layout.topMargin: 5; text: session.hint; color: "#969696"; font.pixelSize: 11 }
        }
    }
    ArtText {
        id: footer
        visible: root.frameStyle === "lab"
        y: frame.height + 8
        width: parent.width
        text: "BLACK / BONE / SIGNAL RED                 SIMULATED DATA · NO DESKTOP CHANGES"
        color: "#a0a0a0"; font.family: root.fontFamily; font.pixelSize: 11
    }
}
