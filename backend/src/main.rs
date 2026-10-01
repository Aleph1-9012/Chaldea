use std::{collections::BTreeMap, path::Path, process::ExitCode};
use xlr8::{build, content, error::Result};
fn run() -> Result<()> {
    let mut args = std::env::args().skip(1);
    let command = args.next().unwrap_or_default();
    if command == "--help" || command == "-h" {
        println!("xlr8 check|build --config PATH --source PATH [--out PATH] [--include-drafts]");
        return Ok(());
    }
    if !["check", "build"].contains(&command.as_str()) {
        return Err("expected check or build; use --help".into());
    }
    let mut paths = BTreeMap::new();
    let mut include_drafts = false;
    while let Some(arg) = args.next() {
        if arg == "--include-drafts" {
            include_drafts = true;
            continue;
        }
        if !["--config", "--source", "--out"].contains(&arg.as_str()) {
            return Err(format!("unknown argument {arg}").into());
        }
        let value = args
            .next()
            .filter(|s| !s.starts_with("--"))
            .ok_or("missing argument value")?;
        if paths.insert(arg, value).is_some() {
            return Err("duplicate argument".into());
        }
    }
    let required = |key| {
        paths
            .get(key)
            .map(Path::new)
            .ok_or_else(|| format!("missing {key}"))
    };
    let project = content::load(required("--config")?, required("--source")?)?;
    if command == "build" {
        let count = build::build(&project, required("--out")?, include_drafts)?;
        eprintln!("stage=build widgets={count} result=ok");
    } else {
        eprintln!("stage=validate widgets={} result=ok", project.widgets.len());
    }
    Ok(())
}
fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("stage=failed error={e}");
            ExitCode::FAILURE
        }
    }
}
