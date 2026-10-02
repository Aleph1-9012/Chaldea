use serde_json::{Value, json};
use std::{
    fs,
    path::{Path, PathBuf},
};
use xlr8::{build, content, validate};
fn root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .to_path_buf()
}
fn project() -> content::Project {
    load(&fixture())
}
fn copy_dir(source: &Path, target: &Path) {
    fs::create_dir_all(target).unwrap();
    for entry in fs::read_dir(source).unwrap() {
        let entry = entry.unwrap();
        let to = target.join(entry.file_name());
        if entry.file_type().unwrap().is_dir() {
            copy_dir(&entry.path(), &to);
        } else {
            fs::copy(entry.path(), to).unwrap();
        }
    }
}
fn fixture() -> tempfile::TempDir {
    let temp = tempfile::tempdir().unwrap();
    fs::copy(root().join("xlr8.toml"), temp.path().join("xlr8.toml")).unwrap();
    for path in ["schemas", "frontend/src"] {
        copy_dir(&root().join(path), &temp.path().join(path));
    }
    let source: Value =
        serde_json::from_str(include_str!("../../schemas/fixtures/export.json")).unwrap();
    for (id, draft) in [("contract-fixture", false), ("draft-fixture", true)] {
        let dir = temp.path().join("widgets").join(id);
        fs::create_dir_all(&dir).unwrap();
        let mut definition = source["definition"].clone();
        definition["id"] = json!(id);
        if draft {
            definition["status"] = json!("draft");
            definition["settings"] = json!([]);
            definition["exports"] = json!([]);
        }
        fs::write(
            dir.join("widget.json"),
            serde_json::to_vec(&definition).unwrap(),
        )
        .unwrap();
        for (path, bytes) in source["files"].as_object().unwrap() {
            let file = dir.join(path);
            fs::create_dir_all(file.parent().unwrap()).unwrap();
            fs::write(file, bytes.as_str().unwrap()).unwrap();
        }
    }
    temp
}
fn change(temp: &tempfile::TempDir, modify: impl FnOnce(&mut Value)) {
    let path = temp.path().join("widgets/contract-fixture/widget.json");
    let mut value: Value = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
    modify(&mut value);
    fs::write(path, serde_json::to_vec(&value).unwrap()).unwrap();
}
fn load(temp: &tempfile::TempDir) -> content::Project {
    content::load(&temp.path().join("xlr8.toml"), &temp.path().join("widgets")).unwrap()
}
fn fails(temp: &tempfile::TempDir) -> bool {
    content::load(&temp.path().join("xlr8.toml"), &temp.path().join("widgets")).is_err()
}
#[test]
fn shared_semantics() {
    let cases: Vec<Value> =
        serde_json::from_str(include_str!("../../schemas/fixtures/settings.json")).unwrap();
    for case in cases {
        let setting: content::Setting = serde_json::from_value(case["setting"].clone()).unwrap();
        assert_eq!(
            validate::setting(&setting).is_ok(),
            case["valid"].as_bool().unwrap(),
            "{}",
            case["name"]
        );
    }
    let p = project();
    let definition = &p
        .widgets
        .iter()
        .find(|w| w.definition.id == "contract-fixture")
        .unwrap()
        .definition;
    let cases: Vec<Value> =
        serde_json::from_str(include_str!("../../schemas/fixtures/templates.json")).unwrap();
    for case in cases {
        assert_eq!(
            validate::template(case["source"].as_str().unwrap(), &definition.settings).is_ok(),
            case["valid"].as_bool().unwrap(),
            "{}",
            case["name"]
        );
    }
}
#[test]
fn grouped_source_moves_preserve_ids_and_revisions() {
    let temp = fixture();
    let before = load(&temp);
    let revisions: Vec<_> = before
        .widgets
        .iter()
        .map(|w| build::revision(&before, w).unwrap())
        .collect();
    let group = temp.path().join("widgets/notes/study");
    fs::create_dir_all(&group).unwrap();
    fs::rename(
        temp.path().join("widgets/contract-fixture"),
        group.join("compact"),
    )
    .unwrap();
    let after = load(&temp);
    assert_eq!(after.widgets.len(), before.widgets.len());
    for (index, widget) in after.widgets.iter().enumerate() {
        assert_eq!(widget.definition.id, before.widgets[index].definition.id);
        assert_eq!(build::revision(&after, widget).unwrap(), revisions[index]);
    }
    copy_dir(&group.join("compact"), &group.join("duplicate"));
    assert!(
        content::load(&temp.path().join("xlr8.toml"), &temp.path().join("widgets"))
            .err()
            .unwrap()
            .to_string()
            .contains("duplicate widget ID")
    );
}

