use crate::error::{Result, issue};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::BTreeMap,
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
    let mut shared = BTreeMap::from([("xlr8.toml".into(), config_bytes)]);
    for path in config
        .shared_inputs
        .iter()
        .chain(std::iter::once(&config.preview_runtime))
    {
        shared.insert(path.clone(), read(&confined(&root, path)?)?);
    }
    let schema: Value = serde_json::from_str(include_str!("../../schemas/widget.schema.json"))?;
    let validator = jsonschema::validator_for(&schema)?;
    let mut entries = fs::read_dir(&source)?.collect::<std::io::Result<Vec<_>>>()?;
    entries.sort_by_key(|e| e.file_name());
    let mut widgets = Vec::new();
    for entry in entries {
        if entry.file_name().to_string_lossy().starts_with('.') || !entry.path().is_dir() {
            continue;
        }
        let dir = confined(&source, &entry.file_name().to_string_lossy())?;
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
        if definition.id != entry.file_name().to_string_lossy() {
            return Err(issue(&file, "id", "ID must match its widget directory"));
        }
        let mut inputs = BTreeMap::new();
        for path in definition
            .public_files
            .iter()
            .map(|f| &f.source)
            .chain(definition.exports.iter().map(|f| &f.source))
            .chain(definition.usage.iter())
        {
            inputs.insert(path.clone(), read(&confined(&dir, path)?)?);
        }
        let widget = Widget {
            dir,
            definition,
            inputs,
        };
        crate::validate::widget(&widget)?;
        widgets.push(widget);
    }
    Ok(Project {
        root,
        source,
        config,
        shared,
        widgets,
    })
}
