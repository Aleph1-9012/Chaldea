// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Layouts
import QtQuick.Window
import QtQuick3D
import QtQuick3D.Helpers
import "ArtEngine.js" as Art

// ArtEngine.js runs the scene; Qt Quick 3D draws it. Every instance of one small quad is a point
// of ink, placed and blurred on the GPU by ink.vert from the line table the engine writes each frame.
Item {
    id: root
    property color paperColor: "#ffffff"
    property color inkColor: "#0c0c0f"
    property string threadDetail: "Fine"
    property bool compactCanvas: false
    property bool paused: false
    readonly property var engine: session.engine
    readonly property bool running: visible && !!engine && !paused
    readonly property string statusText: session.status
    readonly property color dimColor: Qt.rgba(inkColor.r, inkColor.g, inkColor.b, .6)
    readonly property color lineColor: Qt.rgba(inkColor.r, inkColor.g, inkColor.b, .16)
    readonly property string monoFamily: "JetBrains Mono"
    readonly property string serifFamily: "Palatino"
    // ink.vert hard-codes this point layout; it must equal the sum over Art.INK_GROUPS.
    readonly property int pointCount: 250880
    implicitWidth: 740
    implicitHeight: frame.height

    QtObject {
        id: session
        property var engine: null
        property int revision: 0
        property var fieldKeys: []
        property var buttonKeys: []
        property string status: ""
        property real lastTick: 0
    }

    function descriptor(key: string): var {
        const update = session.revision;
        return Object.assign({}, engine.controls().find(c => c.key === key) || {});
    }
    // Advance the scene, then hand the GPU the new line table, camera, and uniforms.
    function sync(elapsed: real): void {
        if (!engine || view.width < 1 || view.height < 1) return;
        engine.advance(elapsed);
        const ratio = Screen.devicePixelRatio > 0 ? Screen.devicePixelRatio : 1;
        const w = Math.max(1, Math.round(view.width * ratio));
        const h = Math.max(1, Math.round(view.height * ratio));
        const u = engine.frame(w, h);
        lineTable.textureData = engine.table.slice().buffer;
        camera.position = Qt.vector3d(engine.eye[0], engine.eye[1], engine.eye[2]);
        camera.lookAt(Qt.vector3d(engine.target[0], engine.target[1], engine.target[2]));
        ink.uViewport = Qt.vector2d(w, h);
        ink.uTime = u.time;
        ink.uFocus = u.focus;
        ink.uAperture = u.aperture;
        ink.uMinR = u.minRadius;
        ink.uMaxR = u.maxRadius;
        ink.uLod = u.lodArea;
        ink.uInk = u.inkScale;
        ink.uKeep = u.keep;
        ink.uDrift = u.drift;
        ink.uInkColor = Qt.vector3d(u.ink[0], u.ink[1], u.ink[2]);
        if (engine.status() !== session.status) session.status = engine.status();
    }
    function refresh(): void {
        if (!engine) return;
        session.revision++;
        session.status = engine.status();
        sync(0);
    }
    function configure(): void {
        if (!engine) return;
        engine.configure({paper: String(paperColor), ink: String(inkColor), detail: threadDetail});
        sync(0);
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
        if (!running) sync(0);
    }
    function keyAction(name: string): void { if (engine) { engine.key(name); refresh(); } }

    onPaperColorChanged: configure()
    onInkColorChanged: configure()
    onThreadDetailChanged: configure()
    onPausedChanged: {
        if (!engine) return;
        engine.setPaused(paused);
        session.lastTick = Date.now();
        session.status = paused ? "Animation paused. Controls still redraw the ink." : "Animation playing.";
        sync(0);
    }
    onVisibleChanged: {
        if (engine && !visible) engine.suspend();
        session.lastTick = Date.now();
    }
    Component.onCompleted: {
        let points = 0;
        for (const group of Art.INK_GROUPS) points += group.lines * group.points;
        if (points !== pointCount) console.warn("Stochastic ink: ArtEngine.js layout has " + points + " points, but ink.vert expects " + pointCount + ".");
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
            const elapsed = Math.min(.06, Math.max(0, (now - session.lastTick) / 1000));
            session.lastTick = now;
            root.sync(elapsed);
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
                text: "Precise curves drawn on the beat. Chaos frays them into ink."
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
                onWidthChanged: root.sync(0)
                onHeightChanged: root.sync(0)
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
                View3D {
                    id: view
                    anchors.fill: parent
                    camera: camera
                    environment: SceneEnvironment {
                        backgroundMode: SceneEnvironment.Color
                        clearColor: root.paperColor
                        // Colors go out exactly as given, the way the browser preview mixes them.
                        tonemapMode: SceneEnvironment.TonemapModeNone
                        antialiasingMode: SceneEnvironment.NoAA
                    }
                    PerspectiveCamera {
                        id: camera
                        fieldOfView: 38
                        clipNear: 0.05
                        clipFar: 50
                    }
                    Model {
                        source: "#Rectangle"
                        // The instances only supply a count and generous bounds; ink.vert places every point.
                        instancing: RandomInstancing {
                            instanceCount: root.pointCount
                            randomSeed: 1
                            position: InstanceRange { from: Qt.vector3d(-3, -3, -3); to: Qt.vector3d(3, 3, 3) }
                        }
                        materials: CustomMaterial {
                            id: ink
                            shadingMode: CustomMaterial.Unshaded
                            cullMode: Material.NoCulling
                            // "Over" with one ink color gives the same result in any drawing order.
                            sourceBlend: CustomMaterial.SrcAlpha
                            destinationBlend: CustomMaterial.OneMinusSrcAlpha
                            vertexShader: "ink.vert"
                            fragmentShader: "ink.frag"
                            property TextureInput uLines: TextureInput {
                                texture: Texture {
                                    minFilter: Texture.Nearest
                                    magFilter: Texture.Nearest
                                    mipFilter: Texture.None
                                    textureData: ProceduralTextureData {
                                        id: lineTable
                                        width: Art.INK_TEXELS
                                        height: Art.INK_LINES
                                        format: ProceduralTextureData.RGBA32F
                                    }
                                }
                            }
                            property vector2d uViewport: Qt.vector2d(1, 1)
                            property real uTime: 0
                            property real uFocus: 2.75
                            property real uAperture: 0.08
                            property real uMinR: 1
                            property real uMaxR: 26
                            property real uLod: 2.2
                            property real uInk: 0.16
                            property real uKeep: 0.85
                            property real uDrift: 0.04
                            property vector3d uInkColor: Qt.vector3d(0.05, 0.05, 0.06)
                        }
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
