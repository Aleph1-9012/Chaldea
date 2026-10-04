// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls.Basic
import QtQuick.Layouts
import "PhaseArt.js" as Art

Rectangle {
    id: root
    property bool animationEnabled: true
    property string userName: "PREVIEW USER"
    property string clockText: "00:14"
    property string dateText: "14 SEP"
    property string weekdayText: "MON // 2026"
    readonly property int inputLength: session.length
    readonly property real phase: session.phase
    readonly property real progress: session.progress
    readonly property bool previewing: sequence.running
    readonly property bool compact: width < 540
    readonly property var parts: Art.componentState("phase", progress)
    signal previewRequested(int length)
    implicitWidth: 1024
    implicitHeight: (compact ? 650 : Math.max(640, width * 5 / 8)) + 69
    color: "#080808"
    clip: true

    QtObject {
        id: session
        property int length: 0
        property real phase: 0
        property real progress: 1
        property int target: 1
    }

    function focusInput(): void { if (input.enabled) input.forceActiveFocus(); }

    function acceptInput(): void {
        if (input.inputMethodComposing) return;
        const length = Math.min(64, input.text.length);
        const start = Math.min(input.selectionStart, length);
        const end = Math.min(input.selectionEnd, length);
        const cursor = Math.min(input.cursorPosition, length);
        const masked = "x".repeat(length);
        if (input.text !== masked) {
            input.text = masked;
            if (start !== end) input.select(cursor === start ? end : start, cursor === start ? start : end);
            else input.cursorPosition = cursor;
        }
        session.length = length;
        travel.stop();
        if (animationEnabled && visible) {
            travel.from = session.phase;
            travel.to = length;
            travel.duration = Math.min(700, 100 * Math.max(1, Math.sqrt(Math.abs(length - session.phase))));
            travel.start();
        } else session.phase = length;
    }

    function setInputLength(length: int): void {
        input.text = "x".repeat(Math.max(0, Math.min(64, length)));
        input.cursorPosition = input.text.length;
        acceptInput();
    }

    function play(target: int): void {
        if (input.inputMethodComposing) return;
        sequence.stop();
        session.target = target;
        if (target === 0) previewRequested(inputLength);
        if (!animationEnabled || !visible) {
            session.progress = target;
            if (target) focusInput();
            else lockButton.forceActiveFocus();
            return;
        }
        if (Math.abs(progress - target) < .0001) session.progress = 1 - target;
        sequence.from = progress;
        sequence.to = target;
        sequence.duration = (target ? 1450 : 950) * Math.abs(target - progress);
        sequence.start();
    }

    function settle(): void {
        sequence.stop();
        travel.stop();
        session.progress = session.target;
        session.phase = session.length;
    }

    onAnimationEnabledChanged: if (!animationEnabled) settle()
    onVisibleChanged: if (!visible) settle()
    onProgressChanged: { field.requestPaint(); terminals.requestPaint(); registration.requestPaint(); glyph.requestPaint(); }
    onPhaseChanged: glyph.requestPaint()
    NumberAnimation { id: travel; target: session; property: "phase"; easing.type: Easing.OutCubic }
    NumberAnimation {
        id: sequence
        target: session
        property: "progress"
        onFinished: { if (session.target) root.focusInput(); else lockButton.forceActiveFocus(); }
    }

    RowLayout {
        x: 12; y: 12
        width: Math.max(0, parent.width - 24)
        spacing: 12
        LockButton { id: lockButton; objectName: "playLock"; text: "Play lock"; onClicked: root.play(1) }
        LockButton { objectName: "playUnlock"; text: "Play unlock"; onClicked: root.play(0) }
        LockText {
            Layout.fillWidth: true
            text: "Phase lock · " + (sequence.running ? session.target ? "appearing" : "disappearing" : root.progress === 1 ? "locked frame" : "cleared")
            font.pixelSize: 9
            wrapMode: Text.WordWrap
            Accessible.role: Accessible.StaticText
            Accessible.name: text
        }
    }

    Item {
        id: stage
        y: 69; width: parent.width; height: parent.height - y
        readonly property var scene: Art.buildSystem("phase", width, height, {x: panel.x, y: panel.y, w: panel.width, h: panel.height, folio: folio.width})
        onSceneChanged: { field.requestPaint(); registration.requestPaint(); terminals.requestPaint(); }
        Canvas {
            id: field
            anchors.fill: parent
            onPaint: { const ctx = getContext("2d"); ctx.reset(); Art.drawSystem(ctx, stage.scene, root.progress); }
        }
        Rectangle {
            id: panel
            anchors.centerIn: parent
            width: Math.min(408, stage.width - (root.compact ? 32 : 56))
            height: login.implicitHeight + 2
            color: Qt.rgba(9/255, 9/255, 9/255, root.parts.back)
            border.color: Qt.rgba(73/255, 66/255, 58/255, root.parts.border)
            enabled: root.progress >= .96 && !(sequence.running && session.target === 0)
            Rectangle {
                id: folio
                x: 1; y: 1; width: root.compact ? 64 : 106; height: parent.height - 2
                color: Qt.rgba(209/255, 22/255, 28/255, root.parts.folio)
                LockText {
                    anchors.horizontalCenter: parent.horizontalCenter; y: root.compact ? 44 : 20
                    rotation: root.compact ? 90 : 0
                    text: "TYPE-17"; color: "#170b0a"; font.letterSpacing: 1; opacity: root.parts.folioText
                }
                LockText {
                    anchors.centerIn: parent
                    text: "継\n衛"; font.family: "Noto Sans CJK JP"; font.pixelSize: root.compact ? 43 : 68
                    color: "#170b0a"; horizontalAlignment: Text.AlignHCenter
                    lineHeightMode: Text.FixedHeight; lineHeight: font.pixelSize * 1.08; opacity: root.parts.folioText
                }
                Rectangle {
                    anchors.horizontalCenter: parent.horizontalCenter
                    y: parent.height - (root.compact ? 100 : 48)
                    width: root.compact ? 25 : 75; height: root.compact ? 80 : 23
                    color: "#190a09"; opacity: root.parts.folioText
                    LockText { anchors.centerIn: parent; rotation: root.compact ? 90 : 0; text: "SID0NIA"; color: "#d1161c"; font.letterSpacing: 1 }
                }
            }
            ColumnLayout {
                id: login
                x: folio.width + 1
                width: panel.width - x - 1
                spacing: root.compact ? 16 : 18
                property int inset: root.compact ? 14 : 20
                ColumnLayout {
                    Layout.fillWidth: true; Layout.margins: login.inset; Layout.bottomMargin: 0
                    spacing: 9; opacity: root.parts.user
                    RowLayout {
                        Layout.fillWidth: true
                        RowLayout {
                            Layout.fillWidth: true; spacing: 5
                            LockText { text: "USER"; font.letterSpacing: 1 }
                            LockText { text: "//"; color: "#d1161c" }
                            Item { Layout.fillWidth: true }
                        }
                        Rectangle {
                            implicitWidth: 49; implicitHeight: 21; color: "#d1161c"
                            LockText { anchors.centerIn: parent; text: "◆ 704"; color: "#090909" }
                        }
                    }
                    LockText { Layout.fillWidth: true; text: root.userName; font.pixelSize: root.compact ? 14 : 17; color: "#e4e2dc"; wrapMode: Text.WrapAnywhere }
                }
                ColumnLayout {
                    Layout.fillWidth: true; Layout.leftMargin: login.inset; Layout.rightMargin: login.inset
                    spacing: 14; opacity: root.parts.clock
                    GridLayout {
                        Layout.fillWidth: true; columns: root.compact ? 1 : 2; columnSpacing: 12; rowSpacing: 8
                        Row {
                            Layout.fillWidth: true
                            Repeater {
                                model: root.clockText.length
                                LockText {
                                    required property int index
                                    text: root.clockText[index]
                                    color: text === ":" ? "#d1161c" : "#e4e2dc"
                                    font.pixelSize: root.compact ? 30 : 32; font.letterSpacing: -1
                                }
                            }
                        }
                        RowLayout {
                            spacing: 12
                            Rectangle { visible: !root.compact; implicitWidth: 1; Layout.fillHeight: true; color: "#3b3631" }
                            ColumnLayout {
                                spacing: 3
                                LockText { text: root.dateText; color: "#e4e2dc" }
                                LockText { text: root.weekdayText }
                            }
                        }
                    }
                    Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: "#3b3631" }
                }
                Canvas {
                    id: glyph
                    objectName: "glyphArtwork"
                    Layout.alignment: Qt.AlignHCenter
                    Layout.preferredWidth: Math.min(162, login.width - login.inset * 2)
                    Layout.preferredHeight: Layout.preferredWidth
                    Accessible.role: Accessible.Graphic
                    Accessible.name: "K compound glyph reacting to dummy-input length"
                    onWidthChanged: requestPaint()
                    onPaint: {
                        const ctx = getContext("2d"), ratio = width / 252;
                        ctx.reset(); ctx.scale(ratio, ratio);
                        ctx.lineCap = "butt"; ctx.lineJoin = "miter";
                        const marks = Art.makeArt("k", root.phase), q = root.parts.glyph;
                        for (let i = 0; i < marks.length; i++) {
                            const mark = marks[i], local = Art.ramp(q, Art.hash(i, 0, 93) * .26, .58 + Art.hash(i, 0, 93) * .42);
                            Art.crispStroke(ctx, mark.points, mark.c, mark.w, mark.alpha * local, local, ratio);
                        }
                    }
                }
                ColumnLayout {
                    Layout.fillWidth: true; Layout.margins: login.inset; Layout.topMargin: 0
                    spacing: 9; opacity: root.parts.auth
                    RowLayout {
                        Layout.fillWidth: true
                        RowLayout {
                            Layout.fillWidth: true; spacing: 5
                            LockText { text: "PASSWORD" }
                            LockText { text: "//"; color: "#d1161c" }
                            Item { Layout.fillWidth: true }
                        }
                        LockText { text: "認証"; font.family: "Noto Sans CJK JP" }
                    }
                    Rectangle {
                        Layout.fillWidth: true; implicitHeight: 43; color: "#111111"; border.color: "#55504a"
                        Rectangle { width: 2; height: parent.height; color: input.activeFocus ? "#ed272d" : "#d1161c" }
                        TextField {
                            id: input
                            objectName: "demoInput"
                            anchors.fill: parent; anchors.leftMargin: 2; anchors.rightMargin: 43
                            padding: 10; color: "#e4e2dc"; font.family: "JetBrains Mono"; font.pixelSize: 16; font.letterSpacing: 2
                            background: Item {}
                            selectionColor: "#d1161c"; selectedTextColor: "#e4e2dc"
                            echoMode: TextInput.Password; passwordCharacter: "•"; passwordMaskDelay: 0; maximumLength: 64; selectByMouse: true
                            inputMethodHints: Qt.ImhSensitiveData | Qt.ImhNoPredictiveText | Qt.ImhNoAutoUppercase
                            Accessible.name: "Demo password. Use dummy text only. No authentication takes place."
                            onTextEdited: root.acceptInput()
                            onInputMethodComposingChanged: if (!inputMethodComposing) Qt.callLater(root.acceptInput)
                            onAccepted: root.play(0)
                            Keys.onEscapePressed: event => { if (!inputMethodComposing) { root.setInputLength(0); event.accepted = true; } }
                            LockText { visible: !input.text.length && !input.inputMethodComposing; anchors.verticalCenter: parent.verticalCenter; x: 10; width: parent.width - 20; text: "Dummy text only…"; elide: Text.ElideRight }
                        }
                        Button {
                            id: unlock
                            objectName: "unlockPreview"
                            anchors.right: parent.right; width: 42; height: parent.height
                            text: "↗"; hoverEnabled: true; focusPolicy: Qt.StrongFocus
                            Accessible.name: "Preview unlock animation"
                            onClicked: root.play(0)
                            contentItem: LockText { text: unlock.text; color: "#090909"; font.pixelSize: 20; horizontalAlignment: Text.AlignHCenter; verticalAlignment: Text.AlignVCenter }
                            background: Rectangle { color: unlock.hovered ? "#e7282e" : "#d1161c"; border.color: "#e4e2dc"; border.width: unlock.visualFocus ? 2 : 0 }
                        }
                    }
                    LockText { text: "PREVIEW ONLY"; Layout.preferredHeight: 15 }
                }
            }
        }
        Canvas {
            id: registration
            anchors.fill: parent
            onPaint: { const ctx = getContext("2d"); ctx.reset(); Art.drawRegister(ctx, stage.scene, root.progress); }
        }
        Canvas {
            id: terminals
            anchors.fill: parent
            onPaint: {
                const ctx = getContext("2d"); ctx.reset();
                const label = sequence.running ? session.target ? "LOCK / APPEAR" : "UNLOCK / CLEAR" : root.progress === 1 ? "LOCKED" : "LOCK RELEASED";
                Art.drawCorners(ctx, stage.scene, root.progress, "formation", label);
            }
        }
    }
}