#[test]
#[cfg(unix)]
fn source_groups_reject_symlink_cycles_and_empty_groups() {
    let temp = fixture();
    let group = temp.path().join("widgets/loop");
    std::os::unix::fs::symlink(temp.path().join("widgets"), &group).unwrap();
    assert!(fails(&temp));
    fs::remove_file(&group).unwrap();
    fs::create_dir(&group).unwrap();
    assert!(fails(&temp));
}
#[test]
fn rejects_bad_defaults_duplicates_and_path_traversal() {
    for modify in [
        |v: &mut Value| v["settings"][0]["default"] = json!(200),
        |v: &mut Value| v["settings"][1]["key"] = json!("level"),
        |v: &mut Value| v["publicFiles"][0]["source"] = json!("../../xlr8.toml"),
        |v: &mut Value| v["exports"][0]["path"] = json!("../Widget.qml"),
        |v: &mut Value| v["publicFiles"][0]["path"] = json!("bundle.json"),
        |v: &mut Value| v["id"] = json!("Invalid ID"),
    ] {
        let temp = fixture();
        change(&temp, modify);
        assert!(fails(&temp));
    }
}
#[test]
fn missing_assets_templates_and_license_fail() {
    for path in ["assets/sample.txt", "qml/Widget.qml.tmpl", "LICENSE"] {
        let temp = fixture();
        fs::remove_file(temp.path().join("widgets/contract-fixture").join(path)).unwrap();
        assert!(fails(&temp));
    }
    let temp = fixture();
    change(&temp, |v| v["exports"] = json!([]));
    assert!(fails(&temp));
}
#[test]
fn confined_symlink() {
    let temp = fixture();
    let file = temp
        .path()
        .join("widgets/contract-fixture/assets/sample.txt");
    fs::remove_file(&file).unwrap();
    #[cfg(unix)]
    std::os::unix::fs::symlink(temp.path().join("xlr8.toml"), file).unwrap();
    assert!(fails(&temp));
}
#[test]
fn revisions_are_deterministic_and_cover_shared_inputs() {
    let mut p = project();
    let original = build::revision(&p, &p.widgets[0]).unwrap();
    assert_eq!(
        original,
        build::revision(&project(), &project().widgets[0]).unwrap()
    );
    let runtime = p.config.preview_runtime.clone();
    p.shared.get_mut(&runtime).unwrap().push(b' ');
    assert_ne!(original, build::revision(&p, &p.widgets[0]).unwrap());
    let temp = fixture();
    let before = build::revision(&load(&temp), &load(&temp).widgets[0]).unwrap();
    fs::write(
        temp.path().join("widgets/contract-fixture/private.txt"),
        "not public",
    )
    .unwrap();
    assert_eq!(
        before,
        build::revision(&load(&temp), &load(&temp).widgets[0]).unwrap()
    );
}
#[test]
fn clean_production_omits_drafts_and_undeclared_files() {
    let p = project();
    let temp = tempfile::tempdir().unwrap();
    let output = temp.path().join("content");
    build::build(&p, &output, true).unwrap();
    build::build(&p, &output, false).unwrap();
    let catalog: Value =
        serde_json::from_slice(&fs::read(output.join("catalog.json")).unwrap()).unwrap();
    assert!(
        catalog["widgets"]
            .as_array()
            .unwrap()
            .iter()
            .all(|w| w["status"] == "published")
    );
    for widget in &p.widgets {
        if widget.definition.status == "draft" {
            assert!(
                !output
                    .join("revisions")
                    .join(&widget.definition.id)
                    .exists()
            );
        }
    }
    let temp = fixture();
    fs::write(
        temp.path().join("widgets/contract-fixture/private.txt"),
        "secret",
    )
    .unwrap();
    let p = load(&temp);
    let output = temp.path().join("generated");
    build::build(&p, &output, false).unwrap();
    let widget = p
        .widgets
        .iter()
        .find(|w| w.definition.id == "contract-fixture")
        .unwrap();
    assert!(
        !output
            .join("revisions/contract-fixture")
            .join(build::revision(&p, widget).unwrap())
            .join("private.txt")
            .exists()
    );
}
#[test]
fn migrates_legacy_output_and_rejects_invalid_ownership_markers() {
    let p = project();
    let temp = tempfile::tempdir().unwrap();
    let output = temp.path().join("content");
    fs::create_dir(&output).unwrap();
    fs::write(
        output.join(".chaldea-content"),
        "Chaldea generated content v1\n",
    )
    .unwrap();
    fs::write(output.join("stale.txt"), "old generated content").unwrap();
    build::build(&p, &output, true).unwrap();
    assert_eq!(
        fs::read_to_string(output.join(".xlr8-content")).unwrap(),
        "XLR8 generated content v1\n"
    );
    assert!(output.join("catalog.json").is_file());
    assert!(!output.join(".chaldea-content").exists());
    assert!(!output.join("stale.txt").exists());
    build::build(&p, &output, false).unwrap();

    for name in [".xlr8-content", ".chaldea-content"] {
        let unowned = temp.path().join(name);
        fs::create_dir(&unowned).unwrap();
        fs::write(unowned.join(name), "unrecognized marker").unwrap();
        fs::write(unowned.join("keep"), "user content").unwrap();
        assert!(build::build(&p, &unowned, false).is_err());
        assert_eq!(
            fs::read_to_string(unowned.join("keep")).unwrap(),
            "user content"
        );
    }
}
#[test]
fn failed_build_preserves_last_output_and_refuses_unowned_directories() {
    let temp = fixture();
    let output = temp.path().join("generated");
    build::build(&load(&temp), &output, false).unwrap();
    let before = fs::read(output.join("catalog.json")).unwrap();
    fs::remove_file(
        temp.path()
            .join("widgets/contract-fixture/qml/Widget.qml.tmpl"),
    )
    .unwrap();
    assert!(fails(&temp));
    assert_eq!(before, fs::read(output.join("catalog.json")).unwrap());
    let p = project();
    let unowned = temp.path().join("important");
    fs::create_dir(&unowned).unwrap();
    fs::write(unowned.join("keep"), "yes").unwrap();
    assert!(build::build(&p, &unowned, false).is_err());
    assert_eq!(fs::read_to_string(unowned.join("keep")).unwrap(), "yes");
    assert!(build::build(&p, &p.source, false).is_err());
}
