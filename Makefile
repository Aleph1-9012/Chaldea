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
GROUP ?=
SCOPE ?= all
.DEFAULT_GOAL := help
.NOTPARALLEL:
.PHONY: help setup content dev check build preview native-check _check-code _check-content
help:
	@printf '%s\n' 'make setup       Check Rust/Bun and install frozen dependencies' 'make dev         Build local content including drafts; start Vite' 'make content     Rebuild local widget content after source edits' 'make check       Full Rust, content, TypeScript, unit, browser checks' 'make check SCOPE=core                 Shared code and content validation, without browsers' 'make check WIDGET=glyphs/branch-grammar  One widget, using its source path or ID' 'make check GROUP=glyphs               A category or study folder' 'make build       Build production dist/ without drafts' 'make preview     Serve the production build' 'make native-check WIDGET=quick-notes/refined  Exact native exports, using source path or ID'
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
	cd "$(ROOT)/frontend" && "$(BUN)" scripts/check.ts "$(SCOPE)" "$(WIDGET)" "$(GROUP)"
_check-code:
	$(CARGO) fmt --manifest-path "$(MANIFEST)" --check
	$(CARGO) clippy --locked --manifest-path "$(MANIFEST)" --all-targets -- -D warnings
	$(CARGO) test --locked --manifest-path "$(MANIFEST)"
	cd "$(ROOT)/frontend" && "$(BUN)" run typecheck
_check-content:
	$(CARGO) run --locked --manifest-path "$(MANIFEST)" -- check $(CONTENT_ARGS)
build:
	$(CARGO) run --locked --manifest-path "$(MANIFEST)" -- build $(CONTENT_ARGS) --out "$(ROOT)/build/content"
	cd "$(ROOT)/frontend" && "$(BUN)" run build
preview:
	@test -f "$(ROOT)/dist/index.html" || { echo 'Run make build first.'; exit 1; }
	cd "$(ROOT)/frontend" && "$(BUN)" run preview
native-check: content
	@test -n "$(WIDGET)" || { echo 'Provide an existing native widget ID with WIDGET=<id>.'; exit 1; }
	cd "$(ROOT)/frontend" && "$(BUN)" run native-check "$(WIDGET)"
