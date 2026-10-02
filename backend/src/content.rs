use crate::error::{Result, issue};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    path::{Path, PathBuf},
};

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Config {
    pub format_version: u32,
    pub settings_schema_version: u32,
    pub widgets: String,
    pub license: String,
    pub native_baseline: String,
    pub preview_runtime: String,
    pub shared_inputs: Vec<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Setting {
    pub key: String,
    pub label: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub default: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub step: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_length: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub choices: Option<Vec<String>>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicFile {
    pub source: String,
    pub path: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Export {
    pub source: String,
    pub path: String,
    pub kind: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Definition {
    pub format_version: u32,
    pub settings_schema_version: u32,
    pub license: String,
    pub id: String,
    pub title: String,
    pub summary: String,
    pub category: String,
    pub tags: Vec<String>,
    pub status: String,
    pub preview: String,
    pub thumbnail: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub usage: Option<String>,
    pub settings: Vec<Setting>,
    pub public_files: Vec<PublicFile>,
    pub exports: Vec<Export>,
}
pub struct Widget {
    pub dir: PathBuf,
    pub definition: Definition,
    pub inputs: BTreeMap<String, Vec<u8>>,
}
pub struct Project {
    pub root: PathBuf,
    pub source: PathBuf,
    pub config: Config,
    pub shared: BTreeMap<String, Vec<u8>>,
    pub widgets: Vec<Widget>,
}

pub fn read(path: &Path) -> Result<Vec<u8>> {
    let meta = fs::metadata(path).map_err(|e| issue(path, "read", e))?;
    if !meta.is_file() || meta.len() > 8 * 1024 * 1024 {
        return Err(issue(
            path,
            "read",
            "expected a regular file smaller than 8 MiB",
        ));
    }
    fs::read(path).map_err(|e| issue(path, "read", e))
}
pub fn confined(root: &Path, relative: &str) -> Result<PathBuf> {
    if !crate::validate::safe_path(relative) {
        return Err(issue(root, relative, "expected a confined relative path"));
    }
    let path = root
        .join(relative)
        .canonicalize()
        .map_err(|e| issue(root, relative, e))?;
    if !path.starts_with(root) {
        return Err(issue(root, relative, "symlink escapes source directory"));
    }
    Ok(path)
}
/// Files in a group's `_shared` folder serve every widget below that group.
const SHARED: &str = "_shared";
/// Resolve a declared source. A widget's own file wins; otherwise the nearest
/// parent group's `_shared` folder supplies it.
fn source_file(library: &Path, widget: &Path, relative: &str) -> Result<PathBuf> {
    let groups = widget
        .ancestors()
        .skip(1)
        .take_while(|group| group.starts_with(library))
        .map(|group| group.join(SHARED));
    for root in std::iter::once(widget.to_path_buf()).chain(groups) {
        // A dangling link is an error in `confined`, never a reason to fall back.
        if root.join(relative).symlink_metadata().is_ok() {
            return confined(&root, relative);
        }
    }
    Err(issue(
        widget,
        relative,
        "not found in this widget or a parent _shared folder",
    ))
}
fn widget_directories(dir: &Path, found: &mut Vec<PathBuf>, allow_empty: bool) -> Result<()> {
    if dir.join("widget.json").exists() {
        found.push(dir.to_path_buf());
        return Ok(());
    }
    let start = found.len();
    let mut entries = fs::read_dir(dir)?.collect::<std::io::Result<Vec<_>>>()?;
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if name.starts_with('.') {
            continue;
        }
        let kind = entry.file_type()?;
        if kind.is_symlink() {
            return Err(issue(
                &entry.path(),
                "discovery",
                "source groups cannot contain symlinks",
            ));
        }
        if kind.is_dir() && name != SHARED {
            widget_directories(&confined(dir, &name)?, found, false)?;
        }
    }
    if found.len() == start && !allow_empty {
        return Err(issue(
            dir,
            "discovery",
            "no widget.json found in this source group",
        ));
    }
    Ok(())
}
pub fn load(config_path: &Path, source: &Path) -> Result<Project> {
    let config_path = config_path.canonicalize()?;
    let root = config_path.parent().unwrap().to_path_buf();
    let config_bytes = read(&config_path)?;
    let config: Config = toml::from_str(std::str::from_utf8(&config_bytes)?)?;
    if config.format_version != 1
        || config.settings_schema_version == 0
        || !["MIT", "0BSD"].contains(&config.license.as_str())
    {
        return Err(issue(
            &config_path,
            "defaults",
            "unsupported format, settings version, or license",
        ));
    }
    let source = source.canonicalize()?;
    if source != confined(&root, &config.widgets)? {
        return Err(issue(
            &config_path,
            "widgets",
            "--source must match configured widgets directory",
        ));
    }
    let mut shared = BTreeMap::from([("chaldea.toml".into(), config_bytes)]);
    for path in config
        .shared_inputs
        .iter()
        .chain(std::iter::once(&config.preview_runtime))
    {
        shared.insert(path.clone(), read(&confined(&root, path)?)?);
    }
    let schema: Value = serde_json::from_str(include_str!("../../schemas/widget.schema.json"))?;
    let validator = jsonschema::validator_for(&schema)?;
    let mut directories = Vec::new();
    widget_directories(&source, &mut directories, true)?;
    let mut widgets = Vec::new();
    let mut ids = BTreeSet::new();
    for dir in directories {
        let file = confined(&dir, "widget.json")?;
        let mut raw: Value =
            serde_json::from_slice(&read(&file)?).map_err(|e| issue(&file, "JSON", e))?;
        let object = raw
            .as_object_mut()
            .ok_or_else(|| issue(&file, "definition", "expected an object"))?;
        object
            .entry("formatVersion")
            .or_insert(config.format_version.into());
        object
            .entry("settingsSchemaVersion")
            .or_insert(config.settings_schema_version.into());
        object
            .entry("license")
            .or_insert(config.license.clone().into());
        validator
            .validate(&raw)
            .map_err(|e| issue(&file, "schema", e))?;
        let definition: Definition = serde_json::from_value(raw)?;
        if !ids.insert(definition.id.clone()) {
            return Err(issue(&file, "id", "duplicate widget ID"));
        }
        let mut inputs = BTreeMap::new();
        for path in definition
            .public_files
            .iter()
            .map(|f| &f.source)
            .chain(definition.exports.iter().map(|f| &f.source))
            .chain(definition.usage.iter())
        {
            inputs.insert(path.clone(), read(&source_file(&source, &dir, path)?)?);
        }
        let widget = Widget {
            dir,
            definition,
            inputs,
        };
        crate::validate::widget(&widget)?;
        widgets.push(widget);
    }
    widgets.sort_by(|a, b| a.definition.id.cmp(&b.definition.id));
    Ok(Project {
        root,
        source,
        config,
        shared,
        widgets,
    })
}
