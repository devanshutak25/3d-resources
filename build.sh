#!/bin/bash
# Build: data/*.yml → README.md → _site/index.html + _site/data.json
# Hybrid (c): data/ is source of truth; README.md is derived.

set -e

npm install marked js-yaml minisearch

# Step 1: regenerate README.md from data/*.yml
node scripts/render.js > README.md

# Step 2: build HTML site from README.md
node scripts/build-html.js

# Step 3: export entries as JSON index for client-side filter UI
node scripts/export-data.js _site/data.json

# Step 4: vendor MiniSearch UMD + build serialized search index
mkdir -p _site/assets/js/vendor
cp node_modules/minisearch/dist/umd/index.js _site/assets/js/vendor/minisearch.js
node scripts/build-search-index.js _site/data.json _site/search-index.json

# Step 5: build graph.json + place graph.html for the WebGL graph view
node scripts/build-graph.js _site/graph.json
cp assets/graph.html _site/graph.html
