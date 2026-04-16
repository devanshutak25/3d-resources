#!/bin/bash
# Build: data/*.yml → README.md → _site/index.html + _site/data.json
# Hybrid (c): data/ is source of truth; README.md is derived.

set -e

npm install marked js-yaml

# Step 1: regenerate README.md from data/*.yml
node scripts/render.js > README.md

# Step 2: build HTML site from README.md
node scripts/build-html.js

# Step 3: export entries as JSON index for client-side filter UI
node scripts/export-data.js _site/data.json
