// Adds data-label="<column header>" to every <td> of every table in a rendered
// HTML fragment. Narrow screens stack table rows into cards (style.css) and
// use these labels so a cell like "Paid" still says which column it came from.
// Pure string transform, no DOM; safe on the marked output both page builders use.

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function labelTableCells(html) {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, (table, inner) => {
    const headMatch = inner.match(/<thead>[\s\S]*?<\/thead>/);
    if (!headMatch) return table;
    const headers = [];
    const thRe = /<th[^>]*>([\s\S]*?)<\/th>/g;
    let m;
    while ((m = thRe.exec(headMatch[0]))) headers.push(stripTags(m[1]));
    if (!headers.length) return table;
    const labelled = inner.replace(/<tr>([\s\S]*?)<\/tr>/g, (row, cells) => {
      if (!/<td/.test(cells)) return row;
      let i = 0;
      const out = cells.replace(/<td([^>]*)>/g, (td, attrs) => {
        const label = headers[i++] || '';
        if (!label || /data-label=/.test(attrs)) return td;
        return `<td${attrs} data-label="${label.replace(/"/g, '&quot;')}">`;
      });
      return `<tr>${out}</tr>`;
    });
    return `<table>${labelled}</table>`;
  });
}

module.exports = { labelTableCells };
