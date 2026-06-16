#!/bin/bash
# Build: data/*.yml → README.md → _site/index.html + _site/data.json
# Hybrid (c): data/ is source of truth; README.md is derived.

set -e

npm install marked js-yaml minisearch

# Step 1: render the FULL catalog into README.md — build-html.js reads it as input
# to emit the site's index.html (single-page catalog with all entries).
node scripts/render.js > README.md

# Step 2: build HTML site from README.md (consumes full README.md)
node scripts/build-html.js

# Step 2b: generate per-section OG PNGs (1200×630) used by section pages
# and shared-link unfurls (Twitter, Reddit, Discord, Slack).
node scripts/build-og-images.js

# Step 2c: emit per-section + per-subsection HTML pages at /sections/<slug>/ and
# /sections/<slug>/<sub>/ for SEO. Independently indexable; thin subsections are
# marked noindex. sitemap.xml is built last (build-sitemap.js).
node scripts/build-section-pages.js

# Step 4: export entries as JSON index for client-side filter UI
node scripts/export-data.js _site/data.json

# Step 4b: emit per-tag index pages at /tags/<group>/<value>/ (long-tail SEO).
# Reads data.json; thin tags (<3 entries) are noindex.
node scripts/build-tag-pages.js _site/data.json _site/tags

# Step 5: vendor MiniSearch UMD + build serialized search index
mkdir -p _site/assets/js/vendor
cp node_modules/minisearch/dist/umd/index.js _site/assets/js/vendor/minisearch.js
node scripts/build-search-index.js _site/data.json _site/search-index.json

# Step 6: build graph.json + place graph.html for the WebGL graph view
node scripts/build-graph.js _site/graph.json
cp assets/graph.html _site/graph.html

# Step 7: emit llms.txt + llms-full.txt for AI/LLM crawlers (ChatGPT, Perplexity, Claude).
# Spec: https://llmstxt.org
node scripts/build-llms-txt.js

# Step 8: emit Atom feed of the 50 most recently added entries.
node scripts/build-feed.js

# Step 9: build sitemap.xml LAST — enumerates root + section + indexable
# subsection (+ tag) pages that exist on disk by this point.
node scripts/build-sitemap.js
