// SPDX-License-Identifier: 0BSD
import QtQuick

Rectangle {
    id: root
    property int transitionTime: 100
    property bool animationEnabled: true
    property string designName: "Assembly mark"
    property string userName: "silverhand9012"
    property string hours: "00"
    property string minutes: "14"
    property string dateText: "SUN // 13 SEPTEMBER 2026"
    property bool lightTheme: false
    property bool showShipTag: true
    property bool footerRule: lightTheme
    property bool compactBadge: false
    property real wallOpacity: .08
    property int minimumHeight: 760
    property int mainPaddingWide: 40
    property int mainPaddingMedium: 36
    property int mainPaddingNarrow: 30
    readonly property bool narrow: width <= 670
    readonly property bool medium: width <= 850
    readonly property color paperColor: lightTheme ? "#151513" : "#e4e2dc"
    readonly property color mutedColor: lightTheme ? "#55554d" : "#98948a"
    readonly property color lineColor: lightTheme ? "#a5a59c" : "#393630"
    readonly property int inputLength: session.length
    readonly property real phase: session.phase
    readonly property bool previewing: session.previewing
    readonly property string statusText: session.status
    readonly property string powerAction: session.powerAction
    readonly property int sideMargin: narrow ? 20 : medium ? 32 : 48
    readonly property int verticalPadding: narrow ? mainPaddingNarrow : medium ? mainPaddingMedium : mainPaddingWide
    signal previewRequested(int length)
    signal powerRequested(string action)
    implicitWidth: 960
    implicitHeight: Math.max(minimumHeight, header.y + header.height + verticalPadding * 2 + composition.implicitHeight + footer.height + (narrow ? 24 : 25))
    color: lightTheme ? "#c7c7bf" : "#090909"
    clip: true

    QtObject {
        id: session
        property int length: 0
        property real phase: 0
        property bool previewing: false
        property string status: ""
        property string powerAction: ""
        property Item returnFocus: null
        property bool initialized: false
    }
    function endPreview(): void { previewTimer.stop(); session.previewing = false; }
    function retarget(): void {
        if (!session.initialized) return;
        travel.stop();
        const distance = Math.abs(session.phase - session.length);
        if (!animationEnabled || !visible || distance < .00001) {
            session.phase = session.length;
            return;
        }
        travel.from = session.phase;
        travel.to = session.length;
        travel.duration = Math.min(700, transitionTime * Math.max(1, Math.sqrt(distance)));
        travel.start();
    }
    function inputChanged(length: int): void {
        const changed = session.length !== length;
        session.length = length;
        endPreview();
        if (changed) retarget();
        session.status = "";
    }
    function setInputLength(length: int): void { composition.auth.setInputLength(length); }
    function focusInput(): void { composition.auth.focusInput(); }
    function replay(): void {
        if (composition.auth.input.inputMethodComposing || session.powerAction) return;
        if (!session.length) {
            session.status = "USE DUMMY TEXT";
            focusInput();
            return;
        }
        endPreview();
        session.previewing = true;
        session.status = "PREVIEW ONLY";
        previewTimer.start();
        previewRequested(session.length);
    }
    function openPower(action: string, origin: Item): void {
        if (action !== "restart" && action !== "shutdown") return;
        endPreview();
        session.returnFocus = origin;
        session.powerAction = action;
        back.forceActiveFocus(Qt.OtherFocusReason);
        powerRequested(action);
    }
    function closePower(): void {
        session.powerAction = "";
        if (session.returnFocus) session.returnFocus.forceActiveFocus(Qt.OtherFocusReason);
        session.returnFocus = null;
    }
    onAnimationEnabledChanged: retarget()
    onTransitionTimeChanged: retarget()
    onVisibleChanged: {
        if (session.initialized && !visible) {
            travel.stop(); session.phase = session.length;
            endPreview(); session.status = "";
            session.powerAction = "";
        }
    }
    Component.onCompleted: { session.initialized = true; retarget(); }
    NumberAnimation { id: travel; target: session; property: "phase"; easing.type: Easing.OutCubic }
    Timer { id: previewTimer; interval: 1100; onTriggered: { session.previewing = false; session.status = ""; } }

    Image {
        anchors.fill: parent
        source: root.wallOpacity > 0 ? "Wall.jpg" : ""
        fillMode: Image.PreserveAspectCrop
        opacity: root.wallOpacity
        Accessible.ignored: true
    }
    Item {
        anchors.fill: parent
        enabled: !session.powerAction
        Item {
            id: header
            x: root.narrow ? 20 : 32
            y: root.narrow ? 24 : 26
            width: Math.max(0, parent.width - x * 2)
            height: (root.narrow && root.compactBadge ? 28 : 30) + (root.lightTheme ? 20 : 0)
            Row {
                anchors.verticalCenter: badge.verticalCenter
                spacing: root.lightTheme && !root.narrow ? 17 : 15
                LockText { text: "TSUGUMORI"; color: root.paperColor; font.pixelSize: root.lightTheme && !root.narrow ? 13 : 11; font.letterSpacing: root.narrow ? .6 : root.lightTheme ? 2 : 1 }
                LockText { text: "//"; color: "#d1161c"; font.pixelSize: root.lightTheme && !root.narrow ? 13 : 11; font.letterSpacing: root.narrow ? .6 : root.lightTheme ? 2 : 1 }
                LockText { text: "TYPE-17"; color: root.mutedColor; font.pixelSize: root.lightTheme && !root.narrow ? 13 : 11; font.letterSpacing: root.narrow ? .6 : root.lightTheme ? 2 : 1 }
            }
            Rectangle {
                id: badge
                anchors.right: parent.right
                width: root.narrow && root.compactBadge ? 68 : 76
                height: root.narrow && root.compactBadge ? 28 : 30
                color: "#d1161c"
                LockText { anchors.centerIn: parent; text: "◆ 704"; color: "#090909"; font.pixelSize: root.narrow && root.compactBadge ? 12 : 14; font.letterSpacing: 2 }
            }
            Rectangle { visible: root.lightTheme; width: parent.width; height: 2; anchors.bottom: parent.bottom; color: "#151513" }
        }
        LockComposition {
            id: composition
            screen: root
            width: Math.max(0, Math.min(implicitWidth, root.width - root.sideMargin * 2))
            height: implicitHeight
            x: (root.width - width) / 2
            y: header.y + header.height + root.verticalPadding + Math.max(0, (footer.y - header.y - header.height - root.verticalPadding * 2 - height) / 2)
        }
        Item {
            id: footer
            x: root.narrow ? 20 : 32
            y: parent.height - height - (root.narrow ? 24 : 25)
            width: Math.max(0, parent.width - x * 2)
            height: footerContent.height + (root.footerRule ? 17 : 0)
            Rectangle { visible: root.footerRule; width: parent.width; height: 1; color: root.lightTheme ? "#151513" : "#282724" }
            Flow {
                id: footerContent
                y: root.footerRule ? 17 : 0
                width: parent.width
                spacing: 20
                Item {
                    width: Math.min(footerContent.width, footerContent.width >= ship.implicitWidth + power.implicitWidth + 20 ? footerContent.width - power.implicitWidth - 20 : ship.implicitWidth)
                    height: Math.max(32, ship.implicitHeight)
                    Row {
                        id: ship
                        anchors.verticalCenter: parent.verticalCenter
                        spacing: 16
                        Rectangle {
                            visible: root.showShipTag
                            width: root.showShipTag ? shipName.implicitWidth + 16 : 0
                            height: 25
                            color: "#d1161c"
                            LockText { id: shipName; anchors.centerIn: parent; text: "SID0NIA"; color: "#090909"; font.pixelSize: 12; font.letterSpacing: 2 }
                        }
                        LockText { anchors.verticalCenter: parent.verticalCenter; text: "播種船 シドニア"; font.family: "Noto Sans CJK JP"; font.letterSpacing: 1; color: root.mutedColor }
                    }
                }
                Row {
                    id: power
                    spacing: 20
                    LockButton { id: restart; objectName: "restartPreview"; text: "RESTART"; textOnly: true; foreground: root.mutedColor; onClicked: root.openPower("restart", restart) }
                    LockButton { id: shutdown; objectName: "shutdownPreview"; text: "SHUTDOWN"; textOnly: true; foreground: root.mutedColor; onClicked: root.openPower("shutdown", shutdown) }
                }
            }
        }
    }
    Rectangle {
        objectName: "unlockCurtain"
        z: 10
        width: parent.width; height: parent.height
        y: root.previewing ? 0 : -height - 1
        color: "#d1161c"
        Behavior on y { NumberAnimation { duration: root.animationEnabled ? 440 : 0; easing.type: Easing.InOutCubic } }
        Column {
            anchors.centerIn: parent
            spacing: 20
            LockText { anchors.horizontalCenter: parent.horizontalCenter; text: "継衛"; font.family: "Noto Sans CJK JP"; font.pixelSize: 50; color: "#100808" }
            LockText { anchors.horizontalCenter: parent.horizontalCenter; text: "UNLOCK PREVIEW"; font.pixelSize: 12; font.letterSpacing: 2; color: "#100808" }
        }
    }
    Rectangle {
        id: modal
        objectName: "powerDialog"
        anchors.fill: parent
        z: 20
        visible: !!session.powerAction
        color: "#ed090909"
        MouseArea { anchors.fill: parent; acceptedButtons: Qt.AllButtons }
        FocusScope {
            anchors.fill: parent
            Accessible.role: Accessible.Dialog
            Accessible.name: session.powerAction === "restart" ? "Restart?" : "Shut down?"
            Accessible.description: "Preview only. No system action will run."
            Keys.onEscapePressed: root.closePower()
            Rectangle {
                anchors.centerIn: parent
                width: Math.min(340, Math.max(0, parent.width - 40))
                height: dialogContent.height + 56
                color: "#111111"
                border.color: "#d1161c"
                Column {
                    id: dialogContent
                    x: 28; y: 28
                    width: Math.max(0, parent.width - 56)
                    spacing: 0
                    LockText { text: session.powerAction === "restart" ? "Restart?" : "Shut down?"; color: "#e4e2dc"; font.pixelSize: 22; bottomPadding: 16 }
                    LockText { width: parent.width; text: "Preview only. No system action will run."; font.pixelSize: 12; bottomPadding: 22 }
                    LockButton {
                        id: back
                        objectName: "powerBack"
                        width: parent.width
                        text: "BACK"
                        animationEnabled: root.animationEnabled
                        KeyNavigation.tab: back
                        KeyNavigation.backtab: back
                        onClicked: root.closePower()
                    }
                }
            }
        }
    }
}
