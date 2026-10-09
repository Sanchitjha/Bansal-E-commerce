/**
 * Saves your Razorpay keys so you never have to edit .env.local by hand.
 *
 *   node scripts/set-razorpay-keys.mjs
 *
 * It asks for the Razorpay Key ID, Key Secret, and Webhook Secret (typing is hidden for secrets), then
 *   1. checks them with Razorpay's API,
 *   2. writes RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET into .env.local,
 *   3. saves the same values on Vercel (production).
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

let keyId = await ask('Razorpay Key ID (rzp_live_... or rzp_test_...): ');
let keySecret = await ask('Razorpay Key Secret (typing is hidden): ', { hidden: true });
let webhookSecret = await ask('Razorpay Webhook Secret (optional, press Enter to skip): ', { hidden: true });

if (!keyId || !keySecret || /[<>\s]/.test(keyId + keySecret)) {
  console.error('Key ID and Key Secret are both required (no spaces or < > signs). Run the command again.');
  process.exit(1);
}

const redact = (text) => String(text).split(keySecret).join('***').split(webhookSecret || '---').join('***');

// 1. Verify keys with Razorpay API
try {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders?count=1', {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Razorpay rejected the Key ID or Key Secret.');
  }
  if (!res.ok) {
    throw new Error(`Razorpay API answered ${res.status}.`);
  }
  console.log('1/3  Razorpay accepted these credentials');
} catch (err) {
  console.error('1/3  Could not verify keys with Razorpay:', redact(err.message));
  process.exit(1);
}

// 2. Save into .env.local
const env = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
let lines = env.split(/\r?\n/).filter((line) => !/^RAZORPAY_/.test(line));
while (lines.length && lines[lines.length - 1] === '') lines.pop();

lines.push(`RAZORPAY_KEY_ID=${keyId}`);
lines.push(`RAZORPAY_KEY_SECRET=${keySecret}`);
if (webhookSecret) {
  lines.push(`RAZORPAY_WEBHOOK_SECRET=${webhookSecret}`);
}

fs.writeFileSync(ENV_FILE, `${lines.join('\n')}\n`);
console.log(`2/3  Saved RAZORPAY keys in ${ENV_FILE}`);

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

let res1 = addVercelEnv('RAZORPAY_KEY_ID', keyId);
let res2 = addVercelEnv('RAZORPAY_KEY_SECRET', keySecret);
let res3 = webhookSecret ? addVercelEnv('RAZORPAY_WEBHOOK_SECRET', webhookSecret) : { status: 0 };

if (res1.status !== 0 || res2.status !== 0 || res3.status !== 0) {
  console.error('3/3  Could not save keys on Vercel. Make sure "npx vercel login" is active.');
  process.exit(1);
}

console.log('3/3  Saved RAZORPAY keys on Vercel (production)');
console.log('\nDone! Webhook URL for your Razorpay dashboard:');
console.log('  https://www.luminaryfragrance.com/api/payments/webhook');
console.log('Events to select in Razorpay Webhooks: payment.captured, order.paid');
