const fs = require('fs');
const path = require('path');
const base = 'C:/Users/THATTSR/.claude/projects/c--Users-THATTSR-Downloads-VSCode/db7128be-3fe0-4558-b63d-be0c6f6978b5/subagents/workflows';
const dirs = fs.readdirSync(base).filter(d => d.startsWith('wf_'));
for (const d of dirs) {
  const jpath = path.join(base, d, 'journal.jsonl');
  if (!fs.existsSync(jpath)) continue;
  const lines = fs.readFileSync(jpath, 'utf8').split('\n').filter(Boolean);
  const concepts = new Set();
  let hadResult = false;
  for (const line of lines) {
    let obj;
    try { obj = JSON.parse(line); } catch (e) { continue; }
    if (obj.type === 'result' && obj.result && obj.result.concept) {
      hadResult = true;
      // take first ~140 chars of concept field
      concepts.add(obj.result.concept.slice(0, 140));
    }
  }
  if (concepts.size) {
    console.log('=== ' + d + ' ===');
    for (const c of concepts) console.log('  ' + c);
  }
}
