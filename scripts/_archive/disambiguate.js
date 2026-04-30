#!/usr/bin/env node
// Disambiguate name collisions: drop true dupes, rename distinct products, suffix cross-format listings.
const fs = require('fs'), path = require('path'), yaml = require('js-yaml');
const DATA = path.join(__dirname,'..','data');
const files = fs.readdirSync(DATA).filter(f => /^\d+-.*\.yml$/.test(f));
const docs = {};
for(const f of files) docs[f] = yaml.load(fs.readFileSync(path.join(DATA,f),'utf8'));

// DROP list: exact URLs to remove (redundant same-product)
const DROP_URLS = new Set([
  'https://github.com/xavier150/Blender-For-UnrealEngine-Addons/wiki',
  'https://github.com/ssloy/tinyrenderer/wiki',
  'https://unity3d.com/services/ads',
  'https://classroom.udacity.com/courses/cs291',
  'https://www.gafferhq.org/',               // GafferHQ/gaffer github covers it; keep github
  'http://cocos2d-x.org/docs/editors_and_tools/creator/index.html',
  'https://github.com/RodZill4/material-maker',
  'https://rodzilla.itch.io/material-maker',
  'https://deepnight.net/tools/ldtk-2d-level-editor/',
  'http://www.ogmoeditor.com/',
]);

