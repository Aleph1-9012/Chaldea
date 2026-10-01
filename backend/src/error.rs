use std::{error::Error, fmt, path::Path};
pub type Result<T> = std::result::Result<T, Box<dyn Error>>;
#[derive(Debug)]
struct ContentError(String);
impl fmt::Display for ContentError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}
impl Error for ContentError {}
pub fn issue(path: &Path, field: &str, cause: impl fmt::Display) -> Box<dyn Error> {
    Box::new(ContentError(format!(
        "{} [{field}]: {cause}",
        path.display()
    )))
}
