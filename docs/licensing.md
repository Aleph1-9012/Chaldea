# Licensing

The application uses Apache 2.0. Original widget code and original widget assets use 0BSD.

## Application

The root `LICENSE` applies to the Rust tooling, frontend application, schemas, scripts, and documentation, unless a file specifies otherwise. Package metadata uses the SPDX identifier `Apache-2.0`. Preserve the license, copyright and attribution notices, and mark modified files when redistributing changes, as required by the license.

The production website includes `LICENSE.txt`, `NOTICE.txt`, and Vite's `THIRD_PARTY_LICENSES.txt` for bundled dependencies. Preserve these notices when distributing the static build.

## Widgets

`widgets/LICENSE` applies to original HTML, adapters, QML, and original visual assets under `widgets/`. Each widget's output list includes its own license, packaged from the identical copy in `widgets/_shared/LICENSE`. Save it alongside the other output files. Change both license source files together. Generated QML has a 0BSD SPDX header. The application's Apache license does not replace the separate license on original widget code.

Third-party dependencies and assets retain their own terms. Previews use system fonts and local assets. The Tsugumori studies are fan designs; the software licenses make no claim to third-party names, marks, or characters. Each widget README records source provenance. Widget exports must include any applicable third-party notices, and those notices must be retained with the downloaded files.
