#!/usr/bin/env bash
# Bundles every handler listed in functions.map.json with esbuild, zips the
# bundle, and pushes it to the already-provisioned Lambda shell via
# `aws lambda update-function-code`. Pulumi owns the function shell (role,
# runtime, layers, triggers); this script owns the code only.
#
# Usage: scripts/deploy-functions.sh
# Requires: node/npm, zip, jq, aws CLI (already-configured credentials).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAP_FILE="${FUNCTIONS_MAP_FILE:-"$REPO_ROOT/functions.map.json"}"
UTILS_DIR="$REPO_ROOT/backend/Step4/dependencies/utilslayer/nodejs"

for bin in jq zip aws npm npx; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "ERROR: required tool '$bin' not found on PATH" >&2
    exit 1
  fi
done

if [ ! -f "$MAP_FILE" ]; then
  echo "ERROR: functions map not found: $MAP_FILE" >&2
  exit 1
fi

# --- Make the Step4 "utilslayer" shared code resolvable at /opt ------------
# The upstream SAM template mounted this at /opt via a real Lambda layer
# (`Layers: [!Ref UtilsLayer]` in backend/Step4/template.yaml). We bundle each
# function standalone instead of deploying a layer, and esbuild resolves
# absolute-path `require()`s (e.g. `require('/opt/logger')`) straight off
# disk at bundle time — so mirroring the layer's two files at the literal
# /opt path lets `--bundle` inline them exactly as the layer would have
# provided them, with no esbuild alias/plugin needed.
#
# As of this writing every `require('/opt/logger')` in Step4 is inside a
# disabled block comment (dead code, not an active import) — see
# activegames_delete, marketplace_get, game_play. This step is therefore
# best-effort/defensive for if that code is ever re-enabled, and must never
# fail the whole deploy.
if [ -d "$UTILS_DIR" ]; then
  if (sudo -n mkdir -p /opt && sudo -n cp "$UTILS_DIR/logger.js" "$UTILS_DIR/models.js" /opt/) 2>/dev/null; then
    echo "Mirrored utilslayer to /opt for esbuild absolute-path resolution."
  elif (mkdir -p /opt && cp "$UTILS_DIR/logger.js" "$UTILS_DIR/models.js" /opt/) 2>/dev/null; then
    echo "Mirrored utilslayer to /opt for esbuild absolute-path resolution."
  else
    echo "WARN: could not mirror utilslayer to /opt (non-fatal — no handler currently imports it live)." >&2
  fi
fi

failed=0

while IFS=$'\t' read -r handler_dir function_name; do
  [ -z "$handler_dir" ] && continue
  echo "==> $handler_dir -> $function_name"

  dir="$REPO_ROOT/$handler_dir"
  if [ ! -d "$dir" ]; then
    echo "ERROR: handler directory not found: $dir" >&2
    failed=1
    continue
  fi

  entry="app.ts"
  [ -f "$dir/$entry" ] || entry="app.js"
  if [ ! -f "$dir/$entry" ]; then
    echo "ERROR: no app.ts/app.js entrypoint in $dir" >&2
    failed=1
    continue
  fi

  if (
    set -e
    cd "$dir"
    rm -rf dist function.zip
    npm ci --no-audit --no-fund --silent --omit=dev

    # The AWS SDK stays external so the OpenTelemetry layer can instrument it.
    # `instrumentation-aws-sdk` hooks module loads of `@aws-sdk/*`; a copy that
    # esbuild has inlined and minified into app.js is never loaded as a module,
    # so it is never patched. Bundling it cost us every AWS span: DynamoDB and
    # SNS calls showed up as bare `POST` client spans from the http
    # instrumentation (which patches node's core http, and so survives
    # bundling), carrying no messaging/rpc attributes for a service graph to
    # draw a dependency from -- and, worse, no `traceparent` injected into SNS
    # MessageAttributes, so a published message could not be correlated with
    # the function that consumed it.
    #
    # sharp (playeravatar_thumbnail) ships native platform binaries, which
    # esbuild cannot inline into a single-file bundle at all.
    esbuild_args=(
      --bundle
      --platform=node
      --target=node20
      --outfile=dist/app.js
      '--external:@aws-sdk/*'
    )
    if [ -f package.json ] && grep -q '"sharp"' package.json; then
      esbuild_args+=(--external:sharp)
    fi

    npx --yes esbuild "$entry" "${esbuild_args[@]}"

    # Everything external has to be resolvable at runtime, so node_modules ships
    # with the bundle. The whole tree, not just node_modules/@aws-sdk: npm's
    # layout is flat, so the SDK's own dependencies (@smithy/*, @aws-crypto/*,
    # tslib, ...) sit next to it rather than inside it. This is deliberately not
    # relying on the SDK the nodejs runtime provides -- that would ship nothing
    # at all, but it pins us to whatever version the runtime carries and assumes
    # it includes @aws-sdk/lib-dynamodb, which several handlers import.
    (cd dist && zip -q -r ../function.zip app.js)
    zip -q -r function.zip node_modules
  ); then
    :
  else
    echo "ERROR: bundle/zip failed for $handler_dir" >&2
    failed=1
    continue
  fi

  if ! aws lambda update-function-code \
    --function-name "$function_name" \
    --zip-file "fileb://$dir/function.zip" \
    --output text >/dev/null; then
    echo "ERROR: aws lambda update-function-code failed for $function_name" >&2
    failed=1
  fi
done < <(jq -r 'to_entries[] | "\(.key)\t\(.value)"' "$MAP_FILE")

exit "$failed"
