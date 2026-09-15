// Regression checks for the September 2026 repository review.
// Run directly: node scripts/lib/review-regressions.test.js
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');
const root = path.resolve(__dirname, '../..');
let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); console.log('ok ' + name); passed++; }
  catch (e) { console.error('FAIL ' + name + ': ' + e.message); failed++; }
}
function script(file, overrides = {}, strip = /main\(\);\s*$/) {
  const filename = path.join(root, file);
  const nativeRequire = createRequire(filename);
  const context = { console, URL, AbortController, setTimeout, clearTimeout,
    __dirname: path.dirname(filename), process: { argv: [] },
    require: id => Object.hasOwn(overrides, id) ? overrides[id] : nativeRequire(id) };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filename, 'utf8').replace(strip, ''), context);
  return context;
}
const activeEntry = { name: 'Studio library', url: 'https://example.test/studio', description: 'Backplates for cars.', tags: {tech:['pbr']} };
const retiredEntry = { ...activeEntry, name:'Retired',url:'https://example.test/retired',deprecated:true };
const fakeCatalog = {
  loadSections: () => ({sections:[{file:'01-assets.yml',slug:'assets-libraries'}]}),
  loadSection: () => ({slug:'assets-libraries',title:'Assets & Libraries'}),
  *iterEntries() { for(const entry of [activeEntry,retiredEntry]) yield {sectionFile:'01-assets.yml',subSlug:'hdris',entry}; }
};
function exportFixture() {
  let output;
  const ctx = script('scripts/export-data.js', {'./lib/catalog':fakeCatalog,fs:{mkdirSync(){},writeFileSync(_,s){output=JSON.parse(s)}}});
  ctx.process.argv=['node','export','out.json'];ctx.main();return output;
}
(async()=>{
  await test('export preserves descriptions for full text search',()=>assert.equal(exportFixture().entries[0].description,activeEntry.description));
  await test('export excludes editorially deprecated resources',()=>assert.equal(exportFixture().entries.length,1));
  await test('export provides heading anchors for row category matching',()=>assert.equal(exportFixture().sections[0].anchor,'assets--libraries'));
  await test('graph links use the HTML heading convention',()=>{
    const g=script('scripts/build-graph.js');
    assert.equal(g.ghAnchor('Assets & Libraries'),'assets--libraries');
    assert.equal(g.ghAnchor('Lighting, Rendering & Shaders'),'lighting-rendering--shaders');
  });
  await test('mirrored rows keep the category of their displayed section',()=>{
    const src=fs.readFileSync(path.join(root,'assets/js/filter.js'),'utf8').replace(/\}\)\(\);\s*$/,'globalThis.probe={decorate,matches,active,setMain(x){mainEl=x},items(){return itemIndex}};})();');
    const ctx={URL,console,document:{readyState:'loading',addEventListener(){},getElementById(){return null},createElement(){return {setAttribute(){},addEventListener(){}}}}};
    vm.runInNewContext(src,ctx);
    const main={querySelectorAll(q){return q==='a[href]'?anchors:[]}};
    const primaryHeading={tagName:'H2',id:'assets--libraries',parentElement:main,previousElementSibling:null};
    const mirrorHeading={tagName:'H2',id:'animation--rigging',parentElement:main,previousElementSibling:primaryHeading};
    function row(heading) {return {tagName:'LI',dataset:{},setAttribute(){},insertBefore(){},parentElement:{tagName:'UL',parentElement:main,previousElementSibling:heading}}}
    const rows=[row(primaryHeading),row(mirrorHeading)];
    const anchors=rows.map(r=>({getAttribute(){return activeEntry.url},parentElement:r}));
    ctx.probe.setMain(main);
    ctx.probe.decorate({sections:[{slug:'assets-libraries',anchor:primaryHeading.id},{slug:'animation-rigging',anchor:mirrorHeading.id}],entries:[{...activeEntry,section:'assets-libraries'},{...activeEntry,section:'animation-rigging'}]});
    ctx.probe.active.category.add('assets-libraries');
    assert.equal(ctx.probe.matches(ctx.probe.items()[0]),true);
    assert.equal(ctx.probe.matches(ctx.probe.items()[1]),false);
  });
  const link=script('scripts/check-links.js',{},/main\(\)\.catch[\s\S]*$/);
  await test('HTTP 503 is transient, not broken',async()=>{
    link.fetch=async()=>({ok:false,status:503,url:'https://example.test/'});
    assert.equal((await link.check('https://example.test/')).status,'unreachable');
  });
  await test('successful followed redirects appear in reports',async()=>{
    link.fetch=async()=>({ok:true,status:200,redirected:true,url:'https://example.test/new'});
    assert.equal((await link.check('https://example.test/old')).status,'redirect');
  });
  await test('HTTP 404 remains broken',async()=>{
    link.fetch=async()=>({ok:false,status:404,url:'https://example.test/'});
    assert.equal((await link.check('https://example.test/')).status,'broken');
  });
  await test('link scans preserve editorial visibility and deprecation',async()=>{
    const entries=[{name:'Temporary',url:'https://example.test/temporary'},{name:'Retired',url:'https://example.test/retired',deprecated:true}];
    const cat={loadSections:()=>({sections:[]}),*iterEntries(){for(const entry of entries)yield {entry,chunk:{_path:'chunk'},sectionFile:'test',subSlug:'test'}},saveChunk(){}};
    const scan=script('scripts/check-links.js',{'./lib/catalog':cat,fs:{mkdirSync(){},writeFileSync(){}}},/main\(\)\.catch[\s\S]*$/);
    scan.fetch=async url=>({ok:url.endsWith('retired'),status:url.endsWith('retired')?200:404,url});
    await scan.main();
    assert.equal(entries[0].deprecated,undefined);
    assert.equal(entries[0].url_status,'broken');
    assert.equal(entries[1].deprecated,true);
  });
  const newer={name:'New assets',url:'https://example.test/new',added_at:'2026-09-15T00:00:00Z'};
  const older={name:'Old software',url:'https://example.test/old',added_at:'2026-01-01T00:00:00Z'};
  const feed=script('scripts/build-feed.js',{'./lib/catalog':{*iterChunks(){yield {id:'01-assets/hdris/01',entries:[newer]};yield {id:'12-software/apps/01',entries:[older]}}}});
  await test('feed sorts globally by addition date, not category',()=>assert.equal(feed.collectEntries()[0].entry.name,newer.name));
  await test('feed entries keep stable publication timestamps',()=>{
    const xml=feed.buildFeed([{entry:newer,chunkId:'01-assets/hdris/01'}],'2026-09-16T00:00:00Z');
    assert.ok(xml.includes('<published>2026-09-15T00:00:00Z</published>'));
    assert.ok(xml.includes('<updated>2026-09-15T00:00:00Z</updated>'));
  });
  await test('catalog append stamps new entries and preserves dates on moves',()=>{
    const os = require('os');
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-dates-'));
    try {
      fs.mkdirSync(path.join(fixture, 'data'), {recursive:true});
      fs.writeFileSync(path.join(fixture, 'data/sections.yml'), 'sections:\n  - slug: test\n    file: 01-test.yml\n');
      const ctx = {require:createRequire(path.join(root,'scripts/lib/catalog.js')),module:{exports:{}},__dirname:path.join(fixture,'scripts/lib')};
      vm.runInNewContext(fs.readFileSync(path.join(root,'scripts/lib/catalog.js'),'utf8'),ctx);
      const before=Date.now();
      const result=ctx.module.exports.appendEntry('test','sub',activeEntry);
      assert.ok(Date.parse(result.entries[0].added_at)>=before);
      const oldDate='2020-01-01T00:00:00Z';
      const moved=ctx.module.exports.appendEntry('test','sub',{...activeEntry,added_at:oldDate});
      assert.equal(moved.entries[1].added_at,oldDate);
      assert.equal(activeEntry.added_at,undefined);
    } finally {
      const resolved=path.resolve(fixture);
      assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep));
      assert.ok(path.basename(resolved).startsWith('catalog-dates-'));
      fs.rmSync(resolved,{recursive:true,force:true});
    }
  });
  console.log(`${passed} passed, ${failed} failed`);if(failed)process.exitCode=1;
})();