// RENAME list: url -> new name (distinct products w/ same name)
const RENAME = {
  'https://github.com/Unity-Technologies/UnityOctree':        'UnityOctree (Unity-Technologies)',
  'https://github.com/Nition/UnityOctree':                     'UnityOctree (Nition)',
  'https://github.com/UnityPatterns/Signals':                  'Signals (UnityPatterns)',
  'https://github.com/yankooliveira/signals':                  'Signals (yankooliveira)',
  'https://github.com/EllanJiang/GameFramework':               'GameFramework (EllanJiang)',
  'https://github.com/FlipWebApps/GameFramework':              'GameFramework (FlipWebApps)',
  'https://github.com/proyecto26/RestClient':                  'RestClient (proyecto26)',
  'https://github.com/Unity3dAzure/RESTClient':                'RestClient (Unity3dAzure)',
  'https://github.com/Whinarn/UnityMeshSimplifier':            'Unity Mesh Simplifier (Whinarn)',
  'https://github.com/Unity-Technologies/UnityMeshSimplifier': 'Unity Mesh Simplifier (Unity-Technologies)',
  'https://github.com/mmp/pbrt-v4/':                           'PBRT v4',
  'https://github.com/mmp/pbrt-v3':                            'PBRT v3',
  'https://github.com/gregzaal/Gaffer':                        'Gaffer (Blender addon)',
  'https://github.com/GafferHQ/gaffer':                        'Gaffer (GafferHQ compositing)',
  'https://github.com/graphdeco-inria/gaussian-splatting':     '3D Gaussian Splatting (INRIA reference impl)',
  'https://github.com/WangFeng18/3d-gaussian-splatting':       '3D Gaussian Splatting (WangFeng18 reimpl)',
  'https://github.com/joeyan/gaussian_splatting':              '3D Gaussian Splatting (joeyan reimpl)',
  'http://www.andreas-maschke.com/?page_id=4607':              'Mandelbulb3D (original)',
  'https://github.com/thargor6/mb3d':                          'Mandelbulb3D (thargor6 fork)',
  'https://natron.fr':                                         'Natron (legacy site)',
  'https://natrongithub.github.io/':                           'Natron (community fork)',
  'https://ogmo-editor-3.github.io/':                          'OGMO Editor 3',
  // cross-format suffixes
  'http://www.entagma.com/':                                   'Entagma (site)',
  'https://www.youtube.com/channel/UCWu6SQmC6nAZ-reuj3lF2eQ':  'Entagma (YouTube)',
  'https://www.johnkunz.com/':                                 'John Kunz (site)',
  'https://www.youtube.com/@JohnKunz':                         'John Kunz (YouTube)',
  'https://www.schoolofmotion.com/':                           'School of Motion (site)',
  'https://www.youtube.com/@schoolofmotion':                   'School of Motion (YouTube)',
  'https://greyscalegorilla.com/':                             'Greyscalegorilla (site)',
  'https://www.youtube.com/channel/UC64Z_7asrekIkc5h2v5tnHw':  'Greyscalegorilla (YouTube)',
  'https://flippednormals.com/':                               'FlippedNormals (site)',
  'https://www.youtube.com/@FlippedNormals':                   'FlippedNormals (YouTube)',
  'https://cgshortcuts.com/':                                  'CG Shortcuts (site)',
  'https://www.youtube.com/channel/UCjsFn111Z8R4eKuRpPz4ZuA':  'CG Shortcuts (YouTube)',
  'https://www.mographmentor.com/':                            'MoGraph Mentor (site)',
  'https://www.youtube.com/channel/UC-rH7k9KoAMSHabvWnvxCXg':  'MoGraph Mentor (YouTube)',
  'https://motiondesign.school/':                              'Motion Design School (site)',
  'https://www.youtube.com/channel/UC-L0yvYPpGQZD3PHDLKiUpg':  'Motion Design School (YouTube)',
  'https://darkfallblender.blogspot.com/':                     'Darkfall (blog)',
  'https://www.youtube.com/@DarkfallBlender':                  'Darkfall (YouTube)',
  'https://www.matthewtancik.com/nerf':                        'NeRF (paper site)',
  'https://www.youtube.com/@NeuralRendering':                  'Neural Rendering (YouTube)',
  'https://mirror-networking.com/':                            'Mirror (site)',
  'https://github.com/vis2k/Mirror':                           'Mirror (GitHub)',
  'https://github.com/sideeffects/HoudiniEngineForUnreal':     'Houdini Engine for Unreal',
  'https://www.sidefx.com/products/houdini-engine/':           'Houdini Engine (SideFX product)',
  // same-product multi-url: site vs github suffixes
  'https://www.assimp.org/':                                   'Assimp (site)',
  'https://github.com/assimp/assimp':                          'Assimp (GitHub)',
  'https://upbge.org/':                                        'UPBGE (site)',
  'https://github.com/UPBGE/upbge':                            'UPBGE (GitHub)',
  'https://www.lygia.xyz/':                                    'Lygia (site)',
  'https://github.com/patriciogonzalezvivo/lygia':             'Lygia (GitHub)',
  'https://github.com/patriciogonzalezvivo/glslViewer':        'glslViewer (GitHub)',
  'http://patriciogonzalezvivo.com/2015/glslViewer/':          'glslViewer (write-up)',
  'http://magnum.graphics/':                                   'Magnum (site)',
  'https://github.com/mosra/magnum':                           'Magnum (GitHub)',
  'https://whs.io/':                                           'Whitestorm.js (site)',
  'https://github.com/WhitestormJS/whitestorm.js':             'Whitestorm.js (GitHub)',
  'https://animation-nodes.com/':                              'Animation Nodes (site)',
  'https://github.com/JacquesLucke/animation_nodes':           'Animation Nodes (GitHub)',
  'https://chemikhazi.itch.io/sprytile':                       'Sprytile (itch.io)',
  'https://github.com/Sprytile/Sprytile':                      'Sprytile (GitHub)',
  'https://github.com/Pixen/Pixen':                            'Pixen (GitHub)',
  'https://pixenapp.com/':                                     'Pixen (site)',
  'https://github.com/Ttanasart-pt/Pixel-Composer':            'Pixel Composer (GitHub)',
  'https://makham.itch.io/pixel-composer':                     'Pixel Composer (itch.io)',
  'https://github.com/nkallen/plasticity':                     'Plasticity (GitHub)',
  'https://www.plasticity.xyz/':                               'Plasticity (site)',
  'https://docs.opencue.io/':                                  'OpenCue (docs)',
  'https://opencue.io':                                        'OpenCue (site)',
  'https://github.com/masqu3rad3/tik_manager4':                'Tik Manager (GitHub)',
  'https://tik-manager.com':                                   'Tik Manager (site)',
  'https://flamenco.blender.org/':                             'Flamenco (Blender render farm)',
  'https://www.flamenco.io/':                                  'Flamenco (flamenco.io)',
  'http://opentimeline.io':                                    'OpenTimelineIO (site)',
  'https://github.com/AcademySoftwareFoundation/OpenTimelineIO':'OpenTimelineIO (GitHub)',
  'https://materialx.org/':                                    'MaterialX (site)',
  'https://github.com/materialx/MaterialX':                    'MaterialX (GitHub)',
  'https://www.materialmaker.org/':                            'Material Maker',
  'https://c4dcenter.com/material-library/':                   'C4DCenter Material Library',
  'https://ldtk.io/':                                          'LDtk',
  'https://unity.com/products/unity-ads':                      'Unity Ads',
};

// Apply
let drops = 0, renames = 0;
for(const f of files){
  const d = docs[f];
  (d.subsections||[]).forEach(s => {
    s.entries = (s.entries||[]).filter(e => {
      if(DROP_URLS.has(e.url)){ drops++; return false; }
      return true;
    });
    for(const e of s.entries){
      if(RENAME[e.url] && e.name !== RENAME[e.url]){
        e.name = RENAME[e.url];
        renames++;
      }
    }
  });
}

const mode = process.argv[2] || 'plan';
console.log(`drops: ${drops}  renames: ${renames}`);
if(mode === 'apply'){
  for(const f of files) fs.writeFileSync(path.join(DATA,f), yaml.dump(docs[f],{lineWidth:-1,noRefs:true}));
  console.log('✓ applied');
}else{
  console.log('(pass "apply" to write)');
}
