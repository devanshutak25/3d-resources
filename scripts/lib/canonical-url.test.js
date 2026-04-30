// Table-driven tests for canonicalUrl. Run: node scripts/lib/canonical-url.test.js

const assert = require('assert');
const { canonicalUrl } = require('./canonical-url');

const cases = [
  ['force https',                    'http://example.com/x',                                    'https://example.com/x'],
  ['strip www',                      'https://www.example.com/x',                               'https://example.com/x'],
  ['strip www + force https',        'http://www.example.com/x',                                'https://example.com/x'],
  ['drop hash',                      'https://example.com/x#frag',                              'https://example.com/x'],
  ['drop utm_source',                'https://example.com/x?utm_source=tw',                     'https://example.com/x'],
  ['drop all tracking params',       'https://example.com/x?utm_source=a&utm_medium=b&utm_campaign=c&utm_term=d&utm_content=e&ref=f&source=g&fbclid=h&gclid=i',
                                                                                                'https://example.com/x'],
  ['keep non-tracking params',       'https://example.com/x?id=42&utm_source=tw',               'https://example.com/x?id=42'],
  ['lowercase host',                 'https://Example.COM/Path',                                'https://example.com/Path'],
  ['preserve path case',             'https://example.com/Foo/Bar',                             'https://example.com/Foo/Bar'],
  ['trim trailing slash',            'https://example.com/path/',                               'https://example.com/path'],
  ['keep root slash',                'https://example.com/',                                    'https://example.com/'],
  ['keep root with no path',         'https://example.com',                                     'https://example.com/'],
  ['hash + tracking + trailing',     'https://www.example.com/Path/?utm_source=x&keep=1#h',     'https://example.com/Path?keep=1'],
  ['empty input',                    '',                                                        ''],
  ['null input',                     null,                                                      ''],
  ['invalid URL passthrough',        'not a url',                                               'not a url'],
];

let pass = 0, fail = 0;
for (const [name, input, expected] of cases) {
  const got = canonicalUrl(input);
  if (got === expected) { console.log(`  ok  ${name}`); pass++; }
  else { console.error(`  FAIL ${name}\n    input:    ${input}\n    expected: ${expected}\n    got:      ${got}`); fail++; }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
