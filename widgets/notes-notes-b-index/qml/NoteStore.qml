// SPDX-License-Identifier: 0BSD
import QtQml
import QtQml.Models

QtObject {
    id: store
    property ListModel entries: ListModel {
        ListElement { uid: 1; title: "Before I leave"; body: "Pick up groceries\nCharge the headphones\nBack up the dotfiles"; edited: false }
        ListElement { uid: 2; title: "Useful commands"; body: "hyprctl monitors\nwpctl status"; edited: false }
    }
    readonly property int count: entries.count
    property int selected: 0
    property int nextId: 3
    property var deleted: []
    property string status: "SESSION ONLY"
    signal selectionChanged()
    signal contentEdited()

    function serial(value: int): string { return String(value).padStart(2, "0"); }
    function note(index: int): var {
        if (index < 0 || index >= count) return null;
        const item = entries.get(index);
        return { uid: item.uid, title: item.title, body: item.body, edited: item.edited };
    }
    function snapshot(): var {
        const result = [];
        for (let i = 0; i < count; i++) result.push(note(i));
        return result;
    }
    function select(index: int): void {
        if (index < -1 || index >= count) return;
        selected = index;
        selectionChanged();
    }
    function add(prepend: bool): void {
        const index = prepend ? 0 : count;
        if (prepend) deleted = deleted.map(function(entry) { return { note: entry.note, index: entry.index + 1 }; });
        entries.insert(index, { uid: nextId++, title: "", body: "", edited: false });
        select(index);
        status = "NEW / SESSION ONLY";
        contentEdited();
    }
    function edit(index: int, field: string, value: string): void {
        if (index < 0 || index >= count || (field !== "title" && field !== "body")) return;
        if (entries.get(index)[field] === value) return;
        entries.setProperty(index, field, value);
        entries.setProperty(index, "edited", true);
        status = "EDITED / SESSION ONLY";
        contentEdited();
    }
    function remove(index: int): void {
        const item = note(index);
        if (!item) return;
        deleted = deleted.concat([{ note: item, index: index }]);
        const next = selected === index ? Math.min(index, count - 2) : selected > index ? selected - 1 : selected;
        entries.remove(index);
        select(next);
        status = "NOTE DELETED";
        contentEdited();
    }
    function undo(): void {
        if (!deleted.length) return;
        const last = deleted[deleted.length - 1];
        deleted = deleted.slice(0, -1);
        const index = Math.min(last.index, count);
        entries.insert(index, last.note);
        select(index);
        status = "NOTE RESTORED";
        contentEdited();
    }
}
