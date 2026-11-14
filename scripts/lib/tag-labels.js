// Display labels for tag values on server-built pages (tag titles, "Narrow it down" links).
// The client keeps its own copy in assets/js/filter.js (*_LABELS); tag-labels.test.js fails if
// the two disagree on a value both define. Values without an entry here are humanised.

const LABELS = {
  skill: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
  platform: {
    win: 'Windows', mac: 'macOS', linux: 'Linux', web: 'Web', ios: 'iOS', ipad: 'iPad',
    android: 'Android', cloud: 'Cloud', vr: 'VR'
  },
  workflow: {
    'modeling': 'Modeling', 'sculpting': 'Sculpting', 'retopo': 'Retopo', 'uv': 'UV',
    'texturing': 'Texturing', 'material-authoring': 'Material Authoring',
    'rigging': 'Rigging', 'animation': 'Animation', 'mocap': 'MoCap',
    'simulation': 'Simulation', 'fx': 'FX', 'lighting': 'Lighting',
    'rendering': 'Rendering', 'compositing': 'Compositing',
    'editing': 'Editing', 'audio-design': 'Audio Design'
  },
  output: {
    'games': 'Games', 'film-vfx': 'Film & VFX', 'broadcast': 'Broadcast',
    'archviz': 'ArchViz', 'product-viz': 'Product Viz',
    'motion-graphics': 'Motion Graphics', 'illustration': 'Illustration', 'xr': 'XR',
    'scientific-viz': 'Scientific Viz', 'event-experiential': 'Events & Experiential'
  },
  tech: {
    'cc0': 'CC0', 'pbr': 'PBR', 'usd': 'USD', 'gpu': 'GPU', 'nerf': 'NeRF', 'mcp': 'MCP',
    'glb': 'GLB', 'webgpu': 'WebGPU', 'ai-generative': 'Generative AI'
  }
};

// Word-level fixes for the humanised fallback ("blender-addon" -> "Blender Addon").
const WORDS = { ai: 'AI', xr: 'XR', vr: 'VR', ar: 'AR', ui: 'UI', ux: 'UX', vfx: 'VFX', '2d': '2D', '3d': '3D', api: 'API', cg: 'CG' };

function tagLabel(group, value) {
  const v = String(value);
  const known = LABELS[group] && LABELS[group][v];
  if (known) return known;
  return v.split('-').map(w => WORDS[w] || (w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
}

module.exports = { LABELS, tagLabel };
