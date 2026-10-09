/**
 * Saves your Resend API keys so you never have to edit .env.local by hand.
 *
 *   node scripts/set-resend-keys.mjs
 *
 * It asks for the Resend API Key and From Email address, then
 *   1. checks the key with Resend's API,
 *   2. writes RESEND_API_KEY and EMAIL_FROM into .env.local,
 *   3. saves the same values on Vercel (production).
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const ENV_FILE = '.env.local';

function ask(question, { hidden = false, defaultVal = '' } = {}) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const prompt = defaultVal ? `${question} [${defaultVal}]: ` : question;
    process.stdout.write(prompt);
    if (!stdin.isTTY) return resolve(defaultVal);
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
          return resolve(value.trim() || defaultVal);
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

let apiKey = process.argv[2] || (await ask('Resend API Key (re_...): ', { hidden: true }));
if (!apiKey) {
  console.error('API key is required.');
  process.exit(1);
}

// Default from email: Resend requires onboarding@resend.dev until a custom domain is verified
let emailFrom = await ask('From Email Address', { defaultVal: 'Luminary Fragrance <onboarding@resend.dev>' });

const redact = (text) => String(text).split(apiKey).join('***');

// 1. Verify key with Resend API
try {
  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Resend rejected the API key.');
  }
  if (!res.ok) {
    throw new Error(`Resend API answered ${res.status}.`);
  }
  console.log('1/3  Resend accepted this API key');
} catch (err) {
  console.error('1/3  Could not verify key with Resend:', redact(err.message));
  process.exit(1);
}

// 2. Save into .env.local
const env = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
let lines = env.split(/\r?\n/).filter((line) => !/^RESEND_/.test(line) && !/^EMAIL_FROM/.test(line));
while (lines.length && lines[lines.length - 1] === '') lines.pop();

lines.push(`RESEND_API_KEY=${apiKey}`);
lines.push(`EMAIL_FROM=${emailFrom}`);

fs.writeFileSync(ENV_FILE, `${lines.join('\n')}\n`);
console.log(`2/3  Saved RESEND keys in ${ENV_FILE}`);

// 3. Save on Vercel
function addVercelEnv(key, val) {
  const add = (extra) =>
    spawnSync('npx', ['vercel', 'env', 'add', key, 'production', '--force', ...extra], {
      input: val,
      encoding: 'utf8',
      shell: true,
    });
  let result = add(['--sensitive']);
  if (result.status !== 0) result = add([]);
  return result;
}

let res1 = addVercelEnv('RESEND_API_KEY', apiKey);
let res2 = addVercelEnv('EMAIL_FROM', emailFrom);

if (res1.status !== 0 || res2.status !== 0) {
  console.error('3/3  Could not save keys on Vercel. Make sure "npx vercel login" is active.');
  process.exit(1);
}

console.log('3/3  Saved RESEND_API_KEY and EMAIL_FROM on Vercel (production)');
console.log('\nDone! Emails for order confirmations and OTPs will now be sent via Resend.');
