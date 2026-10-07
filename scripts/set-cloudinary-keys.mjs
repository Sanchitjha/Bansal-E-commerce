/**
 * Saves your Cloudinary keys so you never have to edit .env.local by hand.
 *
 *   node scripts/set-cloudinary-keys.mjs
 *
 * It asks for the Cloud name, API key and API secret (the secret is hidden while you type), then
 *   1. checks them with Cloudinary,
 *   2. writes CLOUDINARY_URL into .env.local,
 *   3. saves the same value as CLOUDINARY_URL on Vercel (production).
 * The secret is never printed.
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const ENV_FILE = '.env.local';

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    if (!stdin.isTTY) return resolve('');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          return resolve(value.trim());
        }
        if (ch === '\u0003') process.exit(1); // Ctrl+C
        if (ch === '\u007f' || ch === '\b') {
          if (value) {
            value = value.slice(0, -1);
            if (!hidden) process.stdout.write('\b \b');
          }
        } else {
          value += ch;
          if (!hidden) process.stdout.write(ch);
        }
      }
    };
    stdin.on('data', onData);
  });
}

let cloudName = await ask('Cloud name: ');
let apiKey = '';
let apiSecret = '';

// Also accept the whole "cloudinary://KEY:SECRET@CLOUD" value pasted at the first question.
const whole = /^(?:CLOUDINARY_URL=)?cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(cloudName);
if (whole) {
  [, apiKey, apiSecret, cloudName] = whole;
} else {
  apiKey = await ask('API key: ');
  apiSecret = await ask('API secret (typing is hidden): ', { hidden: true });
}

if (!cloudName || !apiKey || !apiSecret || /[<>\s]/.test(cloudName + apiKey + apiSecret)) {
  console.error('Cloud name, API key and API secret are all needed (no spaces or < > signs). Run the command again.');
  process.exit(1);
}

const redact = (text) => String(text).split(apiSecret).join('***');

try {
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/ping`, {
    headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}` },
  });
  if (res.status === 401 || res.status === 403) throw new Error('Cloudinary rejected the API key or secret.');
  if (!res.ok) throw new Error(`Cloudinary answered ${res.status}. Check the Cloud name.`);
  console.log('1/3  Cloudinary accepted these keys');
} catch (err) {
  console.error('1/3  Could not verify the keys:', redact(err.message));
  process.exit(1);
}

const url = `cloudinary://${apiKey}:${apiSecret}@${cloudName}`;
const env = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
const kept = env.split(/\r?\n/).filter((line) => !/^CLOUDINARY_/.test(line));
while (kept.length && kept[kept.length - 1] === '') kept.pop();
fs.writeFileSync(ENV_FILE, `${kept.join('\n')}\nCLOUDINARY_URL=${url}\n`);
console.log(`2/3  Saved CLOUDINARY_URL in ${ENV_FILE}`);

const add = (extra) =>
  spawnSync('npx', ['vercel', 'env', 'add', 'CLOUDINARY_URL', 'production', '--force', ...extra], {
    input: url,
    encoding: 'utf8',
    shell: true,
  });
let result = add(['--sensitive']);
const firstTry = redact(`${result.stderr || ''}${result.stdout || ''}`).trim();
if (result.status !== 0) result = add([]);
if (result.status !== 0) {
  console.error('3/3  Could not save it on Vercel. Vercel said:');
  console.error(redact(`${result.stderr || ''}${result.stdout || ''}`).trim() || '(no message)');
  if (firstTry) console.error('\nFirst attempt said:\n' + firstTry);
  console.error('\nIf it asks you to log in, run "npx vercel login" first, then run this script again.');
  process.exit(1);
}
console.log('3/3  Saved CLOUDINARY_URL on Vercel (production)');
console.log('\nDone. Tell Claude "ho gaya".');
