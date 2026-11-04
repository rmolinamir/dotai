import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const canonical = realpathSync('skills');
assert.equal(canonical, path.join(root, 'skills'), 'skills must stay inside the checkout');
for (const dir of ['.agents/skills', '.claude/skills']) {
  assert.equal(realpathSync(dir), canonical, `${dir} must resolve to skills/`);
}

// Same content-hash format as the pinned Skills CLI project lockfile.
function contentHash(base) {
  const files = [];
  function collect(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !['.git', 'node_modules'].includes(entry.name)) collect(full);
      else if (entry.isFile()) files.push([path.relative(base, full).split(path.sep).join('/'), readFileSync(full)]);
    }
  }
  collect(base);
  files.sort(([a], [b]) => a.localeCompare(b));
  const hash = createHash('sha256');
  for (const [name, content] of files) hash.update(name).update(content);
  return hash.digest('hex');
}

const lock = JSON.parse(readFileSync('skills-lock.json', 'utf8'));
assert.equal(lock.version, 1);
for (const [name, entry] of Object.entries(lock.skills)) {
  assert.match(name, /^[a-z0-9-]+$/);
  assert.equal(entry.sourceType, 'github', `${name}: expected a portable GitHub source`);
  assert.equal(contentHash(path.join(canonical, name)), entry.computedHash, `${name}: installed files differ from skills-lock.json; update with skills.sh`);
  if (name.startsWith('gitops-')) assert.equal(entry.source, 'fluxcd/agent-skills', `${name}: expected the official Flux source`);
}
for (const name of readdirSync('skills')) {
  assert.ok(existsSync(path.join(canonical, name, 'SKILL.md')), `${name}: missing SKILL.md`);
  for (const base of ['.codex/skills', '.config/opencode/skills']) {
    if (!existsSync(base)) continue;
    const target = path.join(base, name);
    if (existsSync(target)) assert.equal(realpathSync(target), path.join(canonical, name), `${target}: external skill target`);
  }
}
console.log(`Validated ${Object.keys(lock.skills).length} locked skills and repository-local agent paths.`);
