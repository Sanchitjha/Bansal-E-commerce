/**
 * Saves the MongoDB Atlas password for you, so you never have to edit .env.local by hand.
 *
 *   node scripts/set-mongo-uri.mjs
 *
 * It asks for the database password (what you type is hidden), then
 *   1. writes MONGODB_URI into .env.local,
 *   2. checks that the database really accepts the connection,
 *   3. saves the same value as MONGODB_URI on Vercel (production).
 * The password is never printed.
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import mongoose from 'mongoose';

const ENV_FILE = '.env.local';

function askHidden(question) {
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
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

const env = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
const found = env.match(/^MONGODB_URI=mongodb\+srv:\/\/([^:@\s]+):[^@\s]*@(\S+)$/m);
if (!found) {
  console.error(`Could not find the MONGODB_URI line in ${ENV_FILE}. Ask Claude to add it again.`);
  process.exit(1);
}
const [, user, rest] = found;

// `--vercel-only` reuses the password already saved in .env.local and only (re)sends it to Vercel.
const vercelOnly = process.argv.includes('--vercel-only');
const savedPassword = decodeURIComponent(env.match(/^MONGODB_URI=mongodb\+srv:\/\/[^:@\s]+:([^@\s]*)@/m)[1]);

const password = vercelOnly ? savedPassword : await askHidden(`Atlas password for "${user}" (typing is hidden): `);
if (!password || password === 'REPLACE_WITH_PASSWORD') {
  console.error('No password entered. Run the command again and paste the password.');
  process.exit(1);
}

const uri = `mongodb+srv://${user}:${encodeURIComponent(password)}@${rest}`;
const redact = (text) => String(text).split(password).join('***').split(encodeURIComponent(password)).join('***');

if (vercelOnly) {
  console.log(`1/3  Using the password already saved in ${ENV_FILE}`);
} else {
  fs.writeFileSync(ENV_FILE, env.replace(/^MONGODB_URI=.*$/m, () => `MONGODB_URI=${uri}`));
  console.log(`1/3  Saved MONGODB_URI in ${ENV_FILE}`);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  await mongoose.connection.db.admin().ping();
  await mongoose.disconnect();
  console.log('2/3  Connected to MongoDB Atlas successfully');
} catch (err) {
  console.error('2/3  Could not connect to MongoDB Atlas:', redact(err.message));
  console.error('     Check the password, and that Network Access allows 0.0.0.0/0 (Allow access from anywhere).');
  process.exit(1);
}

const add = (extra) =>
  spawnSync('npx', ['vercel', 'env', 'add', 'MONGODB_URI', 'production', '--force', ...extra], {
    input: uri,
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
  console.error('\nIf it asks you to log in, run "npx vercel login" first, then run this script again with --vercel-only.');
  process.exit(1);
}
console.log('3/3  Saved MONGODB_URI on Vercel (production)');
console.log('\nDone. Tell Claude "ho gaya".');
