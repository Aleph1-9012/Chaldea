use crate::{content::Definition, error::Result};
use serde_json::{Value, json};
pub fn entry(d: &Definition, revision: &str) -> Value {
    let base = format!("revisions/{}/{revision}", d.id);
    json!({"id":d.id,"title":d.title,"summary":d.summary,"category":d.category,
        "tags":d.tags,"status":d.status,"revision":revision,"settingsCount":d.settings.len(),
        "bundleUrl":format!("{base}/bundle.json"),"thumbnailUrl":format!("{base}/{}",d.thumbnail)})
}
pub fn catalog(entries: Vec<Value>) -> Result<Value> {
    let catalog = json!({"formatVersion":1,"widgets":entries});
    let schema: Value = serde_json::from_str(include_str!("../../schemas/catalog.schema.json"))?;
    jsonschema::validate(&schema, &catalog).map_err(|e| e.to_string())?;
    Ok(catalog)
}
