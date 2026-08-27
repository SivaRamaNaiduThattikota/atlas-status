const fs = require('fs');
const path = require('path');

function calcDir(dir) {
  const files = fs.readdirSync(dir).filter(f => f.startsWith('agent-') && f.endsWith('.jsonl'));
  const toolIds = new Set();
  let minTs = Infinity, maxTs = -Infinity;
  let inp = 0, out = 0, cw = 0, cr = 0;
  for (const f of files) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      let o;
      try { o = JSON.parse(line); } catch (e) { continue; }
      if (o.timestamp) {
        const t = Date.parse(o.timestamp);
        if (t < minTs) minTs = t;
        if (t > maxTs) maxTs = t;
      }
      if (o.message && o.message.role === 'assistant' && o.message.usage) {
        const u = o.message.usage;
        inp += u.input_tokens || 0;
        out += u.output_tokens || 0;
        cw += u.cache_creation_input_tokens || 0;
        cr += u.cache_read_input_tokens || 0;
      }
      if (o.message && Array.isArray(o.message.content)) {
        for (const c of o.message.content) {
          if (c.type === 'tool_use' && c.id) toolIds.add(c.id);
        }
      }
    }
  }
  const totalTokens = inp + out + cw + cr;
  const cost = inp * 3 / 1e6 + out * 15 / 1e6 + cw * 3.75 / 1e6 + cr * 0.30 / 1e6;
  return {
    dir: path.basename(dir),
    agentFiles: files.length,
    totalTokens,
    toolUses: toolIds.size,
    durationMs: (maxTs > minTs) ? (maxTs - minTs) : 0,
    cost: Math.round(cost * 100) / 100,
    breakdown: { inp, out, cw, cr },
  };
}

const targets = process.argv.slice(2);
for (const t of targets) {
  console.log(JSON.stringify(calcDir(t)));
}
