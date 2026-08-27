const fs = require('fs');
const path = require('path');

function calcDir(dir) {
  const files = fs.readdirSync(dir).filter(f => f.startsWith('agent-') && f.endsWith('.jsonl'));
  const msgUsage = new Map(); // message.id -> usage
  const toolIds = new Set();
  let minTs = Infinity, maxTs = -Infinity;
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
      if (o.message && o.message.role === 'assistant' && o.message.usage && o.message.id) {
        msgUsage.set(o.message.id, o.message.usage);
      }
      if (o.message && Array.isArray(o.message.content)) {
        for (const c of o.message.content) {
          if (c.type === 'tool_use' && c.id) toolIds.add(c.id);
        }
      }
    }
  }
  let totalTokens = 0;
  for (const u of msgUsage.values()) {
    totalTokens += (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  }
  return {
    dir,
    agentFiles: files.length,
    uniqueMessages: msgUsage.size,
    totalTokens,
    toolUses: toolIds.size,
    durationMs: (maxTs > minTs) ? (maxTs - minTs) : 0,
    minTs: isFinite(minTs) ? new Date(minTs).toISOString() : null,
    maxTs: isFinite(maxTs) ? new Date(maxTs).toISOString() : null,
  };
}

const targets = process.argv.slice(2);
for (const t of targets) {
  console.log(JSON.stringify(calcDir(t)));
}
