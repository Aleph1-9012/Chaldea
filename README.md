# Chaldea

A widget library for Quickshell. Browse interactive previews, customize their appearance, and copy or download widgets for your desktop.

## Use the library

1. Browse the collection and try a widget in its preview.
2. Adjust its available settings to fit your setup.
3. Copy the QML or download the complete widget ZIP.

Each download includes the widget's supporting files, usage instructions, and license. Follow its included README to run it or add it to your Quickshell configuration.

All current widgets have native downloads. Lockscreen downloads provide visual components and demo interactions; authentication and desktop session locking are separate integrations. Browsing and customization require no account.

## Browse locally

Local setup requires GNU Make, a C compiler, and the pinned [Rust](rust-toolchain.toml) and [Bun](.bun-version) versions.

```sh
git clone https://github.com/Aleph1-9012/Chaldea.git
cd Chaldea
make setup
make dev
```

Open [localhost:5175](http://127.0.0.1:5175/) to browse the library.

## Contributing

See the [roadmap](docs/roadmap.md) for what is planned next, the [widget authoring guide](docs/widget-guide.md) for adding widgets, and the [development guide](docs/repair.md) for setup, commands, and troubleshooting.

Widget sources use [category and study folders](widgets/README.md), such as `widgets/glyphs/branch-grammar/`. Files that several widgets use unchanged live once in a group's `_shared/` folder.

Use two commands while developing:

```sh
make check  # Units, code checks, one production build, and every widget
make test   # Fast unit tests only
```

New widgets are discovered automatically. The library check validates preview script syntax and declared assets, settings, QML generation, ZIP contents, and the production catalog. It needs no browser or desktop session. Review visible layout and interaction in `make dev`; check native QML in an isolated Quickshell configuration before publishing it.

CI runs the same `make check` command. There are no test scopes, widget-specific test suites, or browser installation steps.

## License

The application is licensed under [Apache 2.0](LICENSE). Original widget code and assets use [0BSD](widgets/LICENSE). Third-party material retains its own terms. See [licensing](docs/licensing.md) for details.
