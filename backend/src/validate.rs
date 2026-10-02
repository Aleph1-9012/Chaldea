use crate::{
    content::{Setting, Widget},
    error::{Result, issue},
};
use regex::Regex;
use std::{collections::BTreeSet, sync::LazyLock};
static PATH: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^[A-Za-z0-9_-][A-Za-z0-9_.-]*(/[A-Za-z0-9_-][A-Za-z0-9_.-]*)*$").unwrap()
});
static PROPERTY: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^\s*(?:readonly\s+)?property\s+(real|int|bool|string|color)\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*\{\{([a-z][a-zA-Z0-9]*)\}\}\s*$").unwrap()
});
pub fn safe_path(path: &str) -> bool {
    path.len() <= 180 && PATH.is_match(path)
}
pub fn setting(s: &Setting) -> std::result::Result<(), String> {
    if ["constructor", "prototype", "__proto__"].contains(&s.key.as_str()) {
        return Err("reserved setting key".into());
    }
    let valid = match s.kind.as_str() {
        "number" => match (s.default.as_f64(), s.min, s.max, s.step) {
            (Some(n), Some(min), Some(max), Some(step)) => {
                [n, min, max, step].iter().all(|v| v.is_finite())
                    && step > 0.0
                    && min <= n
                    && n <= max
                    && (((n - min) / step).round() - (n - min) / step).abs() < 1e-7
            }
            _ => false,
        },
        "string" => s
            .default
            .as_str()
            .is_some_and(|v| s.max_length.is_some_and(|m| v.chars().count() <= m)),
        "enum" => s
            .default
            .as_str()
            .is_some_and(|v| s.choices.as_ref().is_some_and(|c| c.iter().any(|x| x == v))),
        "boolean" => s.default.is_boolean(),
        "color" => s.default.as_str().is_some_and(|v| {
            v.len() == 7 && v.starts_with('#') && v[1..].bytes().all(|c| c.is_ascii_hexdigit())
        }),
        _ => false,
    };
    if valid {
        Ok(())
    } else {
        Err("default does not satisfy its declared type, range, step, or choices".into())
    }
}
pub fn template(
    source: &str,
    settings: &[Setting],
) -> std::result::Result<BTreeSet<String>, String> {
    if source.trim().is_empty() {
        return Err("QML templates must not be empty".into());
    }
    let mut used = BTreeSet::new();
    for line in source.lines() {
        if !line.contains("{{") && !line.contains("}}") {
            continue;
        }
        let binding = PROPERTY
            .captures(line)
            .ok_or("placeholder must be a complete typed QML property value")?;
        let key = &binding[2];
        let s = settings
            .iter()
            .find(|s| s.key == key)
            .ok_or_else(|| format!("undeclared placeholder {key}"))?;
        let compatible = match s.kind.as_str() {
            "number" => {
                &binding[1] == "real"
                    || (&binding[1] == "int"
                        && s.min.is_some_and(|v| v >= -2147483648.0)
                        && s.max.is_some_and(|v| v <= 2147483647.0)
                        && [s.min, s.max, s.step]
                            .iter()
                            .all(|n| n.is_some_and(|v| v.fract() == 0.0)))
            }
            "boolean" => &binding[1] == "bool",
            "color" => &binding[1] == "color" || &binding[1] == "string",
            _ => &binding[1] == "string",
        };
        if !compatible {
            return Err(format!("{key} has an incompatible QML property type"));
        }
        used.insert(key.to_owned());
    }
    Ok(used)
}
fn unique_path(paths: &mut BTreeSet<String>, path: &str) -> bool {
    if !safe_path(path)
        || paths.iter().any(|p| {
            p == path || p.starts_with(&format!("{path}/")) || path.starts_with(&format!("{p}/"))
        })
    {
        return false;
    }
    paths.insert(path.to_owned());
    true
}
pub fn widget(widget: &Widget) -> Result<()> {
    let d = &widget.definition;
    let file = widget.dir.join("widget.json");
    let mut keys = BTreeSet::new();
    for s in &d.settings {
        if !keys.insert(&s.key) {
            return Err(issue(&file, &s.key, "duplicate setting key"));
        }
        setting(s).map_err(|e| issue(&file, &s.key, e))?;
    }
    let mut public = BTreeSet::from([
        "bundle.json".to_owned(),
        "preview-runtime.js".to_owned(),
        "files".to_owned(),
    ]);
    for f in &d.public_files {
        if !unique_path(&mut public, &f.path) {
            return Err(issue(
                &file,
                &f.path,
                "duplicate, conflicting, or reserved public path",
            ));
        }
    }
    for required in [&d.preview, &d.thumbnail] {
        if !d.public_files.iter().any(|f| &f.path == required) {
            return Err(issue(&file, required, "must appear in publicFiles"));
        }
    }
    if !d.preview.ends_with(".html") {
        return Err(issue(&file, "preview", "expected an HTML entry"));
    }
    let mut exports = BTreeSet::new();
    let mut bound = BTreeSet::new();
    for f in &d.exports {
        if !unique_path(&mut exports, &f.path) {
            return Err(issue(
                &file,
                &f.path,
                "duplicate or conflicting export path",
            ));
        }
        if f.kind == "template" {
            if !f.path.ends_with(".qml") {
                return Err(issue(&file, &f.path, "templates must produce QML"));
            }
            let text = std::str::from_utf8(&widget.inputs[&f.source])
                .map_err(|e| issue(&file, &f.source, e))?;
            bound.extend(template(text, &d.settings).map_err(|e| issue(&file, &f.source, e))?);
        }
    }
    let has_qml = d.exports.iter().any(|f| f.kind == "template");
    if has_qml && keys.iter().any(|key| !bound.contains(*key)) {
        return Err(issue(&file, "settings", "every setting must bind to QML"));
    }
    if d.status == "published" {
        if !has_qml {
            return Err(issue(&file, "exports", "published widgets require QML"));
        }
        let usage = d
            .usage
            .as_ref()
            .ok_or_else(|| issue(&file, "usage", "published widgets require instructions"))?;
        if std::str::from_utf8(&widget.inputs[usage])?
            .trim()
            .is_empty()
            || !d
                .exports
                .iter()
                .any(|f| &f.source == usage && f.kind == "file")
        {
            return Err(issue(
                &file,
                "usage",
                "instructions must be nonempty and exported",
            ));
        }
        if !d
            .exports
            .iter()
            .any(|f| f.path == "LICENSE" && f.kind == "file")
        {
            return Err(issue(&file, "license", "include LICENSE in exports"));
        }
    }
    Ok(())
}
