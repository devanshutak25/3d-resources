#!/usr/bin/env node
// List paid/freemium entries where pricing_last_verified is missing or >90d old.
// Writes _maintenance/freshness/pricing.json for the digest aggregator.

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

const OUT_DIR  = path.join(__dirname, '..', '_maintenance', 'freshness');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT = path.join(OUT_DIR, 'pricing.json');

const STALE_DAYS = 90;

// Licenses where pricing could change under you
const PAID_LIKE = new Set(['Paid', 'Freemium']);

// Only product-like entry types have a single product price worth verifying.
// Storefronts (marketplace, asset-source) aggregate third-party pricing.
// Channels, tutorials, references, communities, inspiration are not products.
const PRICED_TYPES = new Set(['software', 'tool', 'plugin']);

function daysBetween(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function main() {
  const now = new Date();
  const stale = [];
  const missing = [];
  let totalPaid = 0;
  let skipped = 0;

  for (const { sectionFile, subSlug, entry: e } of catalog.iterEntries()) {
    if (e.deprecated) continue;
    if (!e.license || !PAID_LIKE.has(e.license)) continue;
    if (e.entry_type && !PRICED_TYPES.has(e.entry_type)) { skipped++; continue; }
    totalPaid++;
    const item = { file: sectionFile, sub: subSlug, name: e.name, url: e.url, license: e.license, pricing: e.pricing };
    if (!e.pricing_last_verified) {
      missing.push(item);
    } else {
      const last = new Date(e.pricing_last_verified);
      const days = daysBetween(last, now);
      if (days > STALE_DAYS) stale.push({ ...item, last_verified: e.pricing_last_verified, days_old: days });
    }
  }

  const report = {
    generated_at: new Date().toISOString().slice(0, 10),
    threshold_days: STALE_DAYS,
    priced_types: [...PRICED_TYPES],
    total_paid_entries: totalPaid,
    skipped_non_product: skipped,
    stale: stale.sort((a, b) => b.days_old - a.days_old),
    missing: missing
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

  console.log(`Paid/Freemium entries (priced types): ${totalPaid}`);
  console.log(`Skipped non-product types:            ${skipped}`);
  console.log(`Stale (verified >${STALE_DAYS}d ago):     ${stale.length}`);
  console.log(`Never verified:                       ${missing.length}`);
  console.log(`Report → ${OUT}`);
}

main();
