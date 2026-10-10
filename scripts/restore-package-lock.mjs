import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const dir = '.lock-shards';
const parts = readdirSync(dir).filter((f) => /^\d{2}$/.test(f)).sort();
const content = parts.map((f) => readFileSync(`${dir}/${f}`, 'utf8')).join('');
writeFileSync('package-lock.json', content);
console.log('Restored package-lock.json', content.length, 'bytes');
