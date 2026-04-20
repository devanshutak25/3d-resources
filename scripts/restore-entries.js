#!/usr/bin/env node
const fs=require('fs'),path=require('path'),yaml=require('js-yaml');
const DATA=path.join(__dirname,'..','data');

const entries = [
  { file:'01-assets.yml', sub:'textures-free-pbr', entry:{
    name:'Texturify', url:'https://texturify.com/',
    description:'Free texture collection.', license:'Free', entry_type:'asset-source',
    readme_tags:['Free','Varied'],
    tags:{ workflow:['texturing','material-authoring'], platform:['web'] }
  }},
  { file:'02-modeling.yml', sub:'blender-plugins-addons', entry:{
    name:'Blender Secrets by Jan van den Hemel', url:'https://www.blendersecrets.org/book',
    description:'Blender tips book by Jan van den Hemel.', entry_type:'tutorial',
    tags:{ tech:['blender','blender-addon'], platform:['web'] }
  }},
  { file:'02-modeling.yml', sub:'houdini-vex-coding', entry:{
    name:'Python Startup Scripts', url:'https://houdinitricks.com/python-houdini-start-scripts-part-1/',
    description:'Python startup scripts guide.', entry_type:'tutorial',
    readme_tags:['Python','Startup Scripts'],
    tags:{ platform:['web'] }
  }},
  { file:'08-art-design.yml', sub:'composition-visual-storytelling', entry:{
    name:'Neil Blevins Art Lessons', url:'http://www.neilblevins.com/',
    description:'Composition types, tangents, visual hierarchy by a Pixar artist.', entry_type:'reference',
    readme_tags:['Pixar Artist','Composition'],
    tags:{ workflow:['concept','reference'], platform:['web'] }
  }},
  { file:'09-ai-ml.yml', sub:'texture-material-generation', entry:{
    name:'InstaMAT', url:'https://instamaterial.com/',
    description:'Material authoring with AI workflows (Substance alternative).', license:'Paid',
    entry_type:'software', best_for:'AI-assisted material authoring',
    tags:{ workflow:['material-authoring','texturing'], tech:['ai-generative'] },
    readme_tags:['Substance-alt','AI Workflows']
  }},
  { file:'10-tools-pipeline.yml', sub:'conversion-tools', entry:{
    name:'Needle USD Converter', url:'https://usd.needle.tools/',
    description:'Web-based USD/USDZ viewer and converter.', entry_type:'tool',
    tags:{ tech:['usd'], platform:['web'] },
    readme_tags:['USD/USDZ','Web']
  }},
  { file:'11-learning-community.yml', sub:'paid-tutorial-platforms', entry:{
    name:'Domestika', url:'https://www.domestika.org/',
    description:'Creative arts courses.', license:'Paid', entry_type:'tutorial',
    readme_tags:['Creative Arts','Per-course'],
    tags:{ platform:['web'] }
  }},
  { file:'12-software-reference.yml', sub:'2d-animation-software', entry:{
    name:'Moho (Smith Micro)', url:'https://moho.lostmarble.com/',
    description:'2D vector and bone-rigged animation.', license:'Paid',
    entry_type:'software', best_for:'Character animation, motion graphics',
    tags:{ workflow:['animation','rigging'], output:['broadcast','motion-graphics'], platform:['win','mac'] },
    readme_tags:['Bone Rigging','Vector Animation']
  }}
];

let added=0;
const seen={};
for(const {file,sub,entry} of entries){
  const p=path.join(DATA,file);
  const d=yaml.load(fs.readFileSync(p,'utf8'));
  const s=(d.subsections||[]).find(x=>x.slug===sub);
  if(!s){ console.error('no sub',file,sub); continue; }
  s.entries=s.entries||[];
  s.entries.push(entry);
  seen[file]=d;
  added++;
}
for(const [file,d] of Object.entries(seen)){
  fs.writeFileSync(path.join(DATA,file),yaml.dump(d,{lineWidth:-1,noRefs:true}));
}
console.log('restored',added);
