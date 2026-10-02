// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
Item {
    id: grid
    property color line: Qt.rgba(0.8, 0.08, 0.08, 0.08)
    property int gridSize: 20
    clip: true
    Repeater {
        model: Math.ceil(grid.width / grid.gridSize)
        Rectangle { required property int index; x: index * grid.gridSize; width: 1; height: grid.height; color: grid.line }
    }
    Repeater {
        model: Math.ceil(grid.height / grid.gridSize)
        Rectangle { required property int index; y: index * grid.gridSize; height: 1; width: grid.width; color: grid.line }
    }
}
