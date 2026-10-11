#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
root="$(pwd -P)"
bun_version="$(cat .bun-version)"
rust_version="$(sed -n 's/^channel = "\(.*\)"/\1/p' rust-toolchain.toml)"
source_commit="${VERCEL_GIT_COMMIT_SHA:-$(git rev-parse HEAD)}"
production_origin="https://chaldea.vercel.app"

[[ "$source_commit" =~ ^[a-f0-9]{40}$ ]]
[[ "$bun_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
[[ "$rust_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
[[ "$(uname -s)-$(uname -m)" == Linux-x86_64 ]]

temporary="$(mktemp -d "${TMPDIR:-/tmp}/chaldea-vercel.XXXXXX")"
trap 'rm -rf -- "$temporary"' EXIT
mkdir -p "$root/build/tools"

# Install the repository's exact versions without changing global toolchains.
bun_binary="$root/build/tools/bun-linux-x64/bun"
if [[ ! -x "$bun_binary" ]] || [[ "$("$bun_binary" --version)" != "$bun_version" ]]; then
  curl --fail --silent --show-error --location --retry 2 --max-time 180 \
    "https://github.com/oven-sh/bun/releases/download/bun-v$bun_version/bun-linux-x64.zip" \
    --output "$temporary/bun.zip"
  unzip -qo "$temporary/bun.zip" -d "$root/build/tools"
fi

export CARGO_HOME="$root/build/cargo-home"
export RUSTUP_HOME="$root/build/vercel-rustup"
export PATH="$root/build/tools/bun-linux-x64:$CARGO_HOME/bin:$PATH"

if [[ ! -x "$CARGO_HOME/bin/rustup" ]]; then
  curl --fail --silent --show-error --location --retry 2 --max-time 60 \
    https://sh.rustup.rs --output "$temporary/rustup-init.sh"
  sh "$temporary/rustup-init.sh" -y --no-modify-path --default-toolchain none
fi

rustup toolchain install "$rust_version" --profile minimal --component rustfmt --component clippy
export RUSTUP_TOOLCHAIN="$rust_version"
make setup
make check

bun frontend/scripts/deployment-history.ts restore "$production_origin" "$temporary/history"
bun frontend/scripts/prepare-vercel.ts "$root/dist" "$root/.vercel/output" "$temporary/history"
bun frontend/scripts/deployment-history.ts record "$root/.vercel/output/static" "$source_commit"

# Normal Git branch queuing serializes builds. Also detect a manual publication
# that changed production while this build was restoring its history.
curl --fail --silent --show-error --connect-timeout 10 --max-time 30 \
  --header 'Cache-Control: no-cache' "$production_origin/deployment.json" \
  --output "$temporary/current-deployment.json"
if ! bun -e '
  const previous = Buffer.from(await Bun.file(process.argv[1]).arrayBuffer());
  const current = Buffer.from(await Bun.file(process.argv[2]).arrayBuffer());

  process.exit(previous.equals(current) ? 0 : 1);
' "$temporary/history/deployment.json" "$temporary/current-deployment.json"; then
  echo 'Production changed during this build. Redeploy to include its published files.' >&2
  exit 1
fi
