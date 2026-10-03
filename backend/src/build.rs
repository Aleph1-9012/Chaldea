use crate::{
    catalog,
    content::{Project, Widget},
    error::{Result, issue},
};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::{collections::BTreeMap, fs, path::Path};
fn hash_input(hash: &mut Sha256, path: &str, bytes: &[u8]) {
    hash.update((path.len() as u64).to_le_bytes());
    hash.update(path.as_bytes());
    hash.update((bytes.len() as u64).to_le_bytes());
    hash.update(bytes);
}
pub fn revision(project: &Project, widget: &Widget) -> Result<String> {
    let mut hash = Sha256::new();
    hash_input(&mut hash, "packager", b"chaldea-bundle-v1");
    hash_input(
        &mut hash,
        "definition",
        &serde_json::to_vec(&widget.definition)?,
    );
    for (path, bytes) in &project.shared {
        hash_input(&mut hash, &format!("shared/{path}"), bytes);
    }
    for (path, bytes) in &widget.inputs {
        hash_input(&mut hash, &format!("widget/{path}"), bytes);
    }
    Ok(format!("{:x}", hash.finalize()))
}
fn write(path: &Path, bytes: &[u8]) -> Result<()> {
    fs::create_dir_all(path.parent().unwrap())?;
    fs::write(path, bytes).map_err(|e| issue(path, "write", e))
}
const MARKER: &str = ".chaldea-content";
const MARKER_TEXT: &[u8] = b"Chaldea generated content v1\n";
fn owns_output(output: &Path) -> bool {
    let marker = output.join(MARKER);
    !marker.is_symlink() && fs::read(marker).is_ok_and(|actual| actual == MARKER_TEXT)
}
fn source_index(project: &Project) -> Result<Value> {
    let mut widgets = Vec::new();
    for widget in &project.widgets {
        let path = widget
            .dir
            .strip_prefix(&project.source)?
            .to_str()
            .ok_or("widget source path must be UTF-8")?
            .replace('\\', "/");
        let thumbnail = widget
            .definition
            .public_files
            .iter()
            .find(|file| file.path == widget.definition.thumbnail)
            .ok_or_else(|| issue(&widget.dir, "thumbnail", "missing public file mapping"))?;
        widgets.push(json!({
            "id": widget.definition.id,
            "path": path,
            "thumbnailSource": thumbnail.source,
        }));
    }
    let value = json!({
        "formatVersion": 1,
        "sourceRoot": project.config.widgets,
        "widgets": widgets,
    });
    let schema: Value =
        serde_json::from_str(include_str!("../../schemas/source-index.schema.json"))?;
    jsonschema::validate(&schema, &value).map_err(|e| e.to_string())?;
    Ok(value)
}
fn bundle(project: &Project, widget: &Widget, revision: &str, dest: &Path) -> Result<()> {
    let d = &widget.definition;
    for f in &d.public_files {
        write(&dest.join(&f.path), &widget.inputs[&f.source])?;
    }
    write(
        &dest.join("preview-runtime.js"),
        &project.shared[&project.config.preview_runtime],
    )?;
    let mut templates = BTreeMap::new();
    let mut assets = Vec::new();
    for f in &d.exports {
        let bytes = &widget.inputs[&f.source];
        if f.kind == "template" {
            templates.insert(f.path.clone(), std::str::from_utf8(bytes)?);
        } else {
            let url = format!("files/{}", f.path);
            write(&dest.join(&url), bytes)?;
            assets.push(json!({"path":f.path,"url":url}));
        }
    }
    let usage = d
        .usage
        .as_ref()
        .map(|path| String::from_utf8(widget.inputs[path].clone()))
        .transpose()?
        .unwrap_or_default();
    let value = json!({"formatVersion":project.config.format_version,"id":d.id,"revision":revision,
        "settingsSchemaVersion":d.settings_schema_version,"nativeBaseline":project.config.native_baseline,
        "definition":d,"templates":templates,"assets":assets,"usage":usage});
    let mut schema: Value = serde_json::from_str(include_str!("../../schemas/bundle.schema.json"))?;
    schema["properties"]["definition"] =
        serde_json::from_str(include_str!("../../schemas/widget.schema.json"))?;
    jsonschema::validate(&schema, &value).map_err(|e| e.to_string())?;
    write(
        &dest.join("bundle.json"),
        &serde_json::to_vec_pretty(&value)?,
    )
}
pub fn build(project: &Project, output: &Path, include_drafts: bool) -> Result<usize> {
    let parent = output.parent().ok_or("output needs a parent directory")?;
    fs::create_dir_all(parent)?;
    let parent = parent.canonicalize()?;
    let output = parent.join(output.file_name().ok_or("output needs a directory name")?);
    if output.is_symlink()
        || project.root.starts_with(&output)
        || project.source.starts_with(&output)
        || output.starts_with(&project.source)
    {
        return Err(issue(
            &output,
            "output",
            "output must not overlap sources or use a symlink",
        ));
    }
    if output.exists() && !owns_output(&output) {
        return Err(issue(
            &output,
            "output",
            "refusing to replace a directory not owned by Chaldea",
        ));
    }
    let stage = tempfile::Builder::new()
        .prefix(".chaldea-stage-")
        .tempdir_in(&parent)?;
    let mut entries = Vec::new();
    for widget in &project.widgets {
        if !include_drafts && widget.definition.status == "draft" {
            continue;
        }
        let revision = revision(project, widget)?;
        let dest = stage
            .path()
            .join("revisions")
            .join(&widget.definition.id)
            .join(&revision);
        bundle(project, widget, &revision, &dest)?;
        eprintln!(
            "stage=package widget={} revision={} result=ok",
            widget.definition.id, revision
        );
        entries.push(catalog::entry(&widget.definition, &revision));
    }
    let count = entries.len();
    write(
        &stage.path().join("catalog.json"),
        &serde_json::to_vec_pretty(&catalog::catalog(entries)?)?,
    )?;
    if include_drafts {
        write(
            &stage.path().join("source-index.json"),
            &serde_json::to_vec_pretty(&source_index(project)?)?,
        )?;
    }
    write(&stage.path().join(MARKER), MARKER_TEXT)?;
    let previous = tempfile::Builder::new()
        .prefix(".chaldea-previous-")
        .tempdir_in(&parent)?;
    let saved = previous.path().join("content");
    if output.exists() {
        fs::rename(&output, &saved)?;
    }
    if let Err(error) = fs::rename(stage.path(), &output) {
        if saved.exists() {
            fs::rename(saved, &output)?;
        }
        return Err(issue(&output, "finalize", error));
    }
    Ok(count)
}
