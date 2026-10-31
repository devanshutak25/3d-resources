// Studios directory helpers: display labels, country -> region, card slugs.
// Discipline keys must match the enum in schema/studio.schema.json (studios.test.js checks).

const { slugify } = require('./slugify');

// Order = chip order, grouped by family so each family shares a hue (colors: style.css .d-*).
const DISCIPLINES = {
  '2d-animation': '2D animation',
  '3d-animation': '3D animation',
  'stop-motion': 'Stop motion',
  'motion-design': 'Motion design',
  'title-design': 'Title design',
  'vfx': 'VFX',
  'previs': 'Previs',
  'virtual-production': 'Virtual production',
  'live-action': 'Live action',
  'cg': 'CG / 3D',
  'product-viz': 'Product viz',
  'archviz': 'Arch viz',
  'games': 'Games',
  'cinematics': 'Game cinematics',
  'outsourcing': 'Outsourcing',
  'mocap': 'Mocap',
  'xr': 'XR / interactive',
  'experiential': 'Experiential'
};

// Who the work is for ("Works for" on cards). Keys match schema markets enum.
const MARKETS = {
  'film': 'Film',
  'episodic': 'Episodic',
  'advertising': 'Advertising',
  'music-video': 'Music video',
  'games': 'Games',
  'brand': 'Brand'
};

// Headcount buckets match LinkedIn "Company size" ranges, largest first (group order).
const SIZES = { large: '201+ people', mid: '51-200 people', small: '11-50 people', boutique: '1-10 people' };

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

  'Cameroon': 'middle-east-africa', 'Egypt': 'middle-east-africa', 'Ghana': 'middle-east-africa', 'Iran': 'middle-east-africa',
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

// Founding decade bucket for "group by age": 'pre-1980', '1980s'... or '' when unknown.
function decadeOf(founded) {
  if (!founded) return '';
  return founded < 1980 ? 'pre-1980' : `${Math.floor(founded / 10) * 10}s`;
}

function placeLabel(p) {
  if (!p) return '';
  return p.city ? `${p.city}, ${p.country}` : p.country;
}

module.exports = { DISCIPLINES, MARKETS, SIZES, decadeOf, REGIONS, COUNTRY_REGION, regionOf, studioSlugs, placeLabel };
