// Studios directory helpers: display labels, country -> region, card slugs.
// Discipline keys must match the enum in schema/studio.schema.json (studios.test.js checks).

const { slugify } = require('./slugify');

const DISCIPLINES = {
  'animation': 'Animation',
  'stop-motion': 'Stop motion',
  'vfx': 'VFX',
  'motion-design': 'Motion design',
  'cg': 'CG / 3D',
  'archviz': 'Arch viz',
  'product-viz': 'Product viz',
  'games': 'Games',
  'cinematics': 'Game cinematics',
  'virtual-production': 'Virtual production',
  'previs': 'Previs',
  'xr': 'XR / interactive',
  'experiential': 'Experiential',
  'title-design': 'Title design',
  'live-action': 'Live action',
  'outsourcing': 'Outsourcing',
  'mocap': 'Mocap'
};

const SIZES = { boutique: 'Boutique', mid: 'Mid-size', large: 'Large' };

const REGIONS = {
  'americas': 'Americas',
  'europe': 'Europe',
  'asia-pacific': 'Asia-Pacific',
  'middle-east-africa': 'Middle East & Africa'
};

// Closed list so the country filter never splits "UK" / "United Kingdom".
// Add a country here when a studio needs it.
const COUNTRY_REGION = {
  'Argentina': 'americas', 'Brazil': 'americas', 'Canada': 'americas', 'Chile': 'americas',
  'Colombia': 'americas', 'Costa Rica': 'americas', 'Ecuador': 'americas', 'Mexico': 'americas',
  'Peru': 'americas', 'Puerto Rico': 'americas', 'United States': 'americas', 'Uruguay': 'americas',
  'Venezuela': 'americas',

  'Armenia': 'europe', 'Austria': 'europe', 'Belarus': 'europe', 'Belgium': 'europe',
  'Bosnia and Herzegovina': 'europe', 'Bulgaria': 'europe', 'Croatia': 'europe', 'Cyprus': 'europe',
  'Czech Republic': 'europe', 'Denmark': 'europe', 'Estonia': 'europe', 'Finland': 'europe',
  'France': 'europe', 'Georgia': 'europe', 'Germany': 'europe', 'Greece': 'europe',
  'Hungary': 'europe', 'Iceland': 'europe', 'Ireland': 'europe', 'Italy': 'europe',
  'Kosovo': 'europe', 'Latvia': 'europe', 'Lithuania': 'europe', 'Luxembourg': 'europe',
  'Malta': 'europe', 'Moldova': 'europe', 'Montenegro': 'europe', 'Netherlands': 'europe',
  'North Macedonia': 'europe', 'Norway': 'europe', 'Poland': 'europe', 'Portugal': 'europe',
  'Romania': 'europe', 'Serbia': 'europe', 'Slovakia': 'europe', 'Slovenia': 'europe',
  'Spain': 'europe', 'Sweden': 'europe', 'Switzerland': 'europe', 'Turkey': 'europe',
  'Ukraine': 'europe', 'United Kingdom': 'europe',

  'Australia': 'asia-pacific', 'Bangladesh': 'asia-pacific', 'China': 'asia-pacific',
  'Hong Kong': 'asia-pacific', 'India': 'asia-pacific', 'Indonesia': 'asia-pacific',
  'Japan': 'asia-pacific', 'Malaysia': 'asia-pacific', 'Nepal': 'asia-pacific',
  'New Zealand': 'asia-pacific', 'Pakistan': 'asia-pacific', 'Philippines': 'asia-pacific',
  'Singapore': 'asia-pacific', 'South Korea': 'asia-pacific', 'Sri Lanka': 'asia-pacific',
  'Taiwan': 'asia-pacific', 'Thailand': 'asia-pacific', 'Vietnam': 'asia-pacific',

  'Egypt': 'middle-east-africa', 'Ghana': 'middle-east-africa', 'Iran': 'middle-east-africa',
  'Israel': 'middle-east-africa', 'Jordan': 'middle-east-africa', 'Kenya': 'middle-east-africa',
  'Lebanon': 'middle-east-africa', 'Morocco': 'middle-east-africa', 'Nigeria': 'middle-east-africa',
  'Qatar': 'middle-east-africa', 'Saudi Arabia': 'middle-east-africa',
  'South Africa': 'middle-east-africa', 'Tunisia': 'middle-east-africa',
  'United Arab Emirates': 'middle-east-africa'
};

function regionOf(country) {
  return COUNTRY_REGION[country] || null;
}

// Stable, unique card ids ("s-framestore", "s-storm-2") in list order.
function studioSlugs(studios) {
  const used = new Map();
  return studios.map(s => {
    const base = 's-' + (slugify(s.name).replace(/_/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'studio');
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}

function placeLabel(p) {
  if (!p) return '';
  return p.city ? `${p.city}, ${p.country}` : p.country;
}

module.exports = { DISCIPLINES, SIZES, REGIONS, COUNTRY_REGION, regionOf, studioSlugs, placeLabel };
