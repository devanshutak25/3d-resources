// One-shot humanize: em-dash removal + drop AI tells on YAML value lines.
const fs = require('fs'), path = require('path');

function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.yml')) out.push(p);
  }
}

function humanize(v, key) {
  let s = v;
  // Em-dash replacement strategy:
  //   - title fields: use ': ' (subsection naming convention)
  //   - all other fields: use '. ' (period) + capitalize next word (YAML-safe)
  if (key === 'title') {
    s = s.replace(/ — /g, ': ');
  } else {
    s = s.replace(/ — (.)/g, (_, c) => '. ' + c.toUpperCase());
  }
  s = s.replace(/,? and (so much )?more(\.?)/gi, '$2');
  s = s.replace(/ and beyond\b/gi, '');
  s = s.replace(/\bleverages\b/g, 'uses').replace(/\bleveraged\b/g, 'used').replace(/\bleverage\b/g, 'use');
  s = s.replace(/\bLeverages\b/g, 'Uses').replace(/\bLeveraged\b/g, 'Used').replace(/\bLeverage\b/g, 'Use');
  s = s.replace(/\butilizes\b/g, 'uses').replace(/\butilized\b/g, 'used').replace(/\butilizing\b/g, 'using').replace(/\butilize\b/g, 'use');
  s = s.replace(/\bUtilizes\b/g, 'Uses').replace(/\bUtilized\b/g, 'Used').replace(/\bUtilizing\b/g, 'Using').replace(/\bUtilize\b/g, 'Use');
  s = s.replace(/\bcomprehensive\s+/gi, '');
  s = s.replace(/\bpowerful\s+/gi, '');
  s = s.replace(/\brobust\s+/gi, '');
  s = s.replace(/\bseamlessly\s+/gi, '');
  s = s.replace(/\bseamless\s+/gi, '');
  s = s.replace(/\bcutting.edge\s+/gi, '');
  s = s.replace(/\bstate.of.the.art\s+/gi, '');
  s = s.replace(/\bthe ultimate\s+/gi, '');
  s = s.replace(/  +/g, ' ');
  s = s.replace(/\.\./g, '.');
  s = s.replace(/ \./g, '.');
  return s;
}

const files = [];
walk('G:/Personal/3d_resources/data', files);
const KEYS = /^(name|description|title|best_for|notes|tagline|summary|short_description)$/;
let touched = 0, totalLines = 0;
for (const f of files) {
  const orig = fs.readFileSync(f, 'utf8');
  const eol = orig.includes('\r\n') ? '\r\n' : '\n';
  const lines = orig.split(/\r?\n/);
  let mod = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(/^(\s*-?\s*)([A-Za-z_]+):(\s+)(.*)$/);
    if (!m) continue;
    const prefix = m[1], key = m[2], sp = m[3], val = m[4];
    if (!KEYS.test(key)) continue;
    if (val === '|' || val === '>') continue;
    if (/^https?:\/\/\S+$/.test(val)) continue;
    let newVal = humanize(val, key);
    if (newVal !== val) {
      // YAML safety: if the new value contains ': ' (or other YAML-ambiguous patterns)
      // and is not already quoted, wrap in double quotes.
      const alreadyQuoted = /^['"].*['"]$/.test(newVal);
      const needsQuote = !alreadyQuoted && /: /.test(newVal);
      if (needsQuote) {
        newVal = '"' + newVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
      }
      lines[i] = prefix + key + ':' + sp + newVal;
      mod = true;
      totalLines++;
    }
  }
  if (mod) {
    fs.writeFileSync(f, lines.join(eol));
    touched++;
  }
}
console.log('files touched:', touched, 'lines changed:', totalLines);
