# XLR8

A widget library for Quickshell. Browse interactive previews, customize their appearance, and copy or download widgets for your desktop.

## Use the library

1. Browse the collection and try a widget in its preview.
2. Adjust its available settings to fit your setup.
3. Copy the QML or download the complete widget ZIP.

Each download includes the widget's supporting files, usage instructions, and license. Follow its included README to run it or add it to your Quickshell configuration.

Entries marked **HTML draft** are interactive previews with native downloads disabled. Browsing and customization require no account.

## Browse locally

Local setup requires GNU Make, a C compiler, and the pinned [Rust](rust-toolchain.toml) and [Bun](.bun-version) versions.

```sh
git clone https://github.com/Aleph1-9012/XLR8.git
cd XLR8
make setup
make dev
```

Open [localhost:5175](http://127.0.0.1:5175/) to browse the library.

## Contributing

See the [widget authoring guide](docs/widget-guide.md) for adding widgets and the [development guide](docs/repair.md) for setup, commands, and troubleshooting.

Widget sources use [category and study folders](widgets/README.md), such as `widgets/glyphs/branch-grammar/`. Run `make check WIDGET=glyphs/branch-grammar` for one widget, `make check GROUP=glyphs` for a category, or `make check SCOPE=core` for shared code. `make check` runs the full suite used by CI.

## License

The application is licensed under [Apache 2.0](LICENSE). Original widget code and assets use [0BSD](widgets/LICENSE). Third-party material retains its own terms. See [licensing](docs/licensing.md) for details.
