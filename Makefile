ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
BUN ?= $(if $(wildcard $(ROOT)/build/tools/bun-linux-x64/bun),$(ROOT)/build/tools/bun-linux-x64/bun,bun)
CARGO ?= cargo
RUSTC ?= rustc
CARGO_HOME ?= $(ROOT)/build/cargo-home
export CARGO_HOME
export PATH := $(ROOT)/build/tools/bun-linux-x64:$(PATH)
export BUN_INSTALL_CACHE_DIR := $(ROOT)/build/bun-cache
MANIFEST := $(ROOT)/backend/Cargo.toml
CONTENT_ARGS := --config "$(ROOT)/xlr8.toml" --source "$(ROOT)/widgets"
WIDGET ?=
.DEFAULT_GOAL := help
.NOTPARALLEL:
.PHONY: help setup content dev check build preview native-check
help:
	@printf '%s\n' 'make setup       Check Rust/Bun and install frozen dependencies' 'make dev         Build local content including drafts; start Vite' 'make content     Rebuild local widget content after source edits' 'make check       Rust, content, TypeScript, Bun, browser checks' 'make build       Build production dist/ without drafts' 'make preview     Serve the production build' 'make native-check WIDGET=<existing-widget-id>'
setup:
	@command -v $(CARGO) >/dev/null || { echo 'Install the Rust toolchain in rust-toolchain.toml.'; exit 1; }
	@test "$$($(RUSTC) --version | cut -d ' ' -f 2)" = "$$(sed -n 's/^channel = "\(.*\)"/\1/p' "$(ROOT)/rust-toolchain.toml")" || { echo 'Install the Rust version in rust-toolchain.toml.'; exit 1; }
	@test "$$($(BUN) --version)" = "$$(cat "$(ROOT)/.bun-version")" || { echo 'Install the Bun version in .bun-version.'; exit 1; }
	@$(CARGO) fmt --version
	@$(CARGO) clippy --version
	cd "$(ROOT)/frontend" && "$(BUN)" install --frozen-lockfile
content:
	$(CARGO) run --locked --manifest-path "$(MANIFEST)" -- build $(CONTENT_ARGS) --out "$(ROOT)/build/content" --include-drafts
dev: content
	cd "$(ROOT)/frontend" && "$(BUN)" run dev
check:
	$(CARGO) fmt --manifest-path "$(MANIFEST)" --check
	$(CARGO) clippy --locked --manifest-path "$(MANIFEST)" --all-targets -- -D warnings
	$(CARGO) test --locked --manifest-path "$(MANIFEST)"
	$(CARGO) run --locked --manifest-path "$(MANIFEST)" -- check $(CONTENT_ARGS)
	$(MAKE) content
	cd "$(ROOT)/frontend" && "$(BUN)" run check
	cd "$(ROOT)/frontend" && "$(BUN)" run test:browser
build:
	$(CARGO) run --locked --manifest-path "$(MANIFEST)" -- build $(CONTENT_ARGS) --out "$(ROOT)/build/content"
	cd "$(ROOT)/frontend" && "$(BUN)" run build
preview:
	@test -f "$(ROOT)/dist/index.html" || { echo 'Run make build first.'; exit 1; }
	cd "$(ROOT)/frontend" && "$(BUN)" run preview
native-check: content
	@test -n "$(WIDGET)" || { echo 'Provide an existing native widget ID with WIDGET=<id>.'; exit 1; }
	cd "$(ROOT)/frontend" && "$(BUN)" run native-check "$(WIDGET)"
