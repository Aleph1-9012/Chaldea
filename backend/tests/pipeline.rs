use chaldea::{build, content, validate};
use serde_json::{Value, json};
use std::{
    fs,
    path::{Path, PathBuf},
};
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
    fs::copy(
        root().join("chaldea.toml"),
        temp.path().join("chaldea.toml"),
    )
    .unwrap();
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
    content::load(
        &temp.path().join("chaldea.toml"),
        &temp.path().join("widgets"),
    )
    .unwrap()
}
fn fails(temp: &tempfile::TempDir) -> bool {
    content::load(
        &temp.path().join("chaldea.toml"),
        &temp.path().join("widgets"),
    )
    .is_err()
}

#[test]
fn shared_setting_and_template_contracts() {
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
fn discovery_preserves_identity_after_folder_moves_and_rejects_duplicates() {
    let temp = fixture();
    let before = load(&temp);
    let group = temp.path().join("widgets/notes/study");
    fs::create_dir_all(&group).unwrap();
    fs::rename(
        temp.path().join("widgets/contract-fixture"),
        group.join("renamed"),
    )
    .unwrap();
    let after = load(&temp);
    assert_eq!(after.widgets.len(), before.widgets.len());
    for (old, new) in before.widgets.iter().zip(&after.widgets) {
        assert_eq!(old.definition.id, new.definition.id);
        assert_eq!(
            build::revision(&before, old).unwrap(),
            build::revision(&after, new).unwrap()
        );
    }
    copy_dir(&group.join("renamed"), &group.join("duplicate"));
    assert!(fails(&temp));
    let temp = fixture();
    fs::create_dir(temp.path().join("widgets/empty-group")).unwrap();
    assert!(fails(&temp));
}

#[test]
fn shared_group_files_serve_widgets_without_their_own_copy() {
    let license = |p: &content::Project| {
        let widget = p
            .widgets
            .iter()
            .find(|w| w.definition.id == "contract-fixture");
        widget.unwrap().inputs["LICENSE"].clone()
    };
    let temp = fixture();
    let before = load(&temp);
    let widgets = temp.path().join("widgets");
    let group = widgets.join("notes");
    fs::create_dir_all(group.join("_shared")).unwrap();
    fs::rename(widgets.join("contract-fixture"), group.join("design")).unwrap();
    fs::rename(group.join("design/LICENSE"), group.join("_shared/LICENSE")).unwrap();
    let hoisted = load(&temp);
    assert_eq!(hoisted.widgets.len(), before.widgets.len());
    for (old, new) in before.widgets.iter().zip(&hoisted.widgets) {
        assert_eq!(
            build::revision(&before, old).unwrap(),
            build::revision(&hoisted, new).unwrap()
        );
    }
    fs::create_dir(widgets.join("_shared")).unwrap();
    fs::write(widgets.join("_shared/LICENSE"), "library terms").unwrap();
    assert_eq!(license(&load(&temp)), license(&before));
    fs::remove_file(group.join("_shared/LICENSE")).unwrap();
    assert_eq!(license(&load(&temp)), b"library terms");
    fs::write(group.join("design/LICENSE"), "own terms").unwrap();
    assert_eq!(license(&load(&temp)), b"own terms");
    fs::remove_file(group.join("design/LICENSE")).unwrap();
    fs::remove_file(widgets.join("_shared/LICENSE")).unwrap();
    assert!(fails(&temp));
    let temp = fixture();
    fs::create_dir_all(temp.path().join("widgets/group/_shared")).unwrap();
    assert!(fails(&temp));
    #[cfg(unix)]
    {
        let temp = fixture();
        let widgets = temp.path().join("widgets");
        fs::create_dir(widgets.join("_shared")).unwrap();
        fs::write(widgets.join("_shared/LICENSE"), "library terms").unwrap();
        let own = widgets.join("contract-fixture/LICENSE");
        fs::remove_file(&own).unwrap();
        std::os::unix::fs::symlink(widgets.join("missing"), &own).unwrap();
        assert!(fails(&temp));
        fs::remove_file(&own).unwrap();
        fs::remove_file(widgets.join("_shared/LICENSE")).unwrap();
        std::os::unix::fs::symlink(
            temp.path().join("chaldea.toml"),
            widgets.join("_shared/LICENSE"),
        )
        .unwrap();
        assert!(fails(&temp));
    }
}

#[test]
fn file_mappings_reject_escapes_conflicts_and_reserved_paths() {
    for invalid in ["../../chaldea.toml", "/etc/passwd", "../private.txt"] {
        let temp = fixture();
        change(&temp, |d| d["publicFiles"][0]["source"] = json!(invalid));
        assert!(fails(&temp), "{invalid}");
    }
    for invalid in [
        "bundle.json",
        "preview-runtime.js",
        "files/private.txt",
        "preview",
    ] {
        let temp = fixture();
        change(&temp, |d| d["publicFiles"][2]["path"] = json!(invalid));
        assert!(fails(&temp), "{invalid}");
    }
    #[cfg(unix)]
    {
        let temp = fixture();
        let asset = temp
            .path()
            .join("widgets/contract-fixture/assets/sample.txt");
        fs::remove_file(&asset).unwrap();
        std::os::unix::fs::symlink(temp.path().join("chaldea.toml"), asset).unwrap();
        assert!(fails(&temp));
        let temp = fixture();
        std::os::unix::fs::symlink(
            temp.path().join("widgets"),
            temp.path().join("widgets/loop"),
        )
        .unwrap();
        assert!(fails(&temp));
    }
}

#[test]
fn definitions_reject_invalid_settings_and_incomplete_published_widgets() {
    for modify in [
        |d: &mut Value| d["settings"][0]["default"] = json!(200),
        |d: &mut Value| d["settings"][1]["key"] = json!("level"),
        |d: &mut Value| d["exports"] = json!([]),
        |d: &mut Value| d["id"] = json!("Bad ID"),
        |d: &mut Value| d["usage"] = Value::Null,
    ] {
        let temp = fixture();
        change(&temp, modify);
        assert!(fails(&temp));
    }
    for path in [
        "preview/index.html",
        "assets/sample.txt",
        "qml/Widget.qml.tmpl",
        "README.md",
        "LICENSE",
    ] {
        let temp = fixture();
        fs::remove_file(temp.path().join("widgets/contract-fixture").join(path)).unwrap();
        assert!(fails(&temp), "{path}");
    }
}

#[test]
fn revisions_are_deterministic_and_track_only_declared_inputs() {
    let temp = fixture();
    let mut p = load(&temp);
    let original = build::revision(&p, &p.widgets[0]).unwrap();
    assert_eq!(original, build::revision(&p, &p.widgets[0]).unwrap());
    fs::write(
        temp.path().join("widgets/contract-fixture/private.txt"),
        "private",
    )
    .unwrap();
    let reloaded = load(&temp);
    assert_eq!(
        original,
        build::revision(&reloaded, &reloaded.widgets[0]).unwrap()
    );
    p.shared
        .get_mut(&p.config.preview_runtime)
        .unwrap()
        .push(b' ');
    assert_ne!(original, build::revision(&p, &p.widgets[0]).unwrap());
    let mut p = reloaded;
    p.widgets[0].inputs.get_mut("README.md").unwrap().push(b' ');
    assert_ne!(original, build::revision(&p, &p.widgets[0]).unwrap());
}

#[test]
fn production_replaces_old_output_without_publishing_drafts_or_private_files() {
    let temp = fixture();
    fs::write(
        temp.path().join("widgets/contract-fixture/private.txt"),
        "private",
    )
    .unwrap();
    let p = load(&temp);
    let output = temp.path().join("output");
    build::build(&p, &output, true).unwrap();
    assert!(output.join("revisions/draft-fixture").is_dir());
    build::build(&p, &output, false).unwrap();
    let catalog: Value =
        serde_json::from_slice(&fs::read(output.join("catalog.json")).unwrap()).unwrap();
    assert_eq!(catalog["widgets"].as_array().unwrap().len(), 1);
    assert_eq!(catalog["widgets"][0]["id"], "contract-fixture");
    assert!(!output.join("revisions/draft-fixture").exists());
    let widget = p
        .widgets
        .iter()
        .find(|w| w.definition.id == "contract-fixture")
        .unwrap();
    let bundle = output
        .join("revisions/contract-fixture")
        .join(build::revision(&p, widget).unwrap());
    assert!(bundle.join("bundle.json").is_file());
    assert!(bundle.join("files/LICENSE").is_file());
    assert!(!bundle.join("private.txt").exists());
}

#[test]
fn output_ownership_is_required_before_replacing_a_directory() {
    let p = project();
    let temp = tempfile::tempdir().unwrap();
    let output = temp.path().join("output");
    fs::create_dir(&output).unwrap();
    fs::write(output.join("keep"), "user file").unwrap();
    assert!(build::build(&p, &output, false).is_err());
    fs::write(output.join(".chaldea-content"), "incorrect marker").unwrap();
    assert!(build::build(&p, &output, false).is_err());
    assert_eq!(
        fs::read_to_string(output.join("keep")).unwrap(),
        "user file"
    );
    fs::write(
        output.join(".chaldea-content"),
        "Chaldea generated content v1\n",
    )
    .unwrap();
    build::build(&p, &output, false).unwrap();
    assert!(!output.join("keep").exists());
    assert!(output.join("catalog.json").is_file());
    assert!(build::build(&p, &p.source, false).is_err());
}

#[test]
fn failed_packaging_leaves_the_previous_catalog_and_files_untouched() {
    let mut p = project();
    let temp = tempfile::tempdir().unwrap();
    let output = temp.path().join("output");
    build::build(&p, &output, false).unwrap();
    let before = fs::read(output.join("catalog.json")).unwrap();
    let widget = p
        .widgets
        .iter_mut()
        .find(|w| w.definition.id == "contract-fixture")
        .unwrap();
    widget
        .inputs
        .insert("qml/Widget.qml.tmpl".into(), vec![0xff]);
    assert!(build::build(&p, &output, false).is_err());
    assert_eq!(fs::read(output.join("catalog.json")).unwrap(), before);
}
