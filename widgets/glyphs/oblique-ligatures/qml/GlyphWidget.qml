// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic
import QtQuick.Layouts
import "GlyphArt.js" as Art

Rectangle {
    id: root
    property string designName: "Glyph study"
    property int transitionTime: 100
    property int emphasis: 100
    property bool animationEnabled: true
    readonly property int inputLength: session.length
    readonly property real phase: session.phase
    readonly property bool previewing: session.previewing
    signal previewRequested(int length)
    implicitWidth: 354
    implicitHeight: composition.implicitHeight + 44
    color: "#090909"
    clip: true

    QtObject {
        id: session
        property int length: 0
        property real phase: 0
        property real velocity: 0
        property bool previewing: false
        property bool initialized: false
        property string status: "TYPE TO ACTIVATE"
    }
    function restStatus(): void {
        session.status = session.length ? "READY TO UNLOCK" : "TYPE TO ACTIVATE";
    }
    function endPreview(): void {
        previewTimer.stop();
        session.previewing = false;
    }
    function retarget(): void {
        if (!session.initialized) return;
        if (!animationEnabled || !visible) {
            travel.stop();
            session.velocity = 0;
            session.phase = session.length;
            return;
        }
        if (session.phase !== session.length || session.velocity !== 0) travel.start();
    }

    function acceptInput(): void {
        if (input.inputMethodComposing) return;
        const length = Math.min(input.text.length, 64);
        const start = Math.min(input.selectionStart, length);
        const end = Math.min(input.selectionEnd, length);
        const cursor = Math.min(input.cursorPosition, length);
        // Store only length and placeholders, never text-derived geometry or hashes.
        const masked = "x".repeat(length);
        if (input.text !== masked) {
            input.text = masked;
            if (start !== end) input.select(cursor === start ? end : start, cursor === start ? start : end);
            else input.cursorPosition = cursor;
        }
        const changed = session.length !== length;
        session.length = length;
        endPreview();
        if (changed) retarget();
        restStatus();
    }
    function setInputLength(length: int): void {
        input.text = "x".repeat(Math.max(0, Math.min(64, length)));
        input.cursorPosition = input.text.length;
        acceptInput();
    }
    function focusInput(): void { input.forceActiveFocus(Qt.OtherFocusReason); }
    function replay(): void {
        if (input.inputMethodComposing) return;
        if (!session.length) {
            session.status = "ENTER DUMMY TEXT FIRST";
            focusInput();
            return;
        }
        endPreview();
        session.previewing = true;
        session.status = "PREVIEW ONLY";
        previewTimer.interval = 1100;
        previewTimer.start();
        previewRequested(session.length);
    }
    onAnimationEnabledChanged: {
        if (session.initialized) {
            retarget();
        }
    }
    onTransitionTimeChanged: retarget()
    onVisibleChanged: {
        if (session.initialized && !visible) {
            travel.stop(); session.velocity = 0; session.phase = session.length;
            endPreview(); restStatus();
        }
    }
    Component.onCompleted: { session.initialized = true; retarget(); }
    FrameAnimation {
        id: travel
        onTriggered: {
            const next = Art.advanceGlyphMotion(session.phase, session.velocity, session.length, frameTime, root.transitionTime);
            session.phase = next.phase;
            session.velocity = next.velocity;
            if (session.phase === session.length && session.velocity === 0) stop();
        }
    }
    Timer {
        id: previewTimer
        onTriggered: { session.previewing = false; root.restStatus(); }
    }

    ColumnLayout {
        id: composition
        x: 22; y: 24
        width: Math.max(0, parent.width - 44)
        spacing: 0
        GlyphArtwork {
            objectName: "glyphArtwork"
            Layout.preferredWidth: Math.min(252, composition.width)
            Layout.preferredHeight: Layout.preferredWidth
            Layout.alignment: Qt.AlignHCenter
            Layout.bottomMargin: 22
            phase: root.phase
            emphasis: root.emphasis
            description: root.designName + ". Artwork reacts to dummy-input length."
        }
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: "#343330" }
        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 18
            Layout.bottomMargin: 16
            spacing: 12
            GlyphText { text: "USER"; font.letterSpacing: 1.5 }
            GlyphText { text: "PREVIEW USER"; font.pixelSize: 12; color: "#e4e2dc" }
        }
        RowLayout {
            Layout.fillWidth: true
            Layout.bottomMargin: 8
            GlyphText { text: "DEMO PASSWORD"; Layout.fillWidth: true; font.letterSpacing: 1 }
            GlyphText { text: "本人確認"; font.family: "Noto Sans CJK JP" }
        }
        Rectangle {
            Layout.fillWidth: true
            implicitHeight: 44
            color: "#090909"
            border.color: input.activeFocus ? "#e4e2dc" : "#66635c"
            Rectangle {
                visible: input.activeFocus
                anchors.fill: parent; anchors.margins: -3
                color: "transparent"; border.color: "#e4e2dc"
            }
            GlyphText { x: 13; anchors.verticalCenter: parent.verticalCenter; text: "›"; font.pixelSize: 21; color: "#e53136" }
            TextField {
                id: input
                objectName: "demoInput"
                anchors.fill: parent
                anchors.leftMargin: 35
                anchors.rightMargin: 13
                padding: 0
                font.family: "JetBrains Mono"
                font.pixelSize: 16
                font.letterSpacing: 4
                color: "#e4e2dc"
                selectionColor: "#d1161c"
                selectedTextColor: "#e4e2dc"
                echoMode: TextInput.Password
                passwordCharacter: "•"
                passwordMaskDelay: 0
                maximumLength: 64
                selectByMouse: true
                inputMethodHints: Qt.ImhSensitiveData | Qt.ImhNoPredictiveText | Qt.ImhNoAutoUppercase
                Accessible.name: "Demo password. Use dummy text to animate the artwork; Backspace reverses it."
                background: Item {}
                onTextEdited: root.acceptInput()
                onInputMethodComposingChanged: { if (!inputMethodComposing) Qt.callLater(root.acceptInput); }
                onAccepted: root.replay()
                GlyphText {
                    visible: !input.text.length && !input.inputMethodComposing
                    anchors.verticalCenter: parent.verticalCenter
                    width: parent.width
                    font.pixelSize: 12
                    text: "Type dummy text…"
                    maximumLineCount: 1
                    elide: Text.ElideRight
                }
            }
        }
        GlyphText {
            objectName: "glyphStatus"
            Layout.fillWidth: true
            Layout.preferredHeight: 35
            topPadding: 9
            font.letterSpacing: .7
            text: session.status
            Accessible.role: Accessible.StaticText
            Accessible.name: text
        }
        Button {
            id: unlock
            objectName: "unlockPreview"
            Layout.fillWidth: true
            implicitHeight: 40
            padding: 13
            text: "UNLOCK"
            hoverEnabled: true
            focusPolicy: Qt.StrongFocus
            Accessible.name: "Preview unlock animation"
            onClicked: root.replay()
            background: Rectangle {
                color: "#090909"
                border.color: "#d1161c"
                clip: true
                Rectangle {
                    width: parent.width; height: parent.height
                    x: unlock.hovered || unlock.visualFocus ? 0 : -width - 1
                    color: "#d1161c"
                    Behavior on x { NumberAnimation { duration: root.animationEnabled ? 280 : 0; easing.type: Easing.InOutCubic } }
                }
                Rectangle { anchors.fill: parent; visible: unlock.visualFocus; color: "transparent"; border.width: 2; border.color: "#e4e2dc" }
            }
            contentItem: RowLayout {
                GlyphText { text: "UNLOCK"; color: "#e4e2dc"; font.letterSpacing: 2; Layout.fillWidth: true }
                Canvas {
                    implicitWidth: 16; implicitHeight: 16
                    onPaint: {
                        const ctx = getContext("2d");
                        ctx.reset();
                        ctx.scale(16 / 24, 16 / 24);
                        ctx.strokeStyle = "#e4e2dc"; ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.moveTo(5, 19); ctx.lineTo(19, 5);
                        ctx.moveTo(5, 5); ctx.lineTo(19, 5); ctx.lineTo(19, 19); ctx.stroke();
                    }
                }
            }
        }
        RowLayout {
            Layout.fillWidth: true
            Layout.topMargin: 13
            spacing: 4
            GlyphText { text: "SESSION / 01"; Layout.fillWidth: true }
            GlyphText { text: "セッションロック中"; font.family: "Noto Sans CJK JP" }
        }
    }
    Rectangle {
        id: curtain
        objectName: "unlockCurtain"
        z: 10
        width: parent.width; height: parent.height
        y: root.previewing ? 0 : -height - 1
        color: "#d1161c"
        Behavior on y { NumberAnimation { duration: root.animationEnabled ? 440 : 0; easing.type: Easing.InOutCubic } }
        ColumnLayout {
            anchors.centerIn: parent
            spacing: 18
            GlyphText { Layout.alignment: Qt.AlignHCenter; text: "継衛 / TYPE 17"; color: "#130707"; font.letterSpacing: 2 }
            GlyphText { Layout.alignment: Qt.AlignHCenter; text: "SID0NIA"; color: "#130707"; font.pixelSize: 26; font.letterSpacing: 8 }
            GlyphText { Layout.alignment: Qt.AlignHCenter; text: "UNLOCK PREVIEW"; color: "#130707"; font.letterSpacing: 2 }
        }
    }
}
