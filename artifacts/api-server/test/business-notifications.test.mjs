import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../src/lib/business-notifications.ts', import.meta.url));
const output = await build({
  entryPoints: [source], bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{
    name: 'isolated-email-dependencies',
    setup(builder) {
      builder.onResolve({ filter: /^(?:\.\/postgres|\.\/logger|@replit\/connectors-sdk)$/ }, args => ({
        path: args.path, namespace: 'fake-email',
      }));
      builder.onLoad({ filter: /.*/, namespace: 'fake-email' }, args => ({
        contents: args.path === './postgres' ? `
          export async function withTransaction(fn) { return fn({}); }
          export async function txQuery(client,sql,params) {
            const state=globalThis.__medicalEmailTest;
            state.calls.push({sql,params});
            if(sql.startsWith('SELECT email FROM')) return [{email:state.email}];
            if(sql.startsWith('SELECT n.notification_id')) return state.rows;
            return [];
          }` : args.path === './logger' ? 'export const logger={warn(){},error(){}};'
          : 'export class ReplitConnectors {constructor(){throw new Error("No live email in tests");}}',
        loader: 'js',
      }));
    },
  }],
});
const { dispatchMedicalEmails, queueMedicalNotification } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`);
function state(rows = []) {
  return globalThis.__medicalEmailTest = { rows, calls: [], email: 'tracker@example.test' };
}
function row(email = 'tracker@example.test') {
  return { notification_id: 12, title: 'Returned incomplete', message: 'File TEST returned.',
    email, email_attempts: 0 };
}

test('unconfigured transport cannot send or touch the outbox', async () => {
  const fixture = state([row()]);
  assert.equal(await dispatchMedicalEmails(() => assert.fail('No email expected'), ''), 0);
  assert.equal(fixture.calls.length, 0);
});
test('successful outbox delivery records sent only after provider success, with a stable idempotency key', async () => {
  const fixture = state([row()]);
  const sends = [];
  assert.equal(await dispatchMedicalEmails(async email => { sends.push(email); }, 'MIS <mis@example.test>'), 1);
  assert.equal(sends[0].idempotencyKey, 'mis-medical-notification-12');
  assert.equal(sends[0].to, 'tracker@example.test');
  assert(fixture.calls.some(call => call.sql.includes("email_status='SENT'")));
  assert(!fixture.calls.some(call => call.sql.includes("email_status='RETRY'")));
});
test('failed delivery remains retryable and is never marked sent', async () => {
  const fixture = state([row()]);
  assert.equal(await dispatchMedicalEmails(async () => { throw new Error('Provider unavailable'); }, 'mis@example.test'), 0);
  assert(fixture.calls.some(call => call.sql.includes("email_status='RETRY'") && call.sql.includes('email_attempts=email_attempts+1')));
  assert(!fixture.calls.some(call => call.sql.includes("email_status='SENT'")));
});
test('missing recipient is explicit and never calls the provider', async () => {
  const fixture = state([row(null)]);
  assert.equal(await dispatchMedicalEmails(() => assert.fail('No recipient'), 'mis@example.test'), 0);
  assert(fixture.calls.some(call => call.sql.includes("email_status='NO_RECIPIENT'")));
});
test('medical decisions queue tracker notifications without claiming unconfigured emails were sent', async () => {
  const fixture = state();
  const previous = process.env.MIS_EMAIL_FROM;
  delete process.env.MIS_EMAIL_FROM;
  try {
    assert.deepEqual(await queueMedicalNotification({}, 'TEST-FILE', 9, 'tracker', 'RI', 'Missing form'),
      { email_status: 'WAITING_CONFIGURATION' });
    const notification = fixture.calls.find(call => call.sql.includes('INSERT INTO crm.business_notifications'));
    assert.equal(notification.params[2], 'tracker');
    assert.match(notification.params[4], /Register Queue/);
    fixture.email = null;
    assert.deepEqual(await queueMedicalNotification({}, 'TEST-FILE', 10, 'tracker', 'D', 'Declined'),
      { email_status: 'NO_RECIPIENT' });
  } finally {
    if (previous === undefined) delete process.env.MIS_EMAIL_FROM;
    else process.env.MIS_EMAIL_FROM = previous;
  }
});
